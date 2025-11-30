import { useQuery } from '@tanstack/react-query';

export default function FinancialInsights() {
  // Get business KPIs for profit data
  const { data: kpis, isLoading: kpisLoading } = useQuery(
    ['business-kpis'],
    async () => {
      return await window.electronAPI.getBusinessKPIs();
    }
  );

  // Get discount analysis
  const { data: discountAnalysis, isLoading: discountLoading } = useQuery(
    ['discount-analysis'],
    async () => {
      return await window.electronAPI.getDiscountAnalysis();
    }
  );

  // Get currency performance
  const { data: currencyPerformance, isLoading: currencyLoading } = useQuery(
    ['currency-performance'],
    async () => {
      return await window.electronAPI.getCurrencyPerformance();
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

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const profitMargin = kpis?.total_revenue && kpis.total_revenue > 0 
    ? ((kpis.total_profit || 0) / kpis.total_revenue) * 100 
    : 0;

  return (
    <div className="financial-insights">
      {/* Profit Overview */}
      <div className="card">
        <h3>Profit Overview</h3>
        {kpisLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="profit-overview">
            <div className="profit-stats">
              <div className="stat-item">
                <div className="stat-label">Total Profit</div>
                <div className="stat-value profit-positive">{formatCurrency(kpis?.total_profit || 0)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">{formatCurrency(kpis?.total_revenue || 0)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Profit Margin</div>
                <div className="stat-value profit-positive">{formatPercentage(profitMargin)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Last 30 Days Profit</div>
                <div className="stat-value profit-positive">{formatCurrency(kpis?.profit_last_30_days || 0)}</div>
              </div>
            </div>
            
            <div className="profit-breakdown">
              <div className="breakdown-item">
                <div className="breakdown-label">Average Profit per Item</div>
                <div className="breakdown-value profit-positive">{formatCurrency(kpis?.avg_profit || 0)}</div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Profit to Revenue Ratio</div>
                <div className="breakdown-value">
                  {kpis?.total_revenue && kpis.total_revenue > 0 
                    ? `1:${(kpis.total_revenue / (kpis.total_profit || 1)).toFixed(2)}`
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Profit Efficiency</div>
                <div className="breakdown-value">
                  {profitMargin > 30 ? 'Excellent' : profitMargin > 20 ? 'Good' : profitMargin > 10 ? 'Fair' : 'Low'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discount Analysis */}
      <div className="card">
        <h3>Discount Analysis</h3>
        {discountLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="discount-overview">
            <div className="discount-stats">
              <div className="stat-item">
                <div className="stat-label">Total Invoices</div>
                <div className="stat-value">{formatNumber(discountAnalysis?.total_invoices || 0)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Discounted Invoices</div>
                <div className="stat-value">{formatNumber(discountAnalysis?.discounted_invoices || 0)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Discount Rate</div>
                <div className="stat-value">
                  {discountAnalysis?.total_invoices ? 
                    formatPercentage((discountAnalysis.discounted_invoices / discountAnalysis.total_invoices) * 100) : 
                    '0%'
                  }
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Average Discount</div>
                <div className="stat-value">{formatCurrency(discountAnalysis?.avg_discount || 0)}</div>
              </div>
            </div>
            
            <div className="discount-breakdown">
              <div className="breakdown-item">
                <div className="breakdown-label">Total Discounts Given</div>
                <div className="breakdown-value">{formatCurrency(discountAnalysis?.total_discounts_given || 0)}</div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Average Invoice Value</div>
                <div className="breakdown-value">{formatCurrency(discountAnalysis?.avg_invoice_value || 0)}</div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Discount Impact</div>
                <div className="breakdown-value">
                  {discountAnalysis?.total_discounts_given && discountAnalysis?.avg_invoice_value ? 
                    formatPercentage((discountAnalysis.total_discounts_given / (discountAnalysis.total_discounts_given + (discountAnalysis.avg_invoice_value * discountAnalysis.total_invoices))) * 100) : 
                    '0%'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Currency Performance */}
      <div className="card">
        <h3>Currency Performance</h3>
        {currencyLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="currency-table">
            <div className="table-header">
              <div>Currency</div>
              <div>Invoices</div>
              <div>Total Revenue</div>
              <div>Avg Invoice Value</div>
              <div>Market Share</div>
            </div>
            {currencyPerformance?.map((currency, index) => {
              const totalRevenue = currencyPerformance.reduce((sum, c) => sum + c.total_revenue, 0);
              const marketShare = totalRevenue > 0 ? (currency.total_revenue / totalRevenue) * 100 : 0;
              
              return (
                <div key={index} className="table-row">
                  <div className="currency-code">{currency.currency}</div>
                  <div className="invoice-count">{formatNumber(currency.invoice_count)}</div>
                  <div className="total-revenue">{formatCurrency(currency.total_revenue)}</div>
                  <div className="avg-invoice">{formatCurrency(currency.avg_invoice_value)}</div>
                  <div className="market-share">
                    <div className="share-bar">
                      <div 
                        className="share-fill" 
                        style={{ width: `${marketShare}%` }}
                      ></div>
                    </div>
                    <span className="share-percentage">{formatPercentage(marketShare)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Financial Health Metrics */}
      <div className="card">
        <h3>Financial Health Metrics</h3>
        <div className="health-metrics">
          <div className="metric-card">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-title">Total Profit</div>
              <div className="metric-value profit-positive">
                {formatCurrency(kpis?.total_profit || 0)}
              </div>
              <div className="metric-subtitle">All time profit</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-title">Revenue Efficiency</div>
              <div className="metric-value">
                {discountAnalysis?.total_invoices && discountAnalysis?.avg_invoice_value ? 
                  formatCurrency(discountAnalysis.avg_invoice_value * discountAnalysis.total_invoices) : 
                  'N/A'
                }
              </div>
              <div className="metric-subtitle">Total potential revenue</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-title">Profit Margin</div>
              <div className="metric-value profit-positive">
                {formatPercentage(profitMargin)}
              </div>
              <div className="metric-subtitle">Profit to revenue ratio</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-title">Average Profit per Item</div>
              <div className="metric-value profit-positive">
                {formatCurrency(kpis?.avg_profit || 0)}
              </div>
              <div className="metric-subtitle">Per invoice item</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-title">Discount Impact</div>
              <div className="metric-value">
                {discountAnalysis?.total_discounts_given ? 
                  formatCurrency(discountAnalysis.total_discounts_given) : 
                  'N/A'
                }
              </div>
              <div className="metric-subtitle">Total discounts given</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-title">Currency Diversity</div>
              <div className="metric-value">
                {formatNumber(currencyPerformance?.length || 0)}
              </div>
              <div className="metric-subtitle">Active currencies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="card">
        <h3>Financial Insights</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-title">Primary Currency</div>
            <div className="insight-value">
              {currencyPerformance?.[0]?.currency || 'No data'}
            </div>
            <div className="insight-subtitle">
              {currencyPerformance?.[0] ? 
                `${formatPercentage((currencyPerformance[0].total_revenue / currencyPerformance.reduce((sum, c) => sum + c.total_revenue, 0)) * 100)} of revenue` : 
                ''
              }
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-title">Discount Strategy</div>
            <div className="insight-value">
              {discountAnalysis?.total_invoices && discountAnalysis?.discounted_invoices ? 
                (discountAnalysis.discounted_invoices / discountAnalysis.total_invoices) > 0.3 ? 'High' : 
                (discountAnalysis.discounted_invoices / discountAnalysis.total_invoices) > 0.1 ? 'Moderate' : 'Low'
                : 'N/A'
              }
            </div>
            <div className="insight-subtitle">
              Discount frequency
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-title">Revenue Concentration</div>
            <div className="insight-value">
              {currencyPerformance?.length ? 
                currencyPerformance.slice(0, 2).reduce((sum, c) => sum + c.total_revenue, 0) / 
                currencyPerformance.reduce((sum, c) => sum + c.total_revenue, 0) > 0.8 ? 'High' : 'Diversified'
                : 'N/A'
              }
            </div>
            <div className="insight-subtitle">
              Top 2 currencies share
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-title">Financial Stability</div>
            <div className="insight-value">
              {discountAnalysis?.total_discounts_given && discountAnalysis?.avg_invoice_value && discountAnalysis?.total_invoices ? 
                (discountAnalysis.total_discounts_given / (discountAnalysis.avg_invoice_value * discountAnalysis.total_invoices)) < 0.1 ? 'Stable' : 'Variable'
                : 'N/A'
              }
            </div>
            <div className="insight-subtitle">
              Based on discount impact
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3>Financial Recommendations</h3>
        <div className="recommendations">
          {discountAnalysis?.total_invoices && discountAnalysis?.discounted_invoices && 
           (discountAnalysis.discounted_invoices / discountAnalysis.total_invoices) > 0.3 && (
            <div className="recommendation-item warning">
              <div className="recommendation-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="recommendation-content">
                <div className="recommendation-title">High Discount Rate</div>
                <div className="recommendation-text">
                  Consider reviewing discount policies as {formatPercentage((discountAnalysis.discounted_invoices / discountAnalysis.total_invoices) * 100)} of invoices are discounted.
                </div>
              </div>
            </div>
          )}
          
          {currencyPerformance?.length === 1 && (
            <div className="recommendation-item info">
              <div className="recommendation-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="recommendation-content">
                <div className="recommendation-title">Currency Diversification</div>
                <div className="recommendation-text">
                  Consider accepting multiple currencies to expand your customer base and reduce currency risk.
                </div>
              </div>
            </div>
          )}
          
          {discountAnalysis?.avg_discount && discountAnalysis?.avg_invoice_value && 
           (discountAnalysis.avg_discount / discountAnalysis.avg_invoice_value) > 0.2 && (
            <div className="recommendation-item warning">
              <div className="recommendation-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
              </div>
              <div className="recommendation-content">
                <div className="recommendation-title">Large Average Discounts</div>
                <div className="recommendation-text">
                  Average discount of {formatCurrency(discountAnalysis.avg_discount)} represents {formatPercentage((discountAnalysis.avg_discount / discountAnalysis.avg_invoice_value) * 100)} of average invoice value.
                </div>
              </div>
            </div>
          )}
          
          {(!discountAnalysis?.discounted_invoices || discountAnalysis.discounted_invoices === 0) && (
            <div className="recommendation-item success">
              <div className="recommendation-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div className="recommendation-content">
                <div className="recommendation-title">No Discounts Given</div>
                <div className="recommendation-text">
                  Great! You're maintaining full price integrity across all invoices.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

