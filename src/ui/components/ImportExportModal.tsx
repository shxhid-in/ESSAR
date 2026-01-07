import { useState } from 'react';

interface ImportExportModalProps {
  onClose: () => void;
}

export default function ImportExportModal({ onClose }: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'single' | 'separate'>('single');
  const [exportAll, setExportAll] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleExport = async () => {
    if (!exportAll && (!fromDate || !toDate)) {
      alert('Please select a date range or choose "Export All Data"');
      return;
    }

    setIsExporting(true);
    setExportMessage('');
    
    try {
      const result = await (window.electronAPI as any).exportData({
        exportAll,
        fromDate: exportAll ? undefined : fromDate,
        toDate: exportAll ? undefined : toDate,
        exportFormat
      });

      if (result.success) {
        setExportMessage(result.message || 'Export completed successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setExportMessage(`Export failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportMessage('');
    setImportErrors([]);
    
    try {
      // Select file(s)
      const fileResult = await (window.electronAPI as any).selectImportFile();
      
      if (fileResult.canceled) {
        setIsImporting(false);
        return;
      }

      // Import data - support both single file and multiple files
      const filePaths = fileResult.filePaths || (fileResult.filePath ? [fileResult.filePath] : []);
      const result = await (window.electronAPI as any).importData(undefined, filePaths);

      if (result.success) {
        setImportMessage(
          `Import completed! ${result.importedInvoices} invoices and ${result.importedCustomers} customers imported.`
        );
        if (result.errors && result.errors.length > 0) {
          setImportErrors(result.errors);
        }
        // Keep the modal open so the user can review messages
        // Manual close is available via Cancel/Close buttons
      } else {
        setImportMessage(`Import failed: ${result.message || 'Unknown error'}`);
        if (result.errors && result.errors.length > 0) {
          setImportErrors(result.errors);
        }
      }
    } catch (error) {
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content import-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import / Export Data</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button
            className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'export' && (
            <div className="export-section">
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Data Selection:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label>
                    <input
                      type="radio"
                      checked={exportAll}
                      onChange={() => setExportAll(true)}
                    />
                    Export All Data
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={!exportAll}
                      onChange={() => setExportAll(false)}
                    />
                    Export by Date Range
                  </label>
                </div>
              </div>

              {!exportAll && (
                <div className="date-range-group">
                  <div className="form-group">
                    <label>From Date:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>To Date:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Export Format:
                </label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      checked={exportFormat === 'single'}
                      onChange={() => setExportFormat('single')}
                    />
                    Single Excel file (separate sheets for invoices and customers)
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={exportFormat === 'separate'}
                      onChange={() => setExportFormat('separate')}
                    />
                    Separate Excel files (one for invoices, one for customers)
                  </label>
                </div>
              </div>

              {exportMessage && (
                <div className={`message ${exportMessage.includes('failed') ? 'error' : 'success'}`} style={{ whiteSpace: 'pre-line' }}>
                  {exportMessage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-section">
              <div className="info-box">
                <p><strong>Import Instructions:</strong></p>
                <ul>
                  <li>Select an Excel file (.xlsx or .xls) containing invoice and/or customer data</li>
                  <li>Sheets should be named "Invoices", "Customers", or contain these keywords</li>
                  <li>Existing invoices/customers (matched by invoice number/phone) will be skipped</li>
                  <li>Data will be validated before import</li>
                </ul>
              </div>

              {importMessage && (
                <div className={`message ${importMessage.includes('failed') ? 'error' : 'success'}`}>
                  {importMessage}
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="error-list">
                  <strong>Errors/Warnings:</strong>
                  <ul>
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Select File & Import'}
                </button>
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

