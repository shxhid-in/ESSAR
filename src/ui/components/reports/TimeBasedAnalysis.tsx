import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function TimeBasedAnalysis() {
  const [dailyDays, setDailyDays] = useState(7);
  const [weeklyWeeks, setWeeklyWeeks] = useState(12);

  // Get daily performance data
  const { data: dailyPerformance, isLoading: dailyLoading } = useQuery(
    ['daily-performance', dailyDays],
    async () => {
      return await window.electronAPI.getDailyPerformance(dailyDays);
    }
  );

  // Get weekly performance data
  const { data: weeklyPerformance, isLoading: weeklyLoading } = useQuery(
    ['weekly-performance', weeklyWeeks],
    async () => {
      return await window.electronAPI.getWeeklyPerformance(weeklyWeeks);
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
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const calculateTrends = (data: any[]) => {
    if (data.length < 2) return { trend: 'stable', percentage: 0 };
    
    const recent = data.slice(0, Math.ceil(data.length / 2));
    const older = data.slice(Math.ceil(data.length / 2));
    
    const recentAvg = recent.reduce((sum, item) => sum + item.total_revenue, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.total_revenue, 0) / older.length;
    
    const percentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const getBestDay = (data: any[]) => {
    if (!data.length) return null;
    return data.reduce((best, current) => 
      current.total_revenue > best.total_revenue ? current : best
    );
  };

  const getWorstDay = (data: any[]) => {
    if (!data.length) return null;
    return data.reduce((worst, current) => 
      current.total_revenue < worst.total_revenue ? current : worst
    );
  };

  const dailyTrends = calculateTrends(dailyPerformance || []);
  const weeklyTrends = calculateTrends(weeklyPerformance || []);
  const bestDay = getBestDay(dailyPerformance || []);
  const worstDay = getWorstDay(dailyPerformance || []);

  return (
    <div className="time-based-analysis">
      {/* Daily Performance */}
      <div className="card">
        <h3>Daily Performance Analysis</h3>
        <div className="analysis-controls">
          <label>Days to analyze:</label>
          <select 
            value={dailyDays} 
            onChange={(e) => setDailyDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
        
        {dailyLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="daily-analysis">
            <div className="daily-chart">
              {dailyPerformance?.map((day, index) => (
                <div key={index} className="day-bar">
                  <div className="bar-container">
                    <div 
                      className="revenue-bar" 
                      style={{ 
                        height: `${(day.total_revenue / Math.max(...(dailyPerformance?.map(d => d.total_revenue) || [1])) * 100)}%` 
                      }}
                      title={`${formatCurrency(day.total_revenue)} revenue`}
                    ></div>
                    <div 
                      className="invoices-bar" 
                      style={{ 
                        height: `${(day.invoice_count / Math.max(...(dailyPerformance?.map(d => d.invoice_count) || [1])) * 100)}%` 
                      }}
                      title={`${formatNumber(day.invoice_count)} invoices`}
                    ></div>
                  </div>
                  <div className="bar-label">
                    {formatDate(day.day)}
                  </div>
                  <div className="bar-details">
                    <div className="revenue">{formatCurrency(day.total_revenue)}</div>
                    <div className="invoices">{formatNumber(day.invoice_count)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="daily-insights">
              <div className="insight-item">
                <div className="insight-title">Trend</div>
                <div className={`insight-value ${dailyTrends.trend}`}>
                  {dailyTrends.trend === 'up' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                  ) : dailyTrends.trend === 'down' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                      <polyline points="17 18 23 18 23 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                  {dailyTrends.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-title">Best Day</div>
                <div className="insight-value">
                  {bestDay ? `${getDayName(bestDay.day_of_week)} - ${formatCurrency(bestDay.total_revenue)}` : 'N/A'}
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-title">Worst Day</div>
                <div className="insight-value">
                  {worstDay ? `${getDayName(worstDay.day_of_week)} - ${formatCurrency(worstDay.total_revenue)}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Performance */}
      <div className="card">
        <h3>Weekly Performance Analysis</h3>
        <div className="analysis-controls">
          <label>Weeks to analyze:</label>
          <select 
            value={weeklyWeeks} 
            onChange={(e) => setWeeklyWeeks(Number(e.target.value))}
          >
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
            <option value={24}>Last 24 weeks</option>
          </select>
        </div>
        
        {weeklyLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="weekly-analysis">
            <div className="weekly-chart">
              {weeklyPerformance?.slice(0, 12).map((week, index) => (
                <div key={index} className="week-bar">
                  <div className="bar-container">
                    <div 
                      className="revenue-bar" 
                      style={{ 
                        height: `${(week.total_revenue / Math.max(...(weeklyPerformance?.map(w => w.total_revenue) || [1])) * 100)}%` 
                      }}
                      title={`${formatCurrency(week.total_revenue)} revenue`}
                    ></div>
                    <div 
                      className="invoices-bar" 
                      style={{ 
                        height: `${(week.invoice_count / Math.max(...(weeklyPerformance?.map(w => w.invoice_count) || [1])) * 100)}%` 
                      }}
                      title={`${formatNumber(week.invoice_count)} invoices`}
                    ></div>
                  </div>
                  <div className="bar-label">
                    Week {week.week.split('-')[1]}
                  </div>
                  <div className="bar-details">
                    <div className="revenue">{formatCurrency(week.total_revenue)}</div>
                    <div className="invoices">{formatNumber(week.invoice_count)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="weekly-insights">
              <div className="insight-item">
                <div className="insight-title">Trend</div>
                <div className={`insight-value ${weeklyTrends.trend}`}>
                  {weeklyTrends.trend === 'up' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                  ) : weeklyTrends.trend === 'down' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                      <polyline points="17 18 23 18 23 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                  {weeklyTrends.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-title">Best Week</div>
                <div className="insight-value">
                  {weeklyPerformance?.[0] ? 
                    `Week ${weeklyPerformance[0].week.split('-')[1]} - ${formatCurrency(weeklyPerformance[0].total_revenue)}` : 
                    'N/A'
                  }
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-title">Average Weekly</div>
                <div className="insight-value">
                  {weeklyPerformance?.length ? 
                    formatCurrency(weeklyPerformance.reduce((sum, week) => sum + week.total_revenue, 0) / weeklyPerformance.length) : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day of Week Analysis */}
      <div className="card">
        <h3>Day of Week Performance</h3>
        {dailyLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="dow-analysis">
            <div className="dow-chart">
              {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                const dayData = dailyPerformance?.filter(d => d.day_of_week === dayOfWeek);
                const avgRevenue = dayData?.length ? 
                  dayData.reduce((sum, day) => sum + day.total_revenue, 0) / dayData.length : 0;
                const avgInvoices = dayData?.length ? 
                  dayData.reduce((sum, day) => sum + day.invoice_count, 0) / dayData.length : 0;
                
                return (
                  <div key={dayOfWeek} className="dow-bar">
                    <div className="bar-container">
                      <div 
                        className="revenue-bar" 
                        style={{ 
                          height: `${(avgRevenue / Math.max(...[0, 1, 2, 3, 4, 5, 6].map(dow => {
                            const dowData = dailyPerformance?.filter(d => d.day_of_week === dow);
                            return dowData?.length ? 
                              dowData.reduce((sum, day) => sum + day.total_revenue, 0) / dowData.length : 0;
                          })) * 100)}%` 
                        }}
                        title={`${formatCurrency(avgRevenue)} avg revenue`}
                      ></div>
                      <div 
                        className="invoices-bar" 
                        style={{ 
                          height: `${(avgInvoices / Math.max(...[0, 1, 2, 3, 4, 5, 6].map(dow => {
                            const dowData = dailyPerformance?.filter(d => d.day_of_week === dow);
                            return dowData?.length ? 
                              dowData.reduce((sum, day) => sum + day.invoice_count, 0) / dowData.length : 0;
                          })) * 100)}%` 
                        }}
                        title={`${formatNumber(avgInvoices)} avg invoices`}
                      ></div>
                    </div>
                    <div className="bar-label">{getDayName(dayOfWeek)}</div>
                    <div className="bar-details">
                      <div className="revenue">{formatCurrency(avgRevenue)}</div>
                      <div className="invoices">{formatNumber(avgInvoices)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time-based Insights */}
      <div className="card">
        <h3>Time-based Insights</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-title">Peak Performance Day</div>
            <div className="insight-value">
              {bestDay ? getDayName(bestDay.day_of_week) : 'No data'}
            </div>
            <div className="insight-subtitle">
              {bestDay ? formatCurrency(bestDay.total_revenue) : ''}
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-title">Lowest Performance Day</div>
            <div className="insight-value">
              {worstDay ? getDayName(worstDay.day_of_week) : 'No data'}
            </div>
            <div className="insight-subtitle">
              {worstDay ? formatCurrency(worstDay.total_revenue) : ''}
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-title">Daily Trend</div>
            <div className="insight-value">
              {dailyTrends.trend === 'up' ? 'Growing' : dailyTrends.trend === 'down' ? 'Declining' : 'Stable'}
            </div>
            <div className="insight-subtitle">
              {dailyTrends.percentage.toFixed(1)}% change
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-title">Weekly Trend</div>
            <div className="insight-value">
              {weeklyTrends.trend === 'up' ? 'Growing' : weeklyTrends.trend === 'down' ? 'Declining' : 'Stable'}
            </div>
            <div className="insight-subtitle">
              {weeklyTrends.percentage.toFixed(1)}% change
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

