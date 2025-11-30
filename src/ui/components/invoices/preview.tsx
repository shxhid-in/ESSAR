import React from 'react';
import InvoiceTemplate from './InvoiceTemplate';
import { downloadInvoicePDF } from '../../utils/invoiceTemplate';
import type { Invoice } from '../../../electron/database';

export default function InvoicePreview({ 
  invoice,
  onPrint
}: {
  invoice: Invoice;
  onPrint?: () => void;
}) {
  const handleDownload = async () => {
    try {
      await downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };
  
  return (
    <div className="card">
      <h3 className="card-title">Invoice Preview</h3>
      
      {/* Invoice Template Preview */}
      <div className="border rounded-lg p-4 bg-white mb-4 overflow-auto" style={{ maxHeight: '600px' }}>
        <InvoiceTemplate invoice={invoice} isPreview={true} />
      </div>
      
      <div className="btn-group">
        <button 
          onClick={handleDownload}
          className="btn btn-primary download-btn"
          title="Download PDF"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        
        <button 
          onClick={onPrint}
          className="btn btn-secondary"
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
}