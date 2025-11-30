// Customers.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Header from '../Header';
import CustomerForm from '../customer/form';
import CustomerList from '../customer/list';
import type { Customer } from '../../../electron/database';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Fetch customers
  const { data: customers = [], refetch, isLoading } = useQuery<Customer[], Error>(
    ['customers', searchQuery],
    async () => {
      if (searchQuery) {
        return await (window.electronAPI as any).searchCustomers(searchQuery);
      } else {
        return await (window.electronAPI as any).getCustomers();
      }
    }
  );

  // Save customer mutation
  const { mutateAsync: saveCustomer, isLoading: isSaving } = useMutation(
    async (customer: Omit<Customer, 'id'> & { phone: string }) => {
      const result = await (window.electronAPI as any).saveCustomer(customer);
      return result;
    },
    {
      onSuccess: () => {
        refetch();
        setEditingCustomer(null);
      }
    }
  );

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleViewInvoice = (invoiceId: string) => {
    // Navigate to invoices page and show the specific invoice
    // This will be handled by the parent component or navigation system
    // View invoice
    // For now, we'll just log it. In a real app, you'd navigate to the invoices page
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      // Call the delete customer API
      await (window.electronAPI as any).deleteCustomer({ customerId: customer.id });
      
      // Show success message
      alert(`Customer "${customer.name}" has been deleted successfully.`);
      
      // Refresh the customers list
      refetch();
    } catch (error: any) {
      // Show error message
      alert(`Failed to delete customer: ${error.message}`);
    }
  };

  return (
    <div className="customers-page">
      <Header 
        title="Customer Management" 
        subtitle="Add, edit, and manage customer information" 
      />
      
      <div className="grid grid-2">
        {/* Customer Form */}
        <div className="card">
          <div className="card-title">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </div>
          <CustomerForm
            initialData={editingCustomer || undefined}
            onSubmit={saveCustomer}
            onCancel={handleCancelEdit}
            isLoading={isSaving}
          />
        </div>
        
        {/* Customer List */}
        <div className="card">
          <div className="customer-list-header">
            <div className="card-title">
              Customer Directory 
              <span className="text-sm text-gray-500 ml-2">
                ({customers.length} {customers.length === 1 ? 'customer' : 'customers'})
              </span>
            </div>
            <div className="search-box">
              <input
                placeholder="Search customers by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="loading-state">Loading customers...</div>
          ) : (
            <CustomerList 
              customers={customers} 
              onEdit={handleEditCustomer}
              onViewInvoice={handleViewInvoice}
              onDelete={handleDeleteCustomer}
            />
          )}
        </div>
      </div>
    </div>
  );
}