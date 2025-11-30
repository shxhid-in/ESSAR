import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Service, Currency, Invoice } from '../../../electron/database';

interface InvoiceEditorProps {
  invoice: Invoice;
  onSave: (invoiceData: any) => void;
  onCancel: () => void;
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

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ 
  invoice, 
  onSave, 
  onCancel, 
  isLoading 
}) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceDraft>({
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress,
    phone: invoice.phone,
    currency: invoice.currency,
    items: invoice.items.map(item => ({
      serviceName: item.serviceName,
      serviceDescription: item.serviceDescription,
      purchasePrice: item.purchasePrice || 0,
      price: item.price
    })),
    discount: invoice.discount,
    refNo: invoice.refNo || '',
    subTotal: invoice.subTotal,
    grandTotal: invoice.grandTotal
  });


  // Fetch services and currencies
  const { data: services = [] } = useQuery<Service[]>(
    ['services'],
    () => window.electronAPI.getServices()
  );

  // Debug: Log services when they change
  useEffect(() => {
    // Services loaded in editor
  }, [services]);

  const { data: currencies = [] } = useQuery(
    ['currencies'],
    () => window.electronAPI.getCurrencies()
  );

  const handleFieldBlur = () => {
    // Field blur handler (kept for consistency)
  };

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
    // Updating item
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

  const handleSubmit = () => {
    const submitData = {
      ...invoiceData,
      items: invoiceData.items.map(item => ({
        serviceName: item.serviceName,
        serviceDescription: item.serviceDescription,
        purchasePrice: item.purchasePrice,
        price: item.price
      }))
    };
    onSave(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content invoice-creator">
        <div className="modal-header">
          <h2 className="modal-title">Edit Invoice {invoice.invoiceNumber}</h2>
          <button
            onClick={onCancel}
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
                  <input
                    type="text"
                    className="form-input"
                    value={invoiceData.customerName}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                    onBlur={handleFieldBlur}
                    placeholder="Enter customer name"
                  />
                </div>
                
                  <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Address</label>
                    <input
                      type="text"
                    className="form-input"
                    value={invoiceData.customerAddress}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    onBlur={handleFieldBlur}
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
                    onBlur={handleFieldBlur}
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
                    onBlur={handleFieldBlur}
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
                    onBlur={handleFieldBlur}
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
                      onBlur={handleFieldBlur}
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
                         onChange={(e) => updateItem(index, 'serviceName', e.target.value)}
                         onBlur={handleFieldBlur}
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
                         onBlur={handleFieldBlur}
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
                          value={item.purchasePrice || 0}
                          onChange={(e) => updateItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          onBlur={handleFieldBlur}
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
                           onBlur={handleFieldBlur}
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
            onClick={onCancel}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isLoading || !invoiceData.customerName || invoiceData.items.length === 0}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;

