// App.tsx
import { useState, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProviders';
import InvoicesPage from './components/pages/Invoices';
import CustomersPage from './components/pages/Customers';
import IncentivesPage from './components/pages/Incentives';
import ReportsPage from './components/pages/Reports';
import SettingsPage from './components/pages/Settings';
import ImportExportModal from './components/ImportExportModal';
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
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  
  useEffect(() => {
    // Listen for navigation from native menu
    const handleNavigate = (tab: string) => {
      setActiveTab(tab);
    };
    
    if ((window.electronAPI as any)?.onNavigate) {
      (window.electronAPI as any).onNavigate(handleNavigate);
    }
    
    // Listen for import/export modal
    const handleOpenImportExportModal = () => {
      setShowImportExportModal(true);
    };
    
    if ((window.electronAPI as any)?.onOpenImportExportModal) {
      const unsubscribe = (window.electronAPI as any).onOpenImportExportModal(handleOpenImportExportModal);
      return () => {
        if (unsubscribe) unsubscribe();
      };
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
      
      {showImportExportModal && (
        <ImportExportModal onClose={() => setShowImportExportModal(false)} />
      )}
    </main>
  );
}