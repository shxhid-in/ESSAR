// Incentives.tsx
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Header from '../Header';
import IncentiveList from '../incentives/IncentiveList';
import IncentiveForm from '../incentives/IncentiveForm';
import DeleteConfirmation from '../incentives/DeleteConfirmation';
import type { Incentive } from '../../../electron/database';

export default function IncentivesPage() {
  const [showIncentiveForm, setShowIncentiveForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'category'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  
  // Fetch incentives
  const { data: allIncentives = [], refetch, isLoading } = useQuery<Incentive[]>(
    ['incentives'],
    async () => {
      return await (window.electronAPI as any).getIncentives();
    }
  );

  // Filter incentives
  const filteredIncentives = allIncentives.filter(incentive => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const description = (incentive.description || '').toLowerCase();
      const provider = (incentive.provider || '').toLowerCase();
      const category = (incentive.category || '').toLowerCase();
      
      if (!description.includes(query) && !provider.includes(query) && !category.includes(query)) {
        return false;
      }
    }
    
    // Category filter
    if (filterCategory !== 'all' && incentive.category !== filterCategory) {
      return false;
    }
    
    // Date range filter
    if (dateRange.start || dateRange.end) {
      const incentiveDate = new Date(incentive.date).getTime();
      if (dateRange.start) {
        const startDate = new Date(dateRange.start).getTime();
        if (incentiveDate < startDate) return false;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end).getTime() + 86400000; // Add 1 day to include end date
        if (incentiveDate >= endDate) return false;
      }
    }
    
    return true;
  });

  // Sort incentives
  const sortedIncentives = [...filteredIncentives].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    
    switch (sortOption) {
      case 'oldest':
        return dateA - dateB;
      case 'category':
        const categoryCompare = (a.category || 'Commission').localeCompare(b.category || 'Commission');
        return categoryCompare !== 0 ? categoryCompare : dateB - dateA;
      case 'newest':
      default:
        return dateB - dateA;
    }
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(allIncentives.map(i => i.category || 'Commission'))).sort();

  // Create incentive mutation
  const { mutateAsync: createIncentiveAsync, isLoading: isCreating } = useMutation(
    async (incentiveData: Omit<Incentive, 'id' | 'created_at'>) => {
      const result = await (window.electronAPI as any).createIncentive(incentiveData);
      return result;
    },
    {
      onSuccess: () => {
        setShowIncentiveForm(false);
        setSelectedIncentive(null);
        refetch();
      }
    }
  );

  // Update incentive mutation
  const { mutateAsync: updateIncentiveAsync } = useMutation(
    async ({ id, data }: { id: number; data: Partial<Incentive> }) => {
      return await (window.electronAPI as any).updateIncentive(id, data);
    },
    {
      onSuccess: () => {
        setShowIncentiveForm(false);
        setSelectedIncentive(null);
        refetch();
      }
    }
  );

  const handleCreateNew = () => {
    setSelectedIncentive(null);
    setShowIncentiveForm(true);
  };

  const handleEditIncentive = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setShowIncentiveForm(true);
  };

  const handleDeleteIncentive = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setShowDeleteConfirmation(true);
  };

  const handleSaveIncentive = async (incentiveData: Omit<Incentive, 'id' | 'created_at'>) => {
    if (selectedIncentive?.id) {
      await updateIncentiveAsync({ id: selectedIncentive.id, data: incentiveData });
    } else {
      await createIncentiveAsync(incentiveData);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedIncentive?.id) {
      await (window.electronAPI as any).deleteIncentive(selectedIncentive.id);
      setShowDeleteConfirmation(false);
      setSelectedIncentive(null);
      refetch();
    }
  };

  const handleCloseForm = () => {
    setShowIncentiveForm(false);
    setSelectedIncentive(null);
  };

  const handleCloseDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setSelectedIncentive(null);
  };

  return (
    <div className="incentives-page">
      <Header 
        title="Incentives Management" 
        subtitle="Track and manage travel agency incentives" 
      />
      
      {/* Search & New Incentive */}
      <div className="search-section">
        <div className="search-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by description, provider, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="search-results-info">
              {searchQuery && (
                <span className="search-count">
                  {filteredIncentives.length} of {allIncentives.length} incentives
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
            New Incentive
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="incentives-filters">
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Date From</label>
          <input
            type="date"
            className="filter-input"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Date To</label>
          <input
            type="date"
            className="filter-input"
            value={dateRange.end}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              const selectedDate = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (selectedDate <= today) {
                setDateRange(prev => ({ ...prev, end: selectedDate }));
              }
            }}
          />
        </div>
        {(dateRange.start || dateRange.end || filterCategory !== 'all') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setFilterCategory('all');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
      
      <IncentiveList
        incentives={sortedIncentives}
        onEdit={handleEditIncentive}
        onDelete={handleDeleteIncentive}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
        sortOption={sortOption}
        onChangeSort={setSortOption}
      />
      
      {showIncentiveForm && (
        <IncentiveForm
          incentive={selectedIncentive || undefined}
          onClose={handleCloseForm}
          onSave={handleSaveIncentive}
          isLoading={isCreating}
        />
      )}
      
      {showDeleteConfirmation && selectedIncentive && (
        <DeleteConfirmation
          incentive={selectedIncentive}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteConfirmation}
        />
      )}
    </div>
  );
}

