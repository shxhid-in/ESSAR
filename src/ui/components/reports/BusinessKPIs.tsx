import { useQuery } from '@tanstack/react-query';

export default function BusinessKPIs() {
  const { data: kpis, isLoading, error } = useQuery(
    ['business-kpis'],
    async () => {
      return await window.electronAPI.getBusinessKPIs();
    }
  );

  if (isLoading) {
    return (
      <div className="kpis-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="kpi-card loading">
            <div className="kpi-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card error-state">
        <h3>Error loading KPIs</h3>
        <p>Failed to load business metrics. Please try again.</p>
      </div>
    );
  }

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

  const profitMargin = kpis?.total_revenue && kpis.total_revenue > 0 
    ? ((kpis.total_profit || 0) / kpis.total_revenue) * 100 
    : 0;

  const kpiData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(kpis?.total_revenue || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      color: 'green',
      subtitle: 'All time'
    },
    {
      title: 'Total Profit',
      value: formatCurrency(kpis?.total_profit || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      color: 'green',
      subtitle: `Margin: ${profitMargin.toFixed(1)}%`
    },
    {
      title: 'Total Invoices',
      value: formatNumber(kpis?.total_invoices || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      color: 'blue',
      subtitle: 'All time'
    },
    {
      title: 'Average Invoice Value',
      value: formatCurrency(kpis?.avg_invoice_value || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
      ),
      color: 'purple',
      subtitle: 'Per invoice'
    },
    {
      title: 'Total Customers',
      value: formatNumber(kpis?.total_customers || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: 'orange',
      subtitle: 'All time'
    },
    {
      title: 'Active Services',
      value: formatNumber(kpis?.total_services || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
      color: 'teal',
      subtitle: 'Available'
    },
    {
      title: 'Last 30 Days Revenue',
      value: formatCurrency(kpis?.revenue_last_30_days || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      color: 'green',
      subtitle: 'Recent performance'
    },
    {
      title: 'Last 30 Days Profit',
      value: formatCurrency(kpis?.profit_last_30_days || 0),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      color: 'green',
      subtitle: 'Recent performance'
    }
  ];

  return (
    <div className="kpis-container">
      <div className="kpis-grid">
        {kpiData.map((kpi, index) => (
          <div key={index} className={`kpi-card ${kpi.color}`}>
            <div className="kpi-header">
              <div className="kpi-icon">{kpi.icon}</div>
              <div className="kpi-title">{kpi.title}</div>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-subtitle">{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="card">
          <h3>Recent Performance</h3>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Invoices (30 days)</span>
              <span className="stat-value">{formatNumber(kpis?.invoices_last_30_days || 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg per day</span>
              <span className="stat-value">
                {formatNumber(Math.round((kpis?.invoices_last_30_days || 0) / 30))}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3>Profit Metrics</h3>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Total Profit</span>
              <span className="stat-value">{formatCurrency(kpis?.total_profit || 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Profit Margin</span>
              <span className="stat-value">
                {kpis?.total_revenue && kpis.total_revenue > 0 
                  ? `${((kpis.total_profit || 0) / kpis.total_revenue * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Profit per Item</span>
              <span className="stat-value">{formatCurrency(kpis?.avg_profit || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

