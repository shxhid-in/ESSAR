import React from 'react';
import type { Invoice } from '../../../electron/database';

interface InvoiceListProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoice: Invoice) => void;
  onDownloadInvoice: (invoice: Invoice) => void;
  onTrackPayment: (invoice: Invoice) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
  sortOption: 'newest' | 'oldest' | 'paid' | 'pending' | 'unpaid';
  onChangeSort: (option: 'newest' | 'oldest' | 'paid' | 'pending' | 'unpaid') => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  invoices, 
  onViewInvoice, 
  onEditInvoice,
  onDeleteInvoice,
  onDownloadInvoice,
  onTrackPayment,
  onCreateNew,
  isLoading,
  sortOption,
  onChangeSort
}) => {
  
  const getPaymentStatusClass = (status?: string) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'unpaid': return 'status-unpaid';
      default: return 'status-unpaid';
    }
  };

  const getPaymentStatusText = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'paid') return 'Paid';
    if (invoice.paymentStatus === 'pending') return 'Pending';
    return 'Unpaid';
  };
  if (isLoading) {
    return (
      <div className="card">
        <div className="loading-state">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="invoice-list-wrapper">
      <div className="invoice-list-header-modern">
        <div className="header-left">
          <h2 className="invoice-list-title">Invoices</h2>
          <span className="invoice-count-badge">{invoices.length}</span>
        </div>
        <div className="sort-container">
          <select
            className="sort-select"
            value={sortOption}
            onChange={(e) => onChangeSort(e.target.value as any)}
            aria-label="Sort invoices"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="paid">Paid first</option>
            <option value="pending">Pending first</option>
            <option value="unpaid">Unpaid first</option>
          </select>
        </div>
      </div>
      
      {invoices.length === 0 ? (
        <div className="invoice-empty-state-modern">
          <div className="empty-state-title-modern">No invoices yet</div>
          <div className="empty-state-description-modern">
            Create your first invoice to get started
          </div>
          <div className="empty-state-actions">
            <button
              onClick={onCreateNew}
              className="btn btn-primary btn-modern"
            >
              Create First Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="invoice-list-modern">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`invoice-card-modern ${getPaymentStatusClass(invoice.paymentStatus)}`}
              onClick={() => onViewInvoice(invoice)}
            >
              <div className="invoice-card-content">
                <div className="invoice-card-header">
                  <div className="invoice-number-modern">{invoice.invoiceNumber}</div>
                </div>
                
                <div className="invoice-card-body">
                  <div className="invoice-customer-modern">
                    <div className="customer-name-modern">{invoice.customerName}</div>
                    <div className="customer-phone-modern">{invoice.phone}</div>
                  </div>
                  
                  <div className="invoice-details-modern">
                    <div className="detail-item">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total</span>
                      <span className="detail-value total-amount">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="invoice-card-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                <div className="invoice-card-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditInvoice(invoice); }}
                    className="action-btn-modern"
                    title="Edit Invoice"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownloadInvoice(invoice); }}
                    className="action-btn-modern"
                    title="Download PDF"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteInvoice(invoice); }}
                    className="action-btn-modern delete"
                    title="Delete Invoice"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onTrackPayment(invoice); }}
                  className={`payment-status-badge-modern ${getPaymentStatusClass(invoice.paymentStatus)}`}
                  title="Track Payment"
                >
                  {getPaymentStatusText(invoice)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
