// App.tsx
import { useState, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProviders';
import InvoicesPage from './components/pages/Invoices';
import CustomersPage from './components/pages/Customers';
import IncentivesPage from './components/pages/Incentives';
import ReportsPage from './components/pages/Reports';
import SettingsPage from './components/pages/Settings';
import './App.css';

// Create a client (outside component to avoid re-render recreations)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Always fresh
      retry: false, // Disable retries for desktop apps
      refetchOnWindowFocus: false // Good for desktop apps
    }
  }
});

export default function App() {
  return (
    <QueryProvider client={queryClient}>
      <div className="app-container">
        <AppContent />
      </div>
    </QueryProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('invoices');
  
  useEffect(() => {
    // Listen for navigation from native menu
    const handleNavigate = (tab: string) => {
      setActiveTab(tab);
    };
    
    if ((window.electronAPI as any)?.onNavigate) {
      (window.electronAPI as any).onNavigate(handleNavigate);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  return (
    <main className="content-area">
      {activeTab === 'invoices' && <InvoicesPage />}
      {activeTab === 'customers' && <CustomersPage />}
      {activeTab === 'incentives' && <IncentivesPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </main>
  );
}