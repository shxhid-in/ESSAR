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

interface PaymentHistoryItem {
  id: number;
  invoice_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  invoice, 
  onClose, 
  onSave, 
  isLoading 
}) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque', 'Other'];

  const remainingBalance = invoice.grandTotal - totalPaid;
  const paymentStatus = totalPaid === 0 ? 'unpaid' : totalPaid >= invoice.grandTotal ? 'paid' : 'pending';

  // Load payment history
  useEffect(() => {
    const loadPaymentHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await (window.electronAPI as any).getInvoicePaymentHistory(parseInt(invoice.id));
        setPaymentHistory(history || []);
        
        // Calculate total from all payments
        const total = (history || []).reduce((sum: number, payment: PaymentHistoryItem) => sum + (payment.amount_paid || 0), 0);
        setTotalPaid(total);
      } catch (error) {
        console.error('Failed to load payment history:', error);
        setPaymentHistory([]);
        setTotalPaid(0);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadPaymentHistory();
  }, [invoice.id]);

  // Calculate running balance for each payment (newest first, so we calculate backwards)
  const calculateRunningBalances = () => {
    let runningTotal = invoice.grandTotal;
    const balances: { [key: number]: number } = {};
    
    // Process from oldest to newest to calculate running balance
    const sortedByDate = [...paymentHistory].sort((a, b) => {
      const dateA = new Date(a.created_at || a.payment_date).getTime();
      const dateB = new Date(b.created_at || b.payment_date).getTime();
      return dateA - dateB;
    });
    
    sortedByDate.forEach(payment => {
      runningTotal -= payment.amount_paid;
      balances[payment.id] = runningTotal;
    });
    
    return balances;
  };

  const runningBalances = calculateRunningBalances();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];
    
    if (newPaymentAmount <= 0) {
      validationErrors.push('Payment amount must be greater than 0');
    }
    
    if (newPaymentAmount > remainingBalance) {
      validationErrors.push(`Payment amount cannot exceed remaining balance (${invoice.currency} ${remainingBalance.toFixed(2)})`);
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
        amountPaid: newPaymentAmount,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        notes: undefined
      });
      
      // Reload payment history after save
      const history = await (window.electronAPI as any).getInvoicePaymentHistory(parseInt(invoice.id));
      setPaymentHistory(history || []);
      const total = (history || []).reduce((sum: number, payment: PaymentHistoryItem) => sum + (payment.amount_paid || 0), 0);
      setTotalPaid(total);
      
      // Reset form
      setNewPaymentAmount(0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Cash');
    } catch (error) {
      console.error('Payment save failed:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to save payment']);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment entry?')) {
      return;
    }

    setIsDeleting(paymentId);
    try {
      await (window.electronAPI as any).deleteInvoicePayment(paymentId);
      
      // Reload payment history after delete
      const history = await (window.electronAPI as any).getInvoicePaymentHistory(parseInt(invoice.id));
      setPaymentHistory(history || []);
      const total = (history || []).reduce((sum: number, payment: PaymentHistoryItem) => sum + (payment.amount_paid || 0), 0);
      setTotalPaid(total);
    } catch (error) {
      console.error('Payment delete failed:', error);
      alert(`Failed to delete payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMarkFullPayment = () => {
    setNewPaymentAmount(remainingBalance);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
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
          {/* Invoice Summary - Full Width */}
          <div className="payment-summary">
            <div className="summary-row">
              <span className="summary-label">Invoice Total:</span>
              <span className="summary-value">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total Paid:</span>
              <span className="summary-value">{invoice.currency} {totalPaid.toFixed(2)}</span>
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

          {/* Two Column Layout */}
          <div className="payment-content-grid">
            {/* Left Column - Payment History */}
            <div className="payment-history-column">
              <h3 className="payment-history-title">Payment History</h3>
              {isLoadingHistory ? (
                <div className="loading-state">Loading payment history...</div>
              ) : paymentHistory.length === 0 ? (
                <div className="empty-state">No payments recorded yet</div>
              ) : (
                <div className="payment-history-table-wrapper">
                  <table className="payment-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Balance After</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.payment_date)}</td>
                          <td className="amount-cell">{invoice.currency} {payment.amount_paid.toFixed(2)}</td>
                          <td>{payment.payment_method}</td>
                          <td className={`balance-cell ${runningBalances[payment.id] <= 0 ? 'balance-paid' : 'balance-remaining'}`}>
                            {invoice.currency} {runningBalances[payment.id]?.toFixed(2) || '0.00'}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="action-btn-modern delete"
                              title="Delete Payment"
                              disabled={isDeleting === payment.id}
                            >
                              {isDeleting === payment.id ? (
                                <span>...</span>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Column - Add Payment Form */}
            <div className="add-payment-column">
              {remainingBalance > 0 ? (
                <>
                  <h3 className="add-payment-title">Add New Payment</h3>
                  <form onSubmit={handleSubmit} className="payment-form">
                    <div className="form-group">
                      <label className="form-label">Payment Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={paymentDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          const today = new Date().toISOString().split('T')[0];
                          if (selectedDate <= today) {
                            setPaymentDate(selectedDate);
                          }
                        }}
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

                    <div className="form-group">
                      <label className="form-label">Payment Amount *</label>
                      <div className="amount-input-group">
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          max={remainingBalance}
                          step="0.01"
                          value={newPaymentAmount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setNewPaymentAmount(Math.min(value, remainingBalance));
                          }}
                          placeholder="0.00"
                          required
                        />
                        <span className="currency-label">{invoice.currency}</span>
                      </div>
                      <small className="form-hint">Maximum: {invoice.currency} {remainingBalance.toFixed(2)}</small>
                    </div>

                     <div className="form-group">
                       <button
                         type="button"
                         className="btn btn-secondary btn-full-width"
                         onClick={handleMarkFullPayment}
                         disabled={remainingBalance <= 0}
                       >
                         Pay Full Balance
                       </button>
                     </div>

                     <div className="payment-form-buttons">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={isLoading}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || newPaymentAmount <= 0}
                      >
                        {isLoading ? 'Saving...' : 'Add Payment'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="payment-complete-message">
                  <p>✓ Invoice is fully paid!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
