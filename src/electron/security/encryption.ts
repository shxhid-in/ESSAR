import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Generate or retrieve encryption key
function getEncryptionKey(): Buffer {
  // In a real application, you'd want to store this securely
  // For now, we'll generate a consistent key based on app data path
  const keySource = process.env.ENCRYPTION_KEY || 'essar-travel-billing-default-key-2024';
  return crypto.scryptSync(keySource, 'salt', KEY_LENGTH);
}

// Encrypt sensitive data
export function encryptData(plaintext: string): string {
  if (!plaintext || plaintext.trim() === '') {
    return plaintext;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('essar-billing', 'utf8'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const combined = iv.toString('hex') + tag.toString('hex') + encrypted;
    return combined;
  } catch (error) {
    console.error('Encryption failed:', error);
    return plaintext; // Return original data if encryption fails
  }
}

// Decrypt sensitive data
export function decryptData(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim() === '') {
    return encryptedData;
  }

  // Check if data is actually encrypted (has the right length and format)
  if (!isEncrypted(encryptedData)) {
    return encryptedData; // Return as-is if not encrypted
  }

  try {
    const key = getEncryptionKey();
    
    // Extract IV, tag, and encrypted data
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('essar-billing', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Return original data if decryption fails
  }
}

// Hash sensitive data (one-way encryption for passwords, etc.)
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

// Verify hashed data
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
}

// Encrypt customer data
export function encryptCustomerData(customer: any): any {
  return {
    ...customer,
    name: encryptData(customer.name),
    email: customer.email ? encryptData(customer.email) : customer.email,
    phone: customer.phone ? encryptData(customer.phone) : customer.phone,
    address: customer.address ? encryptData(customer.address) : customer.address
  };
}

// Decrypt customer data
export function decryptCustomerData(customer: any): any {
  return {
    ...customer,
    name: decryptData(customer.name),
    email: customer.email ? decryptData(customer.email) : customer.email,
    phone: customer.phone ? decryptData(customer.phone) : customer.phone,
    address: customer.address ? decryptData(customer.address) : customer.address
  };
}

// Encrypt invoice data
export function encryptInvoiceData(invoice: any): any {
  return {
    ...invoice,
    customer_name: encryptData(invoice.customer_name),
    customer_address: invoice.customer_address ? encryptData(invoice.customer_address) : invoice.customer_address,
    customer_phone: invoice.customer_phone ? encryptData(invoice.customer_phone) : invoice.customer_phone
  };
}

// Decrypt invoice data
export function decryptInvoiceData(invoice: any): any {
  return {
    ...invoice,
    customer_name: decryptData(invoice.customer_name),
    customer_address: invoice.customer_address ? decryptData(invoice.customer_address) : invoice.customer_address,
    customer_phone: invoice.customer_phone ? decryptData(invoice.customer_phone) : invoice.customer_phone
  };
}

// Encrypt service data
export function encryptServiceData(service: any): any {
  return {
    ...service,
    name: encryptData(service.name),
    description: service.description ? encryptData(service.description) : service.description
  };
}

// Decrypt service data
export function decryptServiceData(service: any): any {
  return {
    ...service,
    name: decryptData(service.name),
    description: service.description ? decryptData(service.description) : service.description
  };
}

// Utility function to check if data is encrypted
export function isEncrypted(data: string): boolean {
  // Check if data looks like encrypted data:
  // 1. Must be a string
  // 2. Must be long enough (IV + TAG + some encrypted data)
  // 3. Must contain only hex characters
  // 4. Must have the right length (multiple of 2 for hex)
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  const minLength = (IV_LENGTH + TAG_LENGTH) * 2 + 10; // At least 10 chars of encrypted data
  return data.length >= minLength && 
         data.length % 2 === 0 && 
         /^[0-9a-f]+$/i.test(data);
}

// Migration function to encrypt existing data
export function migrateDataToEncrypted(existingData: any[], encryptFunction: (item: any) => any): any[] {
  return existingData.map(item => {
    // Check if data is already encrypted
    if (isEncrypted(item.name || '')) {
      return item; // Already encrypted
    }
    return encryptFunction(item);
  });
}
