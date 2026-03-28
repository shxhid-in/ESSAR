import React, { useState, useEffect } from 'react';
import type { Invoice } from '../../../electron/database';
import { downloadInvoicePDF } from '../../utils/invoiceTemplate';

interface InvoiceViewerProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, onClose }) => {
  const [logoBase64, setLogoBase64] = useState('');
  const [signatureBase64, setSignatureBase64] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Load company details and logo from settings
        const settings = await (window.electronAPI as any).getSettings();
        setCompanyName((settings.company_name || '').trim());
        setContactDetails(settings.company_contact_details || '');
        setCompanyAddress(settings.company_address || '');
        
        const logo = await (window.electronAPI as any).getPrimaryLogoBase64();
        
        // Get seal photo (no fallback - will show space if not available)
        let sealPhoto = '';
        try {
          sealPhoto = await (window.electronAPI as any).getSealPhotoBase64();
        } catch (error) {
          console.warn('Failed to load seal photo:', error);
        }
        
        setLogoBase64(logo || '');
        setSignatureBase64(sealPhoto || '');
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };
    loadAssets();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      await downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const getPaymentStatusText = () => {
    if (invoice.paymentStatus === 'paid') return 'Paid';
    if (invoice.paymentStatus === 'pending') return 'Pending';
    return 'Unpaid';
  };

  const getPaymentStatusClass = () => {
    if (invoice.paymentStatus === 'paid') return 'payment-status-paid';
    if (invoice.paymentStatus === 'pending') return 'payment-status-pending';
    return 'payment-status-unpaid';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-viewer-new" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header invoice-viewer-header-new">
          <h2 className="modal-title">Invoice {invoice.invoiceNumber}</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body invoice-viewer-body-new">
          <div className="invoice-container-new">
            {/* Logo Section */}
            <div className="logo-section-new">
              {logoBase64 ? (
                <img src={logoBase64} alt="Company Logo" className="logo-new" />
              ) : (
                <h2 className="logo-text">{companyName}</h2>
              )}
            </div>
            
            <div className="separator-line-new"></div>
            
            {/* Header Section */}
            <div className="header-section-new">
              <div className="header-row-new">
                <div className="customer-label-new">Customer details</div>
                <div className="invoice-info-right-new">
                  <span className="invoice-info-label-new">Invoice Details</span>
                </div>
              </div>
              <div className="header-row-new">
                <div className="customer-detail-row-new">
                  <span className="customer-label-new">Name:</span> {invoice.customerName}
                </div>
                <div className="invoice-info-right-new">
                  <span className="invoice-info-label-new">Invoice No:</span>
                  <span className="invoice-number-value-new">{invoice.invoiceNumber}</span>
                  </div>
              </div>
              <div className="header-row-new">
                <div className="customer-detail-row-new">
                  <span className="customer-label-new">Phone No:</span> {invoice.phone}
                </div>
                <div className="invoice-info-right-new">
                  <span className="invoice-info-label-new">Date:</span>
                  <span className="invoice-date-value-new">
                    {new Date(invoice.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="header-row-new">
                <div className="customer-detail-row-new">
                  <span className="customer-label-new">Address:</span> {invoice.customerAddress}
                </div>
                <div className="invoice-info-right-new">
                  {invoice.refNo && (
                    <>
                      <span className="invoice-info-label-new">Ref No:</span>
                      <span className="invoice-ref-value-new">{invoice.refNo}</span>
                    </>
              )}
                </div>
              </div>
            </div>
            
            <div className="separator-line-new"></div>
            
            {/* Services Table */}
            <table className="services-table-new">
                  <thead>
                    <tr>
                  <th>Sl. No</th>
                      <th>Service</th>
                      <th>Description</th>
                  <th className="price-cell-new">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.serviceName}</td>
                    <td>{item.serviceDescription || '-'}</td>
                    <td className="price-cell-new">
                      {item.price.toFixed(2)} {invoice.currency}
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            
            <div className="separator-line-new"></div>
            
          {/* Totals Section */}
            <div className="totals-section-new">
              <div className="total-row-new">
                <span className="total-label-new">Subtotal:</span>
                <span className="total-value-new">
                  {invoice.subTotal.toFixed(2)} {invoice.currency}
                </span>
              </div>
              {invoice.discount && invoice.discount > 0 && (
                <div className="total-row-new">
                  <span className="total-label-new">Discount:</span>
                  <span className="total-value-new">
                    -{invoice.discount.toFixed(2)} {invoice.currency}
                  </span>
                </div>
              )}
              <div className="total-row-new grand-total-row-new">
                <span className="total-label-new">Grand Total:</span>
                <span className="total-value-new">
                  {invoice.grandTotal.toFixed(2)} {invoice.currency}
                </span>
              </div>
              
              {/* Payment Information */}
              {(invoice.amountPaid !== undefined && invoice.amountPaid > 0) && (
                <>
                  <div className="total-row-new">
                    <span className="total-label-new">Amount Paid:</span>
                    <span className="total-value-new">
                      {invoice.amountPaid.toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                  <div className="total-row-new">
                    <span className="total-label-new">Remaining Balance:</span>
                    <span className={`total-value-new ${invoice.remainingBalance && invoice.remainingBalance > 0 ? 'balance-remaining' : 'balance-paid'}`}>
                      {(invoice.remainingBalance || 0).toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                  <div className="total-row-new">
                    <span className="total-label-new">Payment Status:</span>
                    <span className={`payment-status-badge-new ${getPaymentStatusClass()}`}>
                      {getPaymentStatusText()}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="separator-line-new"></div>
            
            {/* Contact Section */}
            {contactDetails && (
            <div className="contact-section-new">
              <div className="contact-title-new">Contact Details</div>
              <div className="contact-info-new">
                  {contactDetails.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bottom Section */}
            <div className="bottom-section-new">
              <div className="separator-line-new"></div>
              <div className="thanks-message-new">
                THANKS FOR DOING BUSINESS WITH US
              </div>
              <div className="separator-line-new"></div>
              
              <div className="signatory-footer-new">
                <div></div>
                <div style={{ textAlign: 'right' }}>
                  <div className="signatory-right-new">For {companyName || 'Company'}</div>
                  {signatureBase64 ? (
                    <img 
                      src={signatureBase64} 
                      alt="Authorised Signature" 
                      className="signature-image-new" 
                    />
                  ) : (
                    <div style={{ height: '60px', marginTop: '8px' }}></div>
                  )}
                </div>
              </div>
              
              <div className="signature-row-new">
                <div className="signature-label-new">Customer Signature</div>
                <div style={{ textAlign: 'right' }}>
                  <div className="signature-label-new">Authorised Signature</div>
                </div>
              </div>

              {companyAddress && (
                <>
                  <div className="separator-line-new"></div>
                  <div className="address-footer-new">{companyAddress}</div>
                  <div className="separator-line-new"></div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer invoice-viewer-footer-new">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownloadPDF();
            }}
            className="btn btn-primary download-btn"
            title="Download PDF"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;
