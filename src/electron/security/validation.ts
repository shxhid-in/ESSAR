// Input validation schemas
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// Sanitize HTML content to prevent XSS (simple implementation)
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match] || match;
    })
    .trim();
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Validate currency code
export function validateCurrencyCode(code: string): boolean {
  const validCodes = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
  return validCodes.includes(code.toUpperCase());
}

// Validate invoice number format
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  // YYYYMMNNNNN format (11 digits: 4 year + 2 month + 5 serial)
  const invoiceRegex = /^\d{4}\d{2}\d{5}$/;
  return invoiceRegex.test(invoiceNumber);
}

// Validate price (positive number with max 2 decimal places)
export function validatePrice(price: number): boolean {
  return price >= 0 && Number.isFinite(price) && price <= 999999.99;
}

// Validate customer data
export function validateCustomer(customer: any): ValidationResult {
  const errors: string[] = [];
  
  if (!customer.name || typeof customer.name !== 'string') {
    errors.push('Customer name is required and must be a string');
  } else if (customer.name.length < 2 || customer.name.length > 100) {
    errors.push('Customer name must be between 2 and 100 characters');
  } else if (!/^[a-zA-Z\s\-\.]+$/.test(customer.name)) {
    errors.push('Customer name contains invalid characters');
  }
  
  if (customer.email && !validateEmail(customer.email)) {
    errors.push('Invalid email format');
  }
  
  if (customer.phone && !validatePhone(customer.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (customer.address && customer.address.length > 500) {
    errors.push('Address must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? {
      name: sanitizeHtml(customer.name?.trim() || ''),
      email: customer.email ? sanitizeHtml(customer.email.trim()) : null,
      phone: customer.phone ? sanitizeHtml(customer.phone.trim()) : null,
      address: customer.address ? sanitizeHtml(customer.address.trim()) : null
    } : undefined
  };
}

// Validate invoice data
export function validateInvoice(invoice: any): ValidationResult {
  const errors: string[] = [];
  
  // Validate customer information
  const customerValidation = validateCustomer({
    name: invoice.customerName,
    email: invoice.customerEmail,
    phone: invoice.phone,
    address: invoice.customerAddress
  });
  
  if (!customerValidation.isValid) {
    errors.push(...customerValidation.errors);
  }
  
  // Validate currency
  if (!invoice.currency || !validateCurrencyCode(invoice.currency)) {
    errors.push('Invalid currency code');
  }
  
  // Validate items
  if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push('Invoice must have at least one item');
  } else {
    invoice.items.forEach((item: any, index: number) => {
      if (!item.serviceName || typeof item.serviceName !== 'string') {
        errors.push(`Item ${index + 1}: Service name is required`);
      } else if (item.serviceName.length > 100) {
        errors.push(`Item ${index + 1}: Service name too long`);
      }
      
      if (typeof item.price !== 'number' || !validatePrice(item.price)) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
      
      if (item.serviceDescription && item.serviceDescription.length > 500) {
        errors.push(`Item ${index + 1}: Description too long`);
      }
    });
  }
  
  // Validate discount (unlimited, but must be non-negative)
  if (invoice.discount && (typeof invoice.discount !== 'number' || invoice.discount < 0 || !Number.isFinite(invoice.discount))) {
    errors.push('Discount must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? {
      ...invoice,
      customerName: customerValidation.sanitizedData?.name,
      customerEmail: customerValidation.sanitizedData?.email,
      phone: customerValidation.sanitizedData?.phone,
      customerAddress: customerValidation.sanitizedData?.address,
      refNo: invoice.refNo ? sanitizeHtml(invoice.refNo.trim()) : '',
      items: invoice.items.map((item: any) => ({
        ...item,
        serviceName: sanitizeHtml(item.serviceName?.trim() || ''),
        serviceDescription: item.serviceDescription ? sanitizeHtml(item.serviceDescription.trim()) : ''
      }))
    } : undefined
  };
}

// Validate service data
export function validateService(service: any): ValidationResult {
  const errors: string[] = [];
  
  if (!service.name || typeof service.name !== 'string') {
    errors.push('Service name is required and must be a string');
  } else if (service.name.length < 2 || service.name.length > 100) {
    errors.push('Service name must be between 2 and 100 characters');
  } else if (!/^[a-zA-Z0-9\s\-\.]+$/.test(service.name)) {
    errors.push('Service name contains invalid characters');
  }
  
  if (service.description && service.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? {
      name: sanitizeHtml(service.name?.trim() || ''),
      description: service.description ? sanitizeHtml(service.description.trim()) : ''
    } : undefined
  };
}

// Validate currency data
export function validateCurrency(currency: any): ValidationResult {
  const errors: string[] = [];
  
  if (!currency.code || !validateCurrencyCode(currency.code)) {
    errors.push('Invalid currency code');
  }
  
  if (!currency.name || typeof currency.name !== 'string') {
    errors.push('Currency name is required');
  } else if (currency.name.length > 50) {
    errors.push('Currency name too long');
  }
  
  if (!currency.symbol || typeof currency.symbol !== 'string') {
    errors.push('Currency symbol is required');
  } else if (currency.symbol.length > 10) {
    errors.push('Currency symbol too long');
  }
  
  if (typeof currency.exchange_rate !== 'number' || currency.exchange_rate <= 0) {
    errors.push('Exchange rate must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? {
      code: currency.code.toUpperCase(),
      name: sanitizeHtml(currency.name?.trim() || ''),
      symbol: sanitizeHtml(currency.symbol?.trim() || ''),
      exchange_rate: currency.exchange_rate
    } : undefined
  };
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}
