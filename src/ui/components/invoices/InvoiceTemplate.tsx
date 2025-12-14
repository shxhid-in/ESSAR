import React, { useState, useEffect } from 'react';
import type { Invoice } from '../../../electron/database';

interface InvoiceTemplateProps {
  invoice: Invoice;
  isPreview?: boolean;
}

export default function InvoiceTemplate({ invoice, isPreview = false }: InvoiceTemplateProps) {
  // CSP is disabled globally, no need to add meta tags
  const [logoBase64, setLogoBase64] = useState<string>('');

  // Robust logo system with multiple fallbacks (same as PDF template)
  const getLogoAsBase64 = async (): Promise<string> => {
    try {
      // Method 1: Try PNG first (most reliable)
      const pngBase64 = await getPNGLogoBase64();
      if (pngBase64) {
        return pngBase64;
      }
    } catch (error) {
      // PNG logo failed, trying SVG fallback
      console.warn('PNG logo failed, trying SVG fallback:', error);
    }

    try {
      // Method 2: Try SVG fallback
      const svgBase64 = getSVGLogoBase64();
      if (svgBase64) {
        return svgBase64;
      }
    } catch (error) {
      // SVG logo failed, using text fallback
      console.warn('SVG logo failed, using text fallback:', error);
    }

    // Method 3: Text-based fallback (guaranteed to work)
    return getTextLogoBase64();
  };

  // Method 1: PNG Logo (Primary - Most Reliable)
  const getPNGLogoBase64 = async (): Promise<string | null> => {
    try {
      // Fetch PNG logo dynamically from assets folder via Electron API
      if (window.electronAPI && window.electronAPI.getLogoBase64) {
        const pngBase64 = await window.electronAPI.getLogoBase64();
        if (pngBase64) {
          return pngBase64;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading PNG logo:', error);
      return null;
    }
  };

  // Method 2: SVG Logo (Fallback)
  const getSVGLogoBase64 = (): string | null => {
    try {
      // Clean, optimized SVG content
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
  <rect width="300" height="80" fill="#f8f9fa" stroke="#5B818D" stroke-width="2" rx="8"/>
  <text x="150" y="30" text-anchor="middle" fill="#5B818D" font-family="Arial, sans-serif" font-size="20" font-weight="bold">ESSAR TRAVELS</text>
  <text x="150" y="50" text-anchor="middle" fill="#5B818D" font-family="Arial, sans-serif" font-size="12" opacity="0.8">Your Travel Partner</text>
  <text x="150" y="65" text-anchor="middle" fill="#5B818D" font-family="Arial, sans-serif" font-size="10" opacity="0.6">Since 2024</text>
</svg>`;
      
      return 'data:image/svg+xml;base64,' + btoa(svgContent);
    } catch (error) {
      return null;
    }
  };

  // Method 3: Text Logo (Final Fallback)
  const getTextLogoBase64 = (): string => {
    const textSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="250" height="60" viewBox="0 0 250 60">
  <rect width="250" height="60" fill="#ffffff" stroke="#5B818D" stroke-width="1" rx="4"/>
  <text x="125" y="25" text-anchor="middle" fill="#5B818D" font-family="Arial, sans-serif" font-size="16" font-weight="bold">ESSAR TRAVELS</text>
  <text x="125" y="45" text-anchor="middle" fill="#5B818D" font-family="Arial, sans-serif" font-size="10">Your Travel Partner</text>
</svg>`;
    
    return 'data:image/svg+xml;base64,' + btoa(textSvg);
  };

  // Load logo asynchronously
  useEffect(() => {
    getLogoAsBase64().then(setLogoBase64).catch((error) => {
      console.error('Error loading logo:', error);
      setLogoBase64(getTextLogoBase64()); // Fallback to text logo
    });
  }, []);

  const templateStyles = `
    @page {
      size: A4;
      margin: 20mm;
    }
    
    .invoice-template {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      font-family: 'Arial', sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    
    .letterhead {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    
    .logo {
      max-width: 40%;
      height: auto;
      object-fit: contain;
    }
    
    .invoice-header-info {
      margin-bottom: 20px;
      text-align: right;
    }
    
    .invoice-number {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .invoice-date {
      font-size: 14px;
      color: #333;
    }
    
    .customer-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    
    .customer-detail {
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .customer-label {
      font-weight: bold;
      color: #333;
    }
    
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .services-table th {
      background: #f5f5f5;
      color: #333;
      padding: 12px 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #333;
    }
    
    .services-table th:last-child {
      text-align: right;
    }
    
    .services-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    
    .services-table tr:last-child td {
      border-bottom: none;
    }
    
    .price-cell {
      text-align: right;
    }
    
    .totals-section {
      margin-top: 20px;
      margin-bottom: 30px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .total-row.grand-total {
      border-top: 2px solid #333;
      padding-top: 12px;
      margin-top: 8px;
      font-size: 16px;
      font-weight: bold;
    }
    
    .footer-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .contact-section {
      flex: 1;
    }
    
    .contact-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    
    .contact-info {
      font-size: 14px;
      line-height: 1.8;
    }
    
    .authorized-signatory {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-top: 40px;
    }
    
    @media print {
      .invoice-template {
        box-shadow: none;
        margin: 0;
        max-width: none;
      }
    }
  `;

  return (
    <>
      <style>{templateStyles}</style>
      <div className="invoice-template">
        {/* Letterhead with Logo */}
        <div className="letterhead">
          <img 
            src={logoBase64}
            alt="ESSAR TRAVELS Logo" 
            className="logo"
          />
        </div>

        {/* Invoice Number and Date */}
        <div className="invoice-header-info">
          <div className="invoice-number">
            {invoice.invoiceNumber}
          </div>
            <div className="invoice-date">
            {new Date(invoice.date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
              })}
          </div>
        </div>

        {/* CUSTOMER DETAILS */}
        <div className="customer-section">
          <div className="section-title">CUSTOMER DETAILS</div>
              <div className="customer-detail">
                <span className="customer-label">Name:</span> {invoice.customerName}
              </div>
              <div className="customer-detail">
            <span className="customer-label">Phone No:</span> {invoice.phone}
              </div>
              <div className="customer-detail">
                <span className="customer-label">Address:</span> {invoice.customerAddress}
          </div>
        </div>

        {/* Services Table */}
        <table className="services-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Description</th>
              <th className="price-cell">Price</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td>{item.serviceName}</td>
                <td>{item.serviceDescription || '-'}</td>
                <td className="price-cell">
                  {item.price.toFixed(2)} {invoice.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>{invoice.subTotal.toFixed(2)} {invoice.currency}</span>
          </div>
          {invoice.discount && invoice.discount > 0 && (
            <div className="total-row">
              <span>Discounts:</span>
              <span>-{invoice.discount.toFixed(2)} {invoice.currency}</span>
            </div>
          )}
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <span>{invoice.grandTotal.toFixed(2)} {invoice.currency}</span>
          </div>
        </div>

        {/* Footer with Contact Information and Authorized Signatory */}
        <div className="footer-section">
          <div className="contact-section">
            <div className="contact-title">CONTACT INFORMATION</div>
            <div className="contact-info">
              <div>A Shamsudheen</div>
              <div>Mob: 9043938600</div>
              <div>E-mail: essartravelhub@gmail.com</div>
            </div>
          </div>
          <div className="authorized-signatory">
            Authorized Signatory
          </div>
        </div>
      </div>
    </>
  );
}
