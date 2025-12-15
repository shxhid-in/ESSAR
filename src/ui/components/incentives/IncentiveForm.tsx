import React, { useState, useEffect } from 'react';
import type { Incentive } from '../../../electron/database';

interface IncentiveFormProps {
  incentive?: Incentive;
  onClose: () => void;
  onSave: (incentiveData: Omit<Incentive, 'id' | 'created_at'>) => Promise<void>;
  isLoading?: boolean;
}

const IncentiveForm: React.FC<IncentiveFormProps> = ({ 
  incentive, 
  onClose, 
  onSave, 
  isLoading 
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Commission');
  const [errors, setErrors] = useState<string[]>([]);

  const categories = ['Commission', 'Bonus', 'Reward', 'Other'];

  useEffect(() => {
    if (incentive) {
      setDate(incentive.date ? new Date(incentive.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setAmount(incentive.amount || 0);
      setProvider(incentive.provider || '');
      setDescription(incentive.description || '');
      setCategory(incentive.category || 'Commission');
    }
  }, [incentive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];
    
    if (!date) {
      validationErrors.push('Date is required');
    }
    
    if (!amount || amount <= 0) {
      validationErrors.push('Amount must be greater than 0');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSave({
        date: new Date(date).toISOString(),
        amount,
        provider: provider.trim() || undefined,
        description: description.trim() || undefined,
        category: category || 'Commission'
      });
    } catch (error) {
      console.error('Incentive save failed:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to save incentive']);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content incentive-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {incentive ? 'Edit Incentive' : 'New Incentive'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <div key={index} className="error-message">{error}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="incentive-form">
            <div className="incentive-form-row incentive-actions-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="incentive-form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Provider (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g., Airline, Hotel Chain, etc."
                />
              </div>
            </div>

            <div className="incentive-form-row">
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional details about this incentive..."
                  rows={2}
                />
              </div>

              <div className="form-group incentive-form-actions">
                <label className="form-label">&nbsp;</label>
                <div className="incentive-form-buttons">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : (incentive ? 'Update' : 'Create')}
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

export default IncentiveForm;

