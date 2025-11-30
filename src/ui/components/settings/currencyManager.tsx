import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Currency } from '../../../electron/database';

interface CurrencyManagerProps {
  defaultCurrency?: string;
}

export default function CurrencyManager({ defaultCurrency }: CurrencyManagerProps) {
  const queryClient = useQueryClient();
  
  const { data: currencies = [] } = useQuery(
    ['currencies'],
    () => window.electronAPI.getCurrencies()
  );
  
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: 1.0
  });
  
  const { mutate: addCurrency, isLoading: isAdding } = useMutation(
    (currency: { code: string; name: string; symbol?: string; exchange_rate?: number }) => 
      window.electronAPI.addCurrency(currency as any),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['currencies']);
        setNewCurrency({ code: '', name: '', symbol: '', exchange_rate: 1.0 });
      }
    }
  );
  
  const { mutate: updateCurrency } = useMutation(
    ({ code, currency }: { code: string; currency: any }) => 
      (window.electronAPI as any).updateCurrency(code, currency),
    {
      onSuccess: () => queryClient.invalidateQueries(['currencies'])
    }
  );
  
  const { mutate: deleteCurrency } = useMutation(
    (code: string) => (window.electronAPI as any).deleteCurrency(code),
    {
      onSuccess: () => queryClient.invalidateQueries(['currencies'])
    }
  );
  
  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCurrency.code.trim()) {
      alert('Currency code is required');
      return;
    }
    
    addCurrency({
      code: newCurrency.code.toUpperCase(),
      name: newCurrency.name,
      symbol: newCurrency.symbol,
      exchange_rate: newCurrency.exchange_rate
    });
  };
  
  
  const handleDeleteCurrency = (code: string) => {
    if (window.confirm('Are you sure you want to delete this currency?')) {
      deleteCurrency(code);
    }
  };
  
  return (
    <div>
      <div className="card mb-6">
        <h3 className="card-title">Add New Currency</h3>
        
        <form onSubmit={handleAddCurrency} className="space-y-4">
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Currency Code *</label>
              <input
                type="text"
                value={newCurrency.code}
                onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value})}
                className="form-input"
                placeholder="e.g. USD, EUR, GBP"
                maxLength={3}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Currency Name *</label>
              <input
                type="text"
                value={newCurrency.name}
                onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                className="form-input"
                placeholder="e.g. US Dollar, Euro, British Pound"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Symbol</label>
              <input
                type="text"
                value={newCurrency.symbol}
                onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                className="form-input"
                placeholder="e.g. $, €, £"
                maxLength={5}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Exchange Rate (to Base Currency)</label>
              <input
                type="number"
                value={newCurrency.exchange_rate}
                onChange={(e) => setNewCurrency({...newCurrency, exchange_rate: parseFloat(e.target.value) || 1.0})}
                className="form-input"
                placeholder="1.0"
                min="0.001"
                step="0.001"
              />
              <small className="form-help">Rate to convert to base currency (e.g., 1 USD = 83.5 INR)</small>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isAdding}
              className="btn btn-primary"
            >
              {isAdding ? 'Adding...' : 'Add Currency'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="card">
        <h3 className="card-title">Existing Currencies</h3>
        <p className="text-sm text-gray-500 mb-4">
          Default currency: <span className="font-medium">{defaultCurrency || 'Not set'}</span>
        </p>
        
        {!currencies || currencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No currencies found. Add a new currency to get started.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Currency Code</th>
                  <th>Currency Name</th>
                  <th>Symbol</th>
                  <th>Exchange Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency: any) => (
                  <tr key={currency.code}>
                    <td className="font-medium">{currency.code}</td>
                    <td>{currency.name}</td>
                    <td>{currency.symbol}</td>
                    <td>
                      <input
                        type="number"
                        value={currency.exchange_rate || 1.0}
                        onChange={(e) => updateCurrency({
                          code: currency.code,
                          currency: { exchange_rate: parseFloat(e.target.value) || 1.0 }
                        })}
                        className="form-input"
                        style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }}
                        min="0.001"
                        step="0.001"
                      />
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDeleteCurrency(currency.code)}
                        className="btn btn-danger"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        disabled={currency.code === defaultCurrency}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}