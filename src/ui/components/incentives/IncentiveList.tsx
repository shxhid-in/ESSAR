import React from 'react';
import type { Incentive } from '../../../electron/database';

interface IncentiveListProps {
  incentives: Incentive[];
  onEdit: (incentive: Incentive) => void;
  onDelete: (incentive: Incentive) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
  sortOption: 'newest' | 'oldest' | 'category';
  onChangeSort: (option: 'newest' | 'oldest' | 'category') => void;
}

const IncentiveList: React.FC<IncentiveListProps> = ({ 
  incentives, 
  onEdit,
  onDelete,
  onCreateNew,
  isLoading,
  sortOption,
  onChangeSort
}) => {
  
  if (isLoading) {
    return (
      <div className="card">
        <div className="loading-state">Loading incentives...</div>
      </div>
    );
  }

  return (
    <div className="invoice-list-wrapper">
      <div className="invoice-list-header-modern">
        <div className="header-left">
          <h2 className="invoice-list-title">Incentives</h2>
          <span className="invoice-count-badge">{incentives.length}</span>
        </div>
        <div className="sort-container">
          <select
            className="sort-select"
            value={sortOption}
            onChange={(e) => onChangeSort(e.target.value as any)}
            aria-label="Sort incentives"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="category">By Category</option>
          </select>
        </div>
      </div>
      
      {incentives.length === 0 ? (
        <div className="invoice-empty-state-modern">
          <div className="empty-state-title-modern">No incentives yet</div>
          <div className="empty-state-description-modern">
            Create your first incentive to get started
          </div>
          <div className="empty-state-actions">
            <button
              onClick={onCreateNew}
              className="btn btn-primary btn-modern"
            >
              Create First Incentive
            </button>
          </div>
        </div>
      ) : (
        <div className="invoice-list-modern">
          {incentives.map((incentive) => (
            <div
              key={incentive.id}
              className="incentive-card-modern"
              onClick={() => onEdit(incentive)}
            >
              <div className="incentive-card-content">
                <div className="incentive-date-modern">
                  {new Date(incentive.date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
                
                <div className="incentive-details-modern">
                  {incentive.description ? (
                    <div className="incentive-description-modern">
                      {incentive.description}
                    </div>
                  ) : incentive.provider ? (
                    <div className="incentive-description-modern">
                      {incentive.provider}
                    </div>
                  ) : (
                    <div className="incentive-description-modern text-muted">
                      No description
                    </div>
                  )}
                </div>
                
                <div className="incentive-amount-modern">
                  ₹{incentive.amount.toFixed(2)}
                </div>
              </div>
              
              <div className="incentive-card-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                <div className="incentive-card-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(incentive); }}
                    className="action-btn-modern"
                    title="Edit Incentive"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(incentive); }}
                    className="action-btn-modern delete"
                    title="Delete Incentive"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
                <span className="incentive-category-badge">
                  {incentive.category || 'Commission'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncentiveList;

