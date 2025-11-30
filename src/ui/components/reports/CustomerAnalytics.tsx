import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function CustomerAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');

  // Get customer stats
  const { data: customerStats, isLoading: statsLoading } = useQuery(
    ['customer-stats'],
    async () => {
      return await window.electronAPI.getCustomerStats();
    }
  );

  // Get customer growth data
  const { data: customerGrowth, isLoading: growthLoading } = useQuery(
    ['customer-growth', selectedPeriod],
    async () => {
      return await window.electronAPI.getCustomerGrowth(selectedPeriod);
    }
  );

  // Get top customers
  const { data: topCustomers, isLoading: topCustomersLoading } = useQuery(
    ['top-customers'],
    async () => {
      return await window.electronAPI.getTopCustomers(10);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateGrowthRate = (growthData: any[]) => {
    if (growthData.length < 2) return 0;
    const current = growthData[0]?.new_customers || 0;
    const previous = growthData[1]?.new_customers || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="customer-analytics">
      {/* Customer Overview */}
      <div className="customer-overview">
        <div className="card">
          <h3>Customer Statistics</h3>
          {statsLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(customerStats?.total || 0)}</div>
                  <div className="stat-label">Total Customers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(customerStats?.new_last_30_days || 0)}</div>
                  <div className="stat-label">New (30 days)</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(customerStats?.new_last_7_days || 0)}</div>
                  <div className="stat-label">New (7 days)</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(customerStats?.new_today || 0)}</div>
                  <div className="stat-label">New Today</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Customer Growth</h3>
          <div className="growth-controls">
            <label>Period:</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          {growthLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="growth-chart">
              {customerGrowth?.slice(0, 12).map((period, index) => (
                <div key={index} className="growth-bar">
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(period.new_customers / Math.max(...(customerGrowth?.map(p => p.new_customers) || [1])) * 100)}%` 
                      }}
                      title={`${period.new_customers} new customers`}
                    ></div>
                  </div>
                  <div className="bar-label">
                    {selectedPeriod === 'day' ? 
                      new Date(period.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                      selectedPeriod === 'week' ? 
                        `Week ${period.period.split('-')[1]}` :
                        new Date(period.period + '-01').toLocaleDateString('en-US', { month: 'short' })
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="card">
        <h3>Top Customers by Revenue</h3>
        {topCustomersLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="customers-table">
            <div className="table-header">
              <div>Customer</div>
              <div>Invoices</div>
              <div>Total Spent</div>
              <div>Avg Invoice</div>
              <div>First Purchase</div>
              <div>Last Purchase</div>
            </div>
            {topCustomers?.map((customer, index) => (
              <div key={index} className="table-row">
                <div className="customer-name">{customer.customer_name}</div>
                <div className="invoices">{formatNumber(customer.total_invoices)}</div>
                <div className="total-spent">{formatCurrency(customer.total_spent)}</div>
                <div className="avg-invoice">{formatCurrency(customer.avg_invoice_value)}</div>
                <div className="first-purchase">{formatDate(customer.first_purchase)}</div>
                <div className="last-purchase">{formatDate(customer.last_purchase)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Insights */}
      <div className="customer-insights">
        <div className="card">
          <h3>Customer Insights</h3>
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-title">Growth Rate</div>
              <div className="insight-value">
                {customerGrowth?.length ? 
                  `${calculateGrowthRate(customerGrowth).toFixed(1)}%` : 
                  'N/A'
                }
              </div>
              <div className="insight-subtitle">
                {selectedPeriod} over {selectedPeriod}
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-title">Best Customer</div>
              <div className="insight-value">
                {topCustomers?.[0]?.customer_name || 'No data'}
              </div>
              <div className="insight-subtitle">
                {topCustomers?.[0] ? formatCurrency(topCustomers[0].total_spent) : ''}
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-title">Avg Customer Value</div>
              <div className="insight-value">
                {topCustomers?.length ? 
                  formatCurrency(topCustomers.reduce((sum, customer) => sum + customer.total_spent, 0) / topCustomers.length) : 
                  'No data'
                }
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-title">Most Frequent Buyer</div>
              <div className="insight-value">
                {topCustomers?.[0]?.customer_name || 'No data'}
              </div>
              <div className="insight-subtitle">
                {topCustomers?.[0] ? `${formatNumber(topCustomers[0].total_invoices)} invoices` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="card">
        <h3>Customer Segments</h3>
        <div className="segments-grid">
          <div className="segment-card">
            <div className="segment-title">High Value Customers</div>
            <div className="segment-count">
              {topCustomers?.filter(c => c.total_spent > (topCustomers[0]?.total_spent || 0) * 0.5).length || 0}
            </div>
            <div className="segment-description">
              Customers spending above 50% of top customer
            </div>
          </div>
          <div className="segment-card">
            <div className="segment-title">Frequent Buyers</div>
            <div className="segment-count">
              {topCustomers?.filter(c => c.total_invoices > 3).length || 0}
            </div>
            <div className="segment-description">
              Customers with more than 3 invoices
            </div>
          </div>
          <div className="segment-card">
            <div className="segment-title">Recent Customers</div>
            <div className="segment-count">
              {customerStats?.new_last_30_days || 0}
            </div>
            <div className="segment-description">
              New customers in last 30 days
            </div>
          </div>
          <div className="segment-card">
            <div className="segment-title">Loyal Customers</div>
            <div className="segment-count">
              {topCustomers?.filter(c => {
                const daysSinceLastPurchase = (new Date().getTime() - new Date(c.last_purchase).getTime()) / (1000 * 60 * 60 * 24);
                return daysSinceLastPurchase < 90 && c.total_invoices > 2;
              }).length || 0}
            </div>
            <div className="segment-description">
              Active customers with multiple purchases
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

