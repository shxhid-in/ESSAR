import React from 'react';
import type { Invoice } from '../../../electron/database';

interface InvoiceListProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoice: Invoice) => void;
  onDownloadInvoice: (invoice: Invoice) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  invoices, 
  onViewInvoice, 
  onEditInvoice,
  onDeleteInvoice,
  onDownloadInvoice,
  onCreateNew,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="loading-state">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="invoice-list-header">
        <div className="card-title">
          Invoice Management 
          <span className="text-sm text-gray-500 ml-2">
            ({invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'})
          </span>
        </div>
        <button
          onClick={onCreateNew}
          className="btn btn-primary"
        >
          New Invoice
        </button>
      </div>
      
      {invoices.length === 0 ? (
        <div className="invoice-list-container">
          <div className="empty-state">
            <div className="empty-state-title">No invoices yet</div>
            <div className="empty-state-description">
              Create your first invoice to get started
            </div>
            <button
              onClick={onCreateNew}
              className="btn btn-primary"
            >
              Create First Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="invoice-list-container">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date Created</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="invoice-row" onClick={() => onViewInvoice(invoice)}>
                    <td className="invoice-number">{invoice.invoiceNumber}</td>
                    <td className="invoice-customer">
                      <div className="customer-info">
                        <span className="font-medium">{invoice.customerName}</span>
                        <span className="text-sm text-gray-500 ml-2">({invoice.phone})</span>
                      </div>
                    </td>
                    <td className="invoice-date">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="invoice-total">
                      <span className="font-medium">
                        {invoice.currency} {invoice.grandTotal.toFixed(2)}
                      </span>
                    </td>
                    <td className="invoice-actions">
                      <div className="action-buttons">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditInvoice(invoice); }}
                          className="action-btn edit-btn"
                          title="Edit Invoice"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDownloadInvoice(invoice); }}
                          className="action-btn download-btn"
                          title="Download PDF"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteInvoice(invoice); }}
                          className="action-btn delete-btn"
                          title="Delete Invoice"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
