// Settings.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabPanel } from '../settings/tabs';
import ServicesManager from '../settings/servicesManager';
import CurrencyManager from '../settings/currencyManager';
import Preferences from '../settings/preferences';

interface AppSettings {
  default_currency: string;
  tax_rate: number;
  invoice_prefix: string;
  base_currency: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('services');
  
  const { data: settings, isLoading } = useQuery<AppSettings>(
    ['settings'], 
    () => window.electronAPI.getSettings() as Promise<AppSettings>
  );

  const tabs = [
    { id: 'services', label: 'Services' },
    { id: 'currencies', label: 'Currencies' },
    { id: 'preferences', label: 'Preferences' }
  ];

  return (
    <div className="settings-page">
      <div className="page-header-simple">
        <h1 className="page-title-simple">Application Settings</h1>
        <p className="page-subtitle-simple">Configure services, currencies, and preferences</p>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="settings-content">
          <div className="card">
            {isLoading ? (
              <div className="loading-state">Loading settings...</div>
            ) : (
              <>
                <div className="card-title">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </div>
                
                <div className="tab-content">
                  <TabPanel active={activeTab === 'services'}>
                    <ServicesManager />
                  </TabPanel>
                  
                  <TabPanel active={activeTab === 'currencies'}>
                    <CurrencyManager 
                      defaultCurrency={settings?.default_currency} 
                    />
                  </TabPanel>
                  
                  <TabPanel active={activeTab === 'preferences'}>
                    <Preferences 
                      initialValues={{
                        default_currency: settings?.default_currency,
                        tax_rate: settings?.tax_rate,
                        invoice_prefix: settings?.invoice_prefix,
                        base_currency: settings?.base_currency
                      }}
                    />
                  </TabPanel>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}