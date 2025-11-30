import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Customer } from '../../../electron/database';
import InvoiceViewer from '../invoices/invoiceViewer';

interface CustomerInvoiceModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

const CustomerInvoiceModal: React.FC<CustomerInvoiceModalProps> = ({
  customer,
  isOpen,
  onClose,
  onViewInvoice
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['customer-invoices', customer.name, customer.phone],
    queryFn: async () => {
      if (!customer.name || !customer.phone) return [];
      const result = await (window.electronAPI as any).getInvoicesByCustomer(customer.name, customer.phone);
      // Customer invoices loaded
      return result;
    },
    enabled: isOpen && !!customer.name && !!customer.phone
  });

  const handleInvoiceClick = (invoiceId: string) => {
    const invoice = invoices?.find((inv: any) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoiceId(invoiceId);
      setSelectedInvoice(invoice);
      setShowInvoiceViewer(true);
    }
  };

  const handleCloseInvoiceViewer = () => {
    setShowInvoiceViewer(false);
    setSelectedInvoice(null);
    setSelectedInvoiceId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content customer-invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Invoices for {customer.name}
          </h2>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="loading-spinner"></div>
              <p>Loading invoices...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-red-600">
              <p>Error loading invoices: {(error as Error).message}</p>
            </div>
          )}

          {!isLoading && !error && (!invoices || invoices.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No invoices found for this customer.</p>
            </div>
          )}

          {!isLoading && !error && invoices && invoices.length > 0 && (
            <div className="invoice-list-container">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: any) => {
                      // Rendering invoice
                      return (
                      <tr 
                        key={invoice.id}
                        className={`invoice-row ${selectedInvoiceId === invoice.id ? 'selected' : ''}`}
                        onClick={() => handleInvoiceClick(invoice.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="invoice-number">
                          {invoice.invoiceNumber || 'N/A'}
                        </td>
                        <td className="invoice-date">
                          {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="invoice-total">
                          {invoice.currency} {invoice.grandTotal ? invoice.grandTotal.toFixed(2) : '0.00'}
                        </td>
                        <td>{invoice.currency || 'USD'}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && !error && invoices && invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No invoices found for this customer.</p>
              <p className="text-sm mt-2">Customer: {customer.name} ({customer.phone})</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {showInvoiceViewer && selectedInvoice && (
        <InvoiceViewer
          invoice={selectedInvoice}
          onClose={handleCloseInvoiceViewer}
        />
      )}
    </div>
  );
};

export default CustomerInvoiceModal;
