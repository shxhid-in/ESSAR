import React, { useState } from 'react';
import type { Customer } from '../../../electron/database';
import CustomerInvoiceModal from './CustomerInvoiceModal';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onDelete?: (customer: Customer) => void;
}

export default function CustomerList({ customers, onEdit, onViewInvoice, onDelete }: CustomerListProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleViewInvoice = (invoiceId: string) => {
    if (onViewInvoice) {
      onViewInvoice(invoiceId);
    }
  };
  if (customers.length === 0) {
    return (
      <div className="customer-list-container">
        <div className="text-center py-8 text-gray-500">
          No customers found. Add a new customer to get started.
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="customer-list-container">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr 
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  style={{ cursor: 'pointer' }}
                  className="customer-row"
                >
                  <td className="font-medium">{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || '-'}</td>
                  <td className="invoice-actions">
                      <div className="action-buttons">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCustomerClick(customer); }}
                          className="action-btn view-btn"
                          title="View Customer Invoices"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(customer); }}
                          className="action-btn edit-btn"
                          title="Edit Customer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {onDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(customer); }}
                            className="action-btn delete-btn"
                            title="Delete Customer"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <CustomerInvoiceModal
          customer={selectedCustomer}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onViewInvoice={handleViewInvoice}
        />
      )}
    </>
  );
}