import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Service } from '../../../electron/database';

export default function ServicesManager() {
  const queryClient = useQueryClient();
  
  const { data: services = [] } = useQuery<Service[]>(
    ['services'],
    () => window.electronAPI.getServices()
  );
  
  const [newService, setNewService] = useState({
    name: '',
    description: ''
  });
  
  const { mutate: addService, isLoading: isAdding } = useMutation(
    (service: { name: string; description?: string }) => 
      window.electronAPI.addService(service as any),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['services']);
        setNewService({ name: '', description: '' });
      }
    }
  );
  
  const { mutate: deleteService } = useMutation(
    (id: number) => (window.electronAPI as any).deleteService(id),
    {
      onSuccess: () => queryClient.invalidateQueries(['services'])
    }
  );
  
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newService.name.trim()) {
      alert('Service name is required');
      return;
    }
    
    addService({
      name: newService.name,
      description: newService.description
    });
  };
  
  const handleDeleteService = (id: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteService(id);
    }
  };
  
  return (
    <div>
      <div className="card mb-6">
        <h3 className="card-title">Add New Service</h3>
        
        <form onSubmit={handleAddService} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) => {
                // Service name changed
                setNewService({...newService, name: e.target.value});
              }}
              onFocus={() => {/* Service name input focused */}}
              className="form-input"
              placeholder="Enter service name"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={newService.description}
              onChange={(e) => setNewService({...newService, description: e.target.value})}
              className="form-input"
              placeholder="Enter service description"
              rows={2}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isAdding}
              className="btn btn-primary"
            >
              {isAdding ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="card">
        <h3 className="card-title">Existing Services</h3>
        
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No services found. Add a new service to get started.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="font-medium">{service.name}</td>
                    <td>{service.description || '-'}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteService(service.id!)}
                        className="btn btn-danger"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}