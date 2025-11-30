import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Service, Currency } from '../../../electron/database';

interface InvoiceCreatorProps {
  onClose: () => void;
  onSave: (invoiceData: any) => Promise<void> | void;
  isLoading?: boolean;
}

interface InvoiceDraft {
  customerName: string;
  customerAddress: string;
  phone: string;
  currency: string;
  items: Array<{
    serviceName: string;
    serviceDescription: string;
    purchasePrice: number;
    price: number;
  }>;
  discount?: number;
  refNo?: string;
  subTotal: number;
  grandTotal: number;
}

const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ 
  onClose, 
  onSave, 
  isLoading 
}) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceDraft>({
    customerName: '',
    customerAddress: '',
    phone: '',
    currency: 'USD',
    items: [{ serviceName: '', serviceDescription: '', purchasePrice: 0, price: 0 }],
    discount: 0,
    refNo: '',
    subTotal: 0,
    grandTotal: 0
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Fetch services, currencies, and customers
  const { data: services = [] } = useQuery<Service[]>(
    ['services'],
    () => window.electronAPI.getServices()
  );

  // Debug: Log services when they change
  useEffect(() => {
    // Services loaded in creator
  }, [services]);

  const { data: currencies = [] } = useQuery(
    ['currencies'],
    () => window.electronAPI.getCurrencies()
  );

  const { data: customers = [], isLoading: customersLoading, refetch: refetchCustomers } = useQuery(
    ['customers'],
    () => (window.electronAPI as any).getCustomers(),
    {
      onSuccess: (data) => {
        // Customers loaded
      },
      onError: (error) => {
        console.error('Failed to load customers:', error);
      }
    }
  );

  // Calculate totals when items change
  useEffect(() => {
    const subTotal = invoiceData.items.reduce((sum, item) => {
      return sum + item.price;
    }, 0);
    const grandTotal = subTotal - (invoiceData.discount || 0);
    setInvoiceData(prev => ({ ...prev, subTotal, grandTotal }));
  }, [invoiceData.items, invoiceData.discount]);

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { serviceName: '', serviceDescription: '', purchasePrice: 0, price: 0 }]
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Customer autocomplete functions
  const filteredCustomers = customers.filter((customer: any) => {
    const searchTerm = customerSearch.toLowerCase().trim();
    if (!searchTerm) return false;
    
    const nameMatch = customer.name.toLowerCase().includes(searchTerm);
    const phoneMatch = customer.phone?.includes(customerSearch) || false;
    const addressMatch = customer.address?.toLowerCase().includes(searchTerm) || false;
    
    const matches = nameMatch || phoneMatch || addressMatch;
    if (matches) {
      // Customer match found
    }
    
    return matches;
  });

  // Debug logging
  // Debug information removed for production

  const handleCustomerSelect = (customer: any) => {
    setInvoiceData(prev => ({
      ...prev,
      customerName: customer.name,
      customerAddress: customer.address || '',
      phone: customer.phone || ''
    }));
    setCustomerSearch(customer.name);
    setShowCustomerSuggestions(false);
  };

  const handleCustomerNameChange = (value: string) => {
    // Customer name change
    setCustomerSearch(value);
    setInvoiceData(prev => ({ ...prev, customerName: value }));
    setShowCustomerSuggestions(value.length > 0);
  };

  const handleSubmit = async () => {
    try {
    // Auto-save customer if it's a new customer
    if (invoiceData.customerName && !customers.find((c: any) => c.name === invoiceData.customerName)) {
      try {
        await (window.electronAPI as any).saveCustomer({
          name: invoiceData.customerName,
          address: invoiceData.customerAddress,
          phone: invoiceData.phone
        });
        // Customer saved successfully
        // Refresh the customers list to include the new customer
        await refetchCustomers();
      } catch (error) {
        console.error('Failed to save customer:', error);
          // Don't block invoice creation if customer save fails
      }
    }

    const submitData = {
      ...invoiceData,
      items: invoiceData.items.map(item => ({
        serviceName: item.serviceName,
        serviceDescription: item.serviceDescription,
          purchasePrice: item.purchasePrice,
        price: item.price
      }))
    };
    
      // Call onSave and wait for it to complete
      // Only clear form if save succeeds (parent's onSuccess will close modal)
      await onSave(submitData);
    
      // Only clear form if we get here (success case)
      // If onSave throws, we won't reach here and form stays intact
      // Clear form only on success - parent will close modal
    setInvoiceData({
      customerName: '',
      customerAddress: '',
      phone: '',
      currency: 'USD',
        items: [{ serviceName: '', serviceDescription: '', purchasePrice: 0, price: 0 }],
      discount: 0,
        refNo: '',
      subTotal: 0,
      grandTotal: 0
    });
    setCustomerSearch('');
    setShowCustomerSuggestions(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Don't clear form on error - keep user's data so they can fix and retry
      // The error is already shown by the mutation's onError handler
      // Form remains fully editable so user can fix issues and retry
      // Modal stays open so user can continue editing
      throw error; // Re-throw so parent can handle it
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content invoice-creator" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Invoice</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="invoice-creator-content">
            <div className="invoice-form-section">
              <div className="form-section">
                <h3>Customer Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer Name</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      className="form-input"
                      value={customerSearch}
                      onChange={(e) => {
                        handleCustomerNameChange(e.target.value);
                      }}
                      onFocus={() => {
                        setShowCustomerSuggestions(customerSearch.length > 0);
                      }}
                      onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                      placeholder="Enter customer name or phone"
                    />
                    {showCustomerSuggestions && (
                      <div className="autocomplete-dropdown">
                        {customersLoading ? (
                          <div className="autocomplete-item">Loading customers...</div>
                        ) : filteredCustomers.length > 0 ? (
                          filteredCustomers.slice(0, 5).map((customer: any) => (
                            <div
                              key={customer.id}
                              className="autocomplete-item"
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              <div className="customer-name">{customer.name}</div>
                              {customer.phone && <div className="customer-phone">{customer.phone}</div>}
                              {customer.address && <div className="customer-address">{customer.address}</div>}
                            </div>
                          ))
                        ) : (
                          <div className="autocomplete-item">No matching customers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                  <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Address</label>
                    <input
                      type="text"
                    className="form-input"
                    value={invoiceData.customerAddress}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="Enter customer address"
                  />
                </div>
                
                  <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={invoiceData.phone}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Currency</label>
                  <select
                    className="form-select"
                    value={invoiceData.currency}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    {currencies.map((currency: any) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
                
                  <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.01"
                    value={invoiceData.discount || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setInvoiceData(prev => ({ ...prev, discount: isNaN(value) ? 0 : value }));
                      }}
                    placeholder="Enter discount amount"
                  />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ref No</label>
                    <input
                      type="text"
                      className="form-input"
                      value={invoiceData.refNo || ''}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, refNo: e.target.value }))}
                      placeholder="Enter reference number"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                  <h3>Invoice Items</h3>
                
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="invoice-item-row" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Service</label>
                      <select
                        className="form-select"
                        value={item.serviceName}
                        onChange={(e) => {
                          updateItem(index, 'serviceName', e.target.value);
                        }}
                      >
                        <option value="">Select a service</option>
                        {services.map((service: any) => (
                          <option key={service.id} value={service.name}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                      <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Description</label>
                        <input
                          type="text"
                        className="form-input"
                        value={item.serviceDescription}
                        onChange={(e) => updateItem(index, 'serviceDescription', e.target.value)}
                        placeholder="Enter service description"
                      />
                    </div>
                    
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Purchase Price</label>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Selling Price</label>
                          <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                      
                        <button
                          onClick={() => removeItem(index)}
                          className="btn btn-danger btn-sm"
                          type="button"
                          style={{ 
                            padding: '8px 12px',
                            minWidth: 'auto',
                          height: 'fit-content',
                          marginBottom: '0'
                          }}
                        >
                          Remove
                        </button>
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={addItem}
                    className="btn btn-outline btn-sm"
                    type="button"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isLoading || !invoiceData.customerName || invoiceData.items.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreator;
