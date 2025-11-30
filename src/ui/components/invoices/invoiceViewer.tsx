import React from 'react';
import type { Invoice } from '../../../electron/database';
import { downloadInvoicePDF } from '../../utils/invoiceTemplate';

interface InvoiceViewerProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, onClose }) => {
  const handleDownloadPDF = async () => {
    try {
      await downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header invoice-viewer-header">
          <div className="invoice-header-content">
          <h2 className="modal-title">Invoice {invoice.invoiceNumber}</h2>
            <div className="invoice-meta-info">
              <span className="invoice-date">
                {new Date(invoice.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
              <span className="invoice-currency">{invoice.currency}</span>
              {invoice.refNo && (
                <span className="invoice-ref-no">Ref: {invoice.refNo}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body invoice-viewer-body">
          {/* Customer Section */}
          <div className="invoice-section-card">
            <h3 className="section-title">Bill To</h3>
            <div className="customer-details">
              <div className="customer-detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{invoice.customerName}</span>
                  </div>
              <div className="customer-detail-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">{invoice.customerAddress}</span>
              </div>
              <div className="customer-detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{invoice.phone}</span>
              </div>
              {invoice.pnr && (
                <div className="customer-detail-item">
                  <span className="detail-label">PNR</span>
                  <span className="detail-value">{invoice.pnr}</span>
                </div>
              )}
              </div>
            </div>
            
          {/* Items Section */}
          <div className="invoice-section-card">
            <h3 className="section-title">Items</h3>
            <div className="items-table-wrapper">
              <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Description</th>
                    <th className="text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                      <td className="service-name">{item.serviceName}</td>
                      <td className="service-description">{item.serviceDescription || '-'}</td>
                      <td className="service-price text-right">
                        {invoice.currency} {item.price.toFixed(2)}
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          {/* Totals Section */}
          <div className="invoice-totals-section">
              <div className="total-row">
              <span className="total-label">Sub Total</span>
              <span className="total-value">
                  {invoice.currency} {invoice.subTotal.toFixed(2)}
                </span>
              </div>
              {invoice.discount && invoice.discount > 0 && (
                <div className="total-row">
                <span className="total-label">Discount</span>
                <span className="total-value discount-value">
                    -{invoice.currency} {invoice.discount.toFixed(2)}
                  </span>
                </div>
              )}
            <div className="total-row grand-total-row">
              <span className="total-label">Grand Total</span>
              <span className="total-value grand-total-value">
                  {invoice.currency} {invoice.grandTotal.toFixed(2)}
                </span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer invoice-viewer-footer">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownloadPDF();
            }}
            className="btn btn-primary download-btn"
            title="Download PDF"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;

