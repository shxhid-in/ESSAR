// Settings.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabPanel } from '../settings/tabs';
import ServicesManager from '../settings/servicesManager';
import CurrencyManager from '../settings/currencyManager';
import Preferences from '../settings/preferences';
import Details from '../settings/details';

interface AppSettings {
  default_currency: string;
  tax_rate: number;
  invoice_prefix: string;
  base_currency: string;
  company_name?: string;
  company_contact_details?: string;
  company_address?: string;
  thank_you_note?: string;
  primary_logo_path?: string;
  secondary_logo_path?: string;
  seal_photo_path?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('details');
  
  const { data: settings, isLoading } = useQuery<AppSettings>(
    ['settings'], 
    () => window.electronAPI.getSettings() as Promise<AppSettings>
  );

  const tabs = [
    { id: 'details', label: 'Details' },
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
      
      <div className="settings-container-horizontal">
        <div className="settings-tabs-horizontal">
            {tabs.map(tab => (
              <button
                key={tab.id}
              className={`settings-tab-horizontal ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
        </div>
        
        <div className="settings-content-horizontal">
          <div className="card">
            {isLoading ? (
              <div className="loading-state">Loading settings...</div>
            ) : (
              <>
                <div className="tab-content">
                  <TabPanel active={activeTab === 'details'}>
                    <Details 
                      initialValues={{
                        company_name: settings?.company_name,
                        company_contact_details: settings?.company_contact_details,
                        company_address: settings?.company_address,
                        thank_you_note: settings?.thank_you_note,
                        primary_logo_path: settings?.primary_logo_path,
                        secondary_logo_path: settings?.secondary_logo_path,
                        seal_photo_path: settings?.seal_photo_path
                      }}
                    />
                  </TabPanel>
                  
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