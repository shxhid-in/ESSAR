import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function IncentiveAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get all incentives for analytics
  const { data: allIncentives, isLoading: incentivesLoading } = useQuery(
    ['incentives-analytics'],
    async () => {
      return await window.electronAPI.getIncentives();
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Filter incentives based on date range and category
  const filteredIncentives = allIncentives?.filter(incentive => {
    const incentiveDate = new Date(incentive.date).toISOString().split('T')[0];
    const dateMatch = incentiveDate >= dateRange.start && incentiveDate <= dateRange.end;
    const categoryMatch = selectedCategory === 'all' || incentive.category === selectedCategory;
    return dateMatch && categoryMatch;
  }) || [];

  // Calculate statistics
  const totalAmount = filteredIncentives.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCount = filteredIncentives.length;
  const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  // Group by category
  const categoryStats = filteredIncentives.reduce((acc, inv) => {
    const cat = inv.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = { count: 0, total: 0 };
    }
    acc[cat].count += 1;
    acc[cat].total += inv.amount || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by month
  const monthlyStats = filteredIncentives.reduce((acc, inv) => {
    const date = new Date(inv.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { count: 0, total: 0 };
    }
    acc[monthKey].count += 1;
    acc[monthKey].total += inv.amount || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const categories = ['all', ...Array.from(new Set(allIncentives?.map(inv => inv.category || 'Other') || []))];

  if (incentivesLoading) {
    return (
      <div className="kpis-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="kpi-card loading">
            <div className="kpi-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="incentive-analytics">
      {/* Filters */}
      <div className="analytics-controls">
        <div className="control-group">
          <label>Date From:</label>
          <input
            type="date"
            className="filter-input"
            value={dateRange.start}
            max={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>
        <div className="control-group">
          <label>Date To:</label>
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
        <div className="control-group">
          <label>Category:</label>
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="kpis-grid">
        <div className="kpi-card green">
          <div className="kpi-header">
            <div className="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="kpi-title">Total Incentives</div>
          </div>
          <div className="kpi-value">{formatCurrency(totalAmount)}</div>
          <div className="kpi-subtitle">{formatNumber(totalCount)} incentives</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-header">
            <div className="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
            </div>
            <div className="kpi-title">Average Amount</div>
          </div>
          <div className="kpi-value">{formatCurrency(avgAmount)}</div>
          <div className="kpi-subtitle">Per incentive</div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <div className="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div className="kpi-title">Total Count</div>
          </div>
          <div className="kpi-value">{formatNumber(totalCount)}</div>
          <div className="kpi-subtitle">Incentives received</div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-header">
            <div className="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="kpi-title">Categories</div>
          </div>
          <div className="kpi-value">{formatNumber(Object.keys(categoryStats).length)}</div>
          <div className="kpi-subtitle">Active categories</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h3>By Category</h3>
        {Object.keys(categoryStats).length === 0 ? (
          <div className="empty-state">No incentives found for the selected filters</div>
        ) : (
          <div className="category-breakdown">
            {Object.entries(categoryStats)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([category, stats]) => (
                <div key={category} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{stats.count} incentives</span>
                  </div>
                  <div className="category-amount">{formatCurrency(stats.total)}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Monthly Breakdown */}
      <div className="card">
        <h3>Monthly Trend</h3>
        {Object.keys(monthlyStats).length === 0 ? (
          <div className="empty-state">No monthly data available</div>
        ) : (
          <div className="monthly-breakdown">
            {Object.entries(monthlyStats)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([month, stats]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return (
                  <div key={month} className="monthly-item">
                    <div className="monthly-info">
                      <span className="monthly-name">{monthName}</span>
                      <span className="monthly-count">{stats.count} incentives</span>
                    </div>
                    <div className="monthly-amount">{formatCurrency(stats.total)}</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

