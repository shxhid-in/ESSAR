import React, { useState, useEffect } from 'react';
import type { Invoice } from '../../../electron/database';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (paymentData: {
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  invoice, 
  onClose, 
  onSave, 
  isLoading 
}) => {
  const [amountPaid, setAmountPaid] = useState(invoice.amountPaid || 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque', 'Other'];

  const remainingBalance = invoice.grandTotal - amountPaid;
  const paymentStatus = amountPaid === 0 ? 'unpaid' : amountPaid >= invoice.grandTotal ? 'paid' : 'pending';

  useEffect(() => {
    // Load existing payment data if available
    const loadPaymentData = async () => {
      try {
        const payment = await (window.electronAPI as any).getInvoicePayment(parseInt(invoice.id));
        if (payment) {
          setAmountPaid(payment.amount_paid || 0);
          setPaymentDate(payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0]);
          setPaymentMethod(payment.payment_method || 'Cash');
          setNotes(payment.notes || '');
        }
      } catch (error) {
        console.error('Failed to load payment data:', error);
      }
    };
    loadPaymentData();
  }, [invoice.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];
    
    if (amountPaid < 0) {
      validationErrors.push('Amount paid cannot be negative');
    }
    
    if (amountPaid > invoice.grandTotal) {
      validationErrors.push(`Amount paid cannot exceed grand total (${invoice.currency} ${invoice.grandTotal.toFixed(2)})`);
    }
    
    if (!paymentDate) {
      validationErrors.push('Payment date is required');
    }
    
    if (!paymentMethod) {
      validationErrors.push('Payment method is required');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSave({
        amountPaid,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        notes: notes.trim() || undefined
      });
    } catch (error) {
      console.error('Payment save failed:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to save payment']);
    }
  };

  const handleMarkFullPayment = () => {
    setAmountPaid(invoice.grandTotal);
  };

  const handleClearPayment = () => {
    setAmountPaid(0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Track Payment - Invoice {invoice.invoiceNumber}</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {/* Invoice Summary */}
          <div className="payment-summary">
            <div className="summary-row">
              <span className="summary-label">Invoice Total:</span>
              <span className="summary-value">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Amount Paid:</span>
              <span className="summary-value">{invoice.currency} {(invoice.amountPaid || 0).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Remaining Balance:</span>
              <span className={`summary-value ${remainingBalance > 0 ? 'balance-remaining' : 'balance-paid'}`}>
                {invoice.currency} {remainingBalance.toFixed(2)}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Status:</span>
              <span className={`status-badge status-${paymentStatus}`}>
                {paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'pending' ? 'Pending' : 'Unpaid'}
              </span>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <div key={index} className="error-message">{error}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label className="form-label">Amount Paid *</label>
              <div className="amount-input-group">
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max={invoice.grandTotal}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setAmountPaid(Math.min(value, invoice.grandTotal));
                  }}
                  placeholder="0.00"
                  required
                />
                <span className="currency-label">{invoice.currency}</span>
              </div>
              <div className="quick-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleMarkFullPayment}
                >
                  Mark as Full Payment
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleClearPayment}
                >
                  Clear Payment
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className="form-group notes-with-actions">
              <label className="form-label">Notes (Optional)</label>
              <div className="notes-actions-wrapper">
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this payment..."
                  rows={3}
                />
                <div className="modal-footer-inline">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget.closest('.modal-content')?.querySelector('form');
                      if (form) {
                        form.requestSubmit();
                      }
                    }}
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

