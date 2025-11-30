import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ServicePerformance() {
  const [selectedService, setSelectedService] = useState<string>('');
  const [trendDays, setTrendDays] = useState(30);

  // Get top services
  const { data: topServices, isLoading: topServicesLoading } = useQuery(
    ['top-services'],
    async () => {
      return await window.electronAPI.getTopServices(10);
    }
  );

  // Get service performance data
  const { data: servicePerformance, isLoading: performanceLoading } = useQuery(
    ['service-performance'],
    async () => {
      return await window.electronAPI.getServicePerformance();
    }
  );

  // Get service trends
  const { data: serviceTrends, isLoading: trendsLoading } = useQuery(
    ['service-trends', selectedService, trendDays],
    async () => {
      if (!selectedService) return [];
      return await window.electronAPI.getServiceTrends(selectedService, trendDays);
    },
    { enabled: !!selectedService }
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

  return (
    <div className="service-performance">
      {/* Service Overview */}
      <div className="card">
        <h3>Top Performing Services</h3>
        {topServicesLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="services-table">
            <div className="table-header">
              <div>Service</div>
              <div>Bookings</div>
              <div>Revenue</div>
              <div>Avg Price</div>
              <div>Price Range</div>
            </div>
            {topServices?.map((service, index) => (
              <div key={index} className="table-row">
                <div className="service-name">{service.name}</div>
                <div className="bookings">{formatNumber(service.bookings)}</div>
                <div className="revenue">{formatCurrency(service.revenue)}</div>
                <div className="avg-price">{formatCurrency(service.avg_price)}</div>
                <div className="price-range">
                  {formatCurrency(service.min_price)} - {formatCurrency(service.max_price)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Performance Details */}
      <div className="card">
        <h3>Service Performance Analysis</h3>
        {performanceLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="performance-grid">
            {servicePerformance?.map((service, index) => (
              <div key={index} className="performance-card">
                <div className="service-header">
                  <h4>{service.service_name}</h4>
                  <div className="service-stats">
                    <span className="stat">
                      {formatNumber(service.total_bookings)} bookings
                    </span>
                    <span className="stat">
                      {formatCurrency(service.total_revenue)} revenue
                    </span>
                  </div>
                </div>
                <div className="service-details">
                  <div className="detail-item">
                    <span className="label">Avg Price:</span>
                    <span className="value">{formatCurrency(service.avg_price)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Unique Invoices:</span>
                    <span className="value">{formatNumber(service.unique_invoices)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">First Booking:</span>
                    <span className="value">{formatDate(service.first_booking)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Last Booking:</span>
                    <span className="value">{formatDate(service.last_booking)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Trends */}
      <div className="card">
        <h3>Service Trends Analysis</h3>
        <div className="trends-controls">
          <div className="control-group">
            <label>Select Service:</label>
            <select 
              value={selectedService} 
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Choose a service...</option>
              {topServices?.map((service, index) => (
                <option key={index} value={service.name}>{service.name}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Days:</label>
            <select 
              value={trendDays} 
              onChange={(e) => setTrendDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {selectedService && (
          <div className="trends-content">
            {trendsLoading ? (
              <div className="loading">Loading trends...</div>
            ) : serviceTrends?.length ? (
              <div className="trends-chart">
                <div className="trends-header">
                  <h4>{selectedService} - Last {trendDays} days</h4>
                  <div className="trends-summary">
                    <span>Total Bookings: {formatNumber(serviceTrends.reduce((sum, trend) => sum + trend.bookings, 0))}</span>
                    <span>Total Revenue: {formatCurrency(serviceTrends.reduce((sum, trend) => sum + trend.revenue, 0))}</span>
                  </div>
                </div>
                <div className="trends-bars">
                  {serviceTrends.slice(0, 14).map((trend, index) => (
                    <div key={index} className="trend-bar">
                      <div className="bar-container">
                        <div 
                          className="bookings-bar" 
                          style={{ 
                            height: `${(trend.bookings / Math.max(...serviceTrends.map(t => t.bookings)) * 100)}%` 
                          }}
                          title={`${trend.bookings} bookings`}
                        ></div>
                        <div 
                          className="revenue-bar" 
                          style={{ 
                            height: `${(trend.revenue / Math.max(...serviceTrends.map(t => t.revenue)) * 100)}%` 
                          }}
                          title={`${formatCurrency(trend.revenue)} revenue`}
                        ></div>
                      </div>
                      <div className="bar-label">{new Date(trend.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  ))}
                </div>
                <div className="trends-legend">
                  <div className="legend-item">
                    <div className="legend-color bookings"></div>
                    <span>Bookings</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color revenue"></div>
                    <span>Revenue</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data">No trends data available for this service</div>
            )}
          </div>
        )}
      </div>

      {/* Service Insights */}
      <div className="card">
        <h3>Service Insights</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-title">Most Popular Service</div>
            <div className="insight-value">
              {topServices?.[0]?.name || 'No data'}
            </div>
            <div className="insight-subtitle">
              {topServices?.[0] ? `${formatNumber(topServices[0].bookings)} bookings` : ''}
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-title">Highest Revenue Service</div>
            <div className="insight-value">
              {topServices?.[0]?.name || 'No data'}
            </div>
            <div className="insight-subtitle">
              {topServices?.[0] ? formatCurrency(topServices[0].revenue) : ''}
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-title">Average Service Price</div>
            <div className="insight-value">
              {topServices?.length ? 
                formatCurrency(topServices.reduce((sum, service) => sum + service.avg_price, 0) / topServices.length) : 
                'No data'
              }
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-title">Total Services Offered</div>
            <div className="insight-value">
              {formatNumber(servicePerformance?.length || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

