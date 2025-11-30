import React from 'react';
import type { Invoice } from '../../../electron/database';

interface DeleteConfirmationProps {
  invoice: Invoice;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ 
  invoice, 
  onConfirm, 
  onCancel, 
  isLoading 
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content delete-confirmation">
        <div className="modal-header">
          <h2 className="modal-title">Delete Invoice</h2>
          <button
            onClick={onCancel}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="confirmation-content">
            <div className="confirmation-message">
              <p>Are you sure you want to delete this invoice?</p>
              <div className="invoice-details">
                <div className="detail-item">
                  <span className="label">Invoice #:</span>
                  <span className="value">{invoice.invoiceNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Customer:</span>
                  <span className="value">{invoice.customerName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Amount:</span>
                  <span className="value">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="warning-text">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={onCancel}
            className="btn btn-outline"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
