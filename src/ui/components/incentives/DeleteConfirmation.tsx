import React from 'react';
import type { Incentive } from '../../../electron/database';

interface DeleteConfirmationProps {
  incentive: Incentive;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  incentive,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Incentive</h2>
          <button
            onClick={onCancel}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="confirmation-message">
            Are you sure you want to delete this incentive?
          </p>
          <div className="confirmation-details">
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">
                {new Date(incentive.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">₹{incentive.amount.toFixed(2)}</span>
            </div>
            {incentive.description && (
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{incentive.description}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{incentive.category || 'Commission'}</span>
            </div>
          </div>
          <p className="confirmation-warning">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;

