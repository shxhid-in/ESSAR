import { useState, useEffect } from 'react';
import type { Customer } from '../../../electron/database';

interface CustomerFormProps {
  initialData?: Partial<Customer>;
  onSubmit: (customer: Omit<Customer, 'id'> & { phone: string }) => Promise<number>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function CustomerForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: CustomerFormProps) {
  const [customer, setCustomer] = useState<Omit<Customer, 'id'> & { phone: string }>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || ''
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    setCustomer({
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || ''
    });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Include the ID when editing an existing customer
    const customerData = initialData?.id 
      ? { ...customer, id: initialData.id }
      : customer;
    
    try {
      await onSubmit(customerData);
      
      // Clear form only if it's a new customer (not editing)
      if (!initialData?.id) {
        setCustomer({
          name: '',
          phone: '',
          email: '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input
          type="text"
          value={customer.name}
          onChange={(e) => {
            // Customer name changed
            setCustomer({...customer, name: e.target.value});
          }}
          onFocus={() => {/* Customer name input focused */}}
          className="form-input"
          placeholder="Enter customer name"
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Phone *</label>
        <input
          type="tel"
          value={customer.phone}
          onChange={(e) => setCustomer({...customer, phone: e.target.value})}
          className="form-input"
          placeholder="Enter phone number"
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          value={customer.email}
          onChange={(e) => setCustomer({...customer, email: e.target.value})}
          className="form-input"
          placeholder="Enter email address"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea
          value={customer.address}
          onChange={(e) => setCustomer({...customer, address: e.target.value})}
          className="form-input"
          placeholder="Enter address"
          rows={3}
        />
      </div>
      
      <div className="btn-group">
        <button 
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Saving...' : 'Save Customer'}
        </button>
        
        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}