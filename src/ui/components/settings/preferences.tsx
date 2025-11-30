import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PreferencesProps {
  initialValues?: {
    default_currency?: string;
    tax_rate?: number;
    invoice_prefix?: string;
    base_currency?: string;
  };
}

export default function Preferences({ initialValues = {} }: PreferencesProps) {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    default_currency: initialValues.default_currency || 'USD',
    tax_rate: initialValues.tax_rate || 0,
    invoice_prefix: initialValues.invoice_prefix || 'INV',
    base_currency: initialValues.base_currency || 'INR'
  });
  
  const { mutate: updateSettings, isLoading } = useMutation(
    (settings: Partial<PreferencesProps['initialValues']>) => 
      (window.electronAPI as any).updateSettings(settings),
    {
      onSuccess: () => queryClient.invalidateQueries(['settings'])
    }
  );
  
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
  };
  
  return (
    <div>
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="card">
          <h3 className="card-title">Invoice Settings</h3>
          
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select
                value={settings.default_currency}
                onChange={(e) => setSettings({...settings, default_currency: e.target.value})}
                className="form-select"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Base Currency (for Analytics)</label>
              <select
                value={settings.base_currency}
                onChange={(e) => setSettings({...settings, base_currency: e.target.value})}
                className="form-select"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
              <small className="form-help">All analytics will be converted to this currency</small>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Invoice Prefix</label>
            <input
              type="text"
              value={settings.invoice_prefix}
              onChange={(e) => setSettings({...settings, invoice_prefix: e.target.value})}
              className="form-input"
              placeholder="INV"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.tax_rate}
              onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value) || 0})}
              className="form-input"
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="btn-group">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}