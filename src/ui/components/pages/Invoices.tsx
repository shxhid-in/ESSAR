// Invoices.tsx
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Header from '../Header';
import InvoiceList from '../invoices/invoiceList';
import InvoiceViewer from '../invoices/invoiceViewer';
import InvoiceCreator from '../invoices/invoiceCreator';
import InvoiceEditor from '../invoices/invoiceEditor';
import DeleteConfirmation from '../invoices/deleteConfirmation';
import PaymentModal from '../invoices/PaymentModal';
import { downloadInvoicePDF } from '../../utils/invoiceTemplate';
import type { Invoice } from '../../../electron/database';

type InvoiceItem = {
  serviceId: number;
  quantity: number;
  serviceName?: string;
  price?: number;
};

type InvoiceDraft = {
  customerName: string;
  customerAddress: string;
  phone: string;
  currency: string;
  items: InvoiceItem[];
  discount?: number;
};

export default function InvoicesPage() {
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'paid' | 'pending' | 'unpaid'>('newest');
  
  // Fetch invoices
  const { data: allInvoices = [], refetch, isLoading } = useQuery<Invoice[]>(
    ['invoices'],
    async () => {
      return await (window.electronAPI as any).getInvoices();
    }
  );

  // Filter invoices based on search query
  const filteredInvoices = allInvoices.filter(invoice => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const customerName = (invoice.customerName || '').toLowerCase();
    const invoiceNumber = (invoice.invoiceNumber || '').toLowerCase();
    const refNo = (invoice.refNo || '').toLowerCase();
    
    return customerName.includes(query) || 
           invoiceNumber.includes(query) || 
           (refNo && refNo.includes(query));
  });
  
  // Sort invoices based on selected option
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    const statusOrder = {
      paid: 0,
      pending: 1,
      unpaid: 2
    } as const;

    switch (sortOption) {
      case 'oldest':
        return dateA - dateB;
      case 'paid':
        return (statusOrder[a.paymentStatus || 'unpaid'] - statusOrder[b.paymentStatus || 'unpaid']) || (dateB - dateA);
      case 'pending':
        return ((a.paymentStatus === 'pending' ? 0 : 1) - (b.paymentStatus === 'pending' ? 0 : 1)) || (dateB - dateA);
      case 'unpaid':
        return ((a.paymentStatus === 'unpaid' ? 0 : 1) - (b.paymentStatus === 'unpaid' ? 0 : 1)) || (dateB - dateA);
      case 'newest':
      default:
        return dateB - dateA;
    }
  });
  
  // Create invoice mutation
  const { mutateAsync: createInvoiceAsync, mutate: createInvoice, isLoading: isCreating } = useMutation(
    async (invoiceData: InvoiceDraft) => {
      const result = await window.electronAPI.createInvoice(invoiceData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }
      return result;
    },
    {
      onSuccess: () => {
        setShowInvoiceCreator(false);
        refetch(); // Refresh the invoice list
      },
      onError: (error: Error) => {
        console.error('Invoice creation failed:', error);
        // Show error but don't close the modal - let user fix and retry
        alert(`Failed to create invoice: ${error.message}\n\nPlease check your input and try again.`);
        // Don't clear the form - keep user's data so they can fix and retry
        // Modal stays open so user can edit and retry
      }
    }
  );

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceViewer(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceEditor(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteConfirmation(true);
  };

  const handleTrackPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handleSavePayment = async (paymentData: {
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    if (!selectedInvoice) return;
    
    try {
      await (window.electronAPI as any).addOrUpdateInvoicePayment(
        parseInt(selectedInvoice.id),
        paymentData
      );
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      refetch(); // Refresh the invoice list
    } catch (error) {
      console.error('Failed to save payment:', error);
      throw error;
    }
  };

  const handleDownloadInvoiceNew = async (invoice: Invoice) => {
    try {
      await downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to download PDF: ${errorMessage}\n\nPlease try again or check the console for more details.`);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Fetch logo base64 from assets folder
      let logoBase64 = '';
      try {
        if (window.electronAPI && window.electronAPI.getLogoBase64) {
          logoBase64 = await window.electronAPI.getLogoBase64();
        }
      } catch (error) {
        console.warn('Failed to load logo, using fallback:', error);
      }
      
      // Create a new window with the invoice template
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const templateHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                * {
                  font-family: Cambria, serif;
                }
                @page {
                  size: A4;
                  margin: 20mm;
                }
                
                body { 
                  margin: 0; 
                  padding: 20px; 
                  background: white;
                  line-height: 1.5;
                }
                
                .invoice-template {
                  width: 100%;
                  max-width: 210mm;
                  margin: 0 auto;
                  background: white;
                  color: #333;
                }
                
                .separator-line {
                  border-top: 0.5px solid #999;
                  margin: 15px 0;
                }
                
                .logo-section {
                  margin-bottom: 15px;
                }
                
                .logo {
                  max-width: 40%;
                  height: auto;
                  object-fit: contain;
                }
                
                .header-section {
                  margin-bottom: 15px;
                  line-height: 1.2;
                }
                
                .header-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 8px;
                }
                
                .header-row .customer-label {
                  font-size: 14px;
                  color: #666;
                }
                
                .invoice-info-right {
                  text-align: right;
                  display: flex;
                  align-items: center;
                  margin: 0;
                  padding: 0;
                  line-height: 1.2;
                }
                
                .invoice-info-label {
                  font-weight: normal;
                  color: #666;
                  margin-right: 5px;
                  font-size: 14px;
                }
                
                .invoice-number-value,
                .invoice-date-value,
                .invoice-ref-value {
                  font-size: 14px;
                  color: #000;
                }
                
                .customer-detail-row {
                  font-size: 14px;
                  line-height: 1.2;
                  margin: 0;
                  padding: 0;
                }
                
                .header-row {
                  margin-bottom: 8px;
                  line-height: 1.2;
                }
                
                .header-row:last-child {
                  margin-bottom: 0;
                }
                
                .customer-label {
                  font-weight: normal;
                  color: #666;
                }
                
                .services-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
                }
                
                .services-table th {
                  padding: 10px 8px;
                  text-align: left;
                  font-weight: normal;
                  font-size: 14px;
                  color: #666;
                  border-bottom: 0.5px solid #999;
                }
                
                .services-table th:last-child {
                  text-align: right;
                }
                
                .services-table td {
                  padding: 8px;
                  font-size: 14px;
                  border-bottom: 0.5px solid #ddd;
                }
                
                .services-table tr:last-child td {
                  border-bottom: none;
                }
                
                .price-cell {
                  text-align: right;
                }
                
                .totals-section {
                  margin: 15px 0 30px 0;
                  text-align: right;
                }
                
                .total-row {
                  margin-bottom: 5px;
                  font-size: 14px;
                }
                
                .total-label {
                  display: inline-block;
                  min-width: 120px;
                  text-align: right;
                  margin-right: 10px;
                  color: #666;
                }
                
                .total-value {
                  display: inline-block;
                  min-width: 100px;
                  text-align: right;
                }
                
                .grand-total-row {
                  margin-top: 10px;
                  font-weight: bold;
                }
                
                .contact-section {
                  margin: 15px 0;
                }
                
                .contact-title {
                  font-size: 14px;
                  font-weight: normal;
                  margin-bottom: 4px;
                  color: #666;
                }
                
                .contact-info {
                  font-size: 14px;
                  line-height: 1.2;
                }
                
                .contact-info div {
                  margin-bottom: 4px;
                }
                
                .bottom-section {
                  margin-top: 50px;
                  width: 100%;
                }
                
                .thanks-message {
                  text-align: center;
                  font-size: 14px;
                  font-weight: normal;
                  color: #000;
                  margin: 1px 0;
                  padding: 1px 0;
                }
                
                .signatory-footer {
                  text-align: right;
                  margin: 15px 0 80px 0 ;
                }
                
                .signatory-right {
                  font-size: 14px;
                  color: #000;
                }
                
                .signature-row {
                  display: flex;
                  justify-content: space-between;
                  margin: 8px 0;
                }
                
                .signature-label {
                  font-size: 14px;
                  font-weight: normal;
                  color: #666;
                }
                
                .address-footer {
                  text-align: center;
                  font-size: 12px;
                  margin-top: 15px;
                  line-height: 1.4;
                  color: #666;
                }
                
                @media print {
                  body { margin: 0; padding: 15px; }
                  .invoice-template { box-shadow: none; margin: 0; max-width: none; }
                }
              </style>
            </head>
            <body>
              <div class="invoice-template">
                <div class="logo-section">
                  ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" class="logo" />` : '<div class="logo">ESSAR TRAVELS</div>'}
                </div>

                <div class="separator-line"></div>

                <div class="header-section">
                  <div class="header-row">
                    <div class="customer-label">Customer details</div>
                    <div class="invoice-info-right">
                      <span class="invoice-info-label">Invoice Details</span></div>
                  </div>
                  <div class="header-row">
                    <div class="customer-detail-row"><span class="customer-label">Name:</span> ${invoice.customerName}</div>
                    <div class="invoice-info-right">
                      <span class="invoice-info-label">Invoice No:</span>
                      <span class="invoice-number-value">${invoice.invoiceNumber}</span>
                    </div>
                  </div>
                  <div class="header-row">
                    <div class="customer-detail-row"><span class="customer-label">Phone No:</span> ${invoice.phone}</div>
                    <div class="invoice-info-right">
                      <span class="invoice-info-label">Date:</span>
                      <span class="invoice-date-value">${new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div class="header-row">
                    <div class="customer-detail-row"><span class="customer-label">Address:</span> ${invoice.customerAddress}</div>
                    <div class="invoice-info-right">
                    <div class="invoice-info-right">
                      ${invoice.refNo ? `<span class="invoice-info-label">Ref No:</span>
                      <span class="invoice-ref-value">${invoice.refNo}</span>` : ''}
                    </div>
                  </div>
                </div>

                <div class="separator-line"></div>

                <table class="services-table">
                  <thead>
                    <tr>
                      <th>Sl. No</th>
                      <th>Service</th>
                      <th>Description</th>
                      <th class="price-cell">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map((item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.serviceName}</td>
                        <td>${item.serviceDescription || '-'}</td>
                        <td class="price-cell">${item.price.toFixed(2)} ${invoice.currency}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="separator-line"></div>

                <div class="totals-section">
                  <div class="total-row">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-value">${invoice.subTotal.toFixed(2)} ${invoice.currency}</span>
                  </div>
                  ${invoice.discount && invoice.discount > 0 ? `
                    <div class="total-row">
                      <span class="total-label">Discount:</span>
                      <span class="total-value">-${invoice.discount.toFixed(2)} ${invoice.currency}</span>
                    </div>
                  ` : ''}
                  <div class="total-row grand-total-row">
                    <span class="total-label">Grand Total:</span>
                    <span class="total-value">${invoice.grandTotal.toFixed(2)} ${invoice.currency}</span>
                  </div>
                </div>

                <div class="separator-line"></div>

                <div class="contact-section">
                  <div class="contact-title">Contact Details</div>
                  <div class="contact-info">
                    <div>A. Samsudheen</div>
                    <div>+91 9043938600</div>
                    <div>essartravelhub@gmail.com</div>
                  </div>
                </div>

                <div class="bottom-section">
                  <div class="separator-line"></div>
                  <div class="thanks-message">
                    THANKS FOR DOING BUSINESS WITH US
                  </div>
                  <div class="separator-line"></div>
                  
                  <div class="signatory-footer">
                    <div class="signatory-right">For ESSAR Travel Hub</div>
                  </div>
                  

                  <div class="signature-row">
                    <div class="signature-label">Customer Signature</div>
                    <div class="signature-label">Authorised Signature</div>
                  </div>
                  
                  <div class="separator-line"></div>
                  <div class="address-footer">
                    Essar Style Walk and Travel Hub, 1202, B.B. Street, Town Hall, Coimbatore, Tamil Nadu. India. Pin-641001.
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        
        printWindow.document.write(templateHTML);
        printWindow.document.close();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to download PDF: ${errorMessage}\n\nPlease try again or check the console for more details.`);
    }
  };

  const handleCreateNew = () => {
    setShowInvoiceCreator(true);
  };

  const handleCloseViewer = () => {
    setShowInvoiceViewer(false);
    setSelectedInvoice(null);
  };

  const handleCloseCreator = () => {
    setShowInvoiceCreator(false);
  };

  const handleCloseEditor = () => {
    setShowInvoiceEditor(false);
    setSelectedInvoice(null);
  };

  const handleCloseDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setSelectedInvoice(null);
  };

  const handleSaveInvoice = async (invoiceData: any) => {
    // Transform the invoice data to match the expected format
    const transformedData = {
      customerName: invoiceData.customerName,
      customerAddress: invoiceData.customerAddress,
      phone: invoiceData.phone,
      currency: invoiceData.currency,
      items: invoiceData.items.map((item: any) => ({
        serviceName: item.serviceName,
        serviceDescription: item.serviceDescription,
        purchasePrice: item.purchasePrice || 0,
        price: item.price
      })),
      discount: invoiceData.discount || 0,
      refNo: invoiceData.refNo || ''
    };
    
    // Use mutateAsync to get a promise we can await
    // This allows the InvoiceCreator to know when it succeeds/fails
    try {
      await createInvoiceAsync(transformedData);
    } catch (error) {
      // Error is already handled by mutation's onError, just rethrow so InvoiceCreator knows it failed
      throw error;
    }
  };

  const handleUpdateInvoice = async (invoiceData: InvoiceDraft) => {
    if (!selectedInvoice) return;
    
    try {
      // Create updated invoice data
      const updatedInvoiceData = {
        ...invoiceData,
        items: invoiceData.items.map((item: any) => ({
          serviceName: item.serviceName,
          serviceDescription: item.serviceDescription || '',
          purchasePrice: item.purchasePrice || 0,
          price: item.price
        }))
      };
      
      // Use the new updateInvoice API
      const result = await (window.electronAPI as any).updateInvoice(parseInt(selectedInvoice.id), updatedInvoiceData);
      
      if (result.success) {
        setShowInvoiceEditor(false);
        setSelectedInvoice(null);
        refetch(); // Refresh the invoice list
      } else {
        console.error('Failed to update invoice:', result.error);
        alert('Failed to update invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('An error occurred while updating the invoice.');
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedInvoice) {
      const success = await (window.electronAPI as any).deleteInvoice(parseInt(selectedInvoice.id));
      if (success) {
        setShowDeleteConfirmation(false);
        setSelectedInvoice(null);
        refetch();
      }
    }
  };

  return (
    <div className="invoices-page">
      <Header 
        title="Invoice Management" 
        subtitle="Create and manage customer invoices" 
      />
      
      {/* Search Bar & New Invoice */}
      <div className="search-section">
        <div className="search-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="search-results-info">
              {searchQuery && (
                <span className="search-count">
                  {filteredInvoices.length} of {allInvoices.length} invoices
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleCreateNew}
            className="btn btn-primary btn-modern"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Invoice
          </button>
        </div>
      </div>
      
      <InvoiceList
        invoices={sortedInvoices}
        onViewInvoice={handleViewInvoice}
        onEditInvoice={handleEditInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        onDownloadInvoice={handleDownloadInvoiceNew}
        onTrackPayment={handleTrackPayment}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
        sortOption={sortOption}
        onChangeSort={setSortOption}
      />
      
      {showInvoiceViewer && selectedInvoice && (
        <InvoiceViewer
          invoice={selectedInvoice}
          onClose={handleCloseViewer}
        />
      )}
      
      {showInvoiceCreator && (
        <InvoiceCreator
          onClose={handleCloseCreator}
          onSave={handleSaveInvoice}
          isLoading={isCreating}
        />
      )}
      
      {showInvoiceEditor && selectedInvoice && (
        <InvoiceEditor
          invoice={selectedInvoice}
          onSave={handleUpdateInvoice}
          onCancel={handleCloseEditor}
          isLoading={isCreating}
        />
      )}
      
      {showDeleteConfirmation && selectedInvoice && (
        <DeleteConfirmation
          invoice={selectedInvoice}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteConfirmation}
          isLoading={isCreating}
        />
      )}
      
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={handleClosePaymentModal}
          onSave={handleSavePayment}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}