import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Get yearly revenue data
  const { data: yearlyData, isLoading: yearlyLoading } = useQuery(
    ['yearly-revenue'],
    async () => {
      return await window.electronAPI.getYearlyRevenue();
    }
  );

  // Get monthly revenue data
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery(
    ['monthly-revenue', selectedYear],
    async () => {
      return await window.electronAPI.getMonthlyRevenue(selectedYear);
    }
  );

  // Get revenue comparison data
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery(
    ['revenue-comparison', selectedPeriod],
    async () => {
      return await window.electronAPI.getRevenueComparison(selectedPeriod);
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

  const calculateGrowth = (current: number, previous: number | null) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="revenue-analytics">
      {/* Controls */}
      <div className="analytics-controls">
        <div className="control-group">
          <label>Period:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        <div className="control-group">
          <label>Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {yearlyData?.map(year => (
              <option key={year.year} value={year.year}>{year.year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="revenue-overview">
        <div className="card">
          <h3>Yearly Revenue</h3>
          {yearlyLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="revenue-stats">
              {yearlyData?.slice(0, 3).map((year, index) => (
                <div key={year.year} className="revenue-item">
                  <div className="year">{year.year}</div>
                  <div className="amount">{formatCurrency(year.total)}</div>
                  <div className="invoices">{formatNumber(year.invoice_count)} invoices</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Monthly Revenue ({selectedYear})</h3>
          {monthlyLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="monthly-chart">
              {monthlyData?.map((month, index) => (
                <div key={month.month} className="month-bar">
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(month.total / Math.max(...(monthlyData?.map(m => m.total) || [1])) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="month-label">{month.month.split('-')[1]}</div>
                  <div className="month-value">{formatCurrency(month.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Comparison */}
      <div className="card">
        <h3>Revenue Comparison ({selectedPeriod})</h3>
        {comparisonLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="comparison-table">
            <div className="table-header">
              <div>Period</div>
              <div>Current</div>
              <div>Previous</div>
              <div>Growth</div>
              <div>Invoices</div>
            </div>
            {comparisonData?.slice(0, 10).map((item, index) => {
              const growth = calculateGrowth(item.current_total, item.previous_total);
              return (
                <div key={index} className="table-row">
                  <div className="period">{item.period}</div>
                  <div className="current">{formatCurrency(item.current_total)}</div>
                  <div className="previous">
                    {item.previous_total ? formatCurrency(item.previous_total) : 'N/A'}
                  </div>
                  <div className={`growth ${growth >= 0 ? 'positive' : 'negative'}`}>
                    {item.previous_total ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="invoices">{formatNumber(item.invoice_count)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revenue Trends */}
      <div className="revenue-trends">
        <div className="card">
          <h3>Revenue Insights</h3>
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-title">Best Month</div>
              <div className="insight-value">
                {monthlyData?.length ? 
                  `${monthlyData[0]?.month} - ${formatCurrency(monthlyData[0]?.total)}` : 
                  'No data'
                }
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-title">Average Monthly</div>
              <div className="insight-value">
                {monthlyData?.length ? 
                  formatCurrency(monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length) : 
                  'No data'
                }
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-title">Total This Year</div>
              <div className="insight-value">
                {monthlyData?.length ? 
                  formatCurrency(monthlyData.reduce((sum, month) => sum + month.total, 0)) : 
                  'No data'
                }
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-title">Growth Rate</div>
              <div className="insight-value">
                {comparisonData?.length && comparisonData[0]?.previous_total ? 
                  `${calculateGrowth(comparisonData[0].current_total, comparisonData[0].previous_total).toFixed(1)}%` : 
                  'N/A'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

