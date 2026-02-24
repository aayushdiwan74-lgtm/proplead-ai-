import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, ReferenceLine, Label } from 'recharts';
import { Analytics, MarketCategory } from '../types';

interface AnalyticsViewProps {
  analytics: Analytics;
}

// Helper for Linear Regression
const calculateTrendline = (data: { x: number, y: number }[]) => {
  const n = data.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of data) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  const [activeTab, setActiveTab] = useState<'visuals' | 'reports' | 'comparison' | 'trends'>('visuals');
  const [filterCategory, setFilterCategory] = useState<MarketCategory | 'All'>('All');
  const [graphSearch, setGraphSearch] = useState('');
  const [comparisonItems, setComparisonItems] = useState<string[]>([]);
  const [selectedTrendLoc, setSelectedTrendLoc] = useState<string>('');

  // Filtering Logic for Dashboard
  const filteredPricing = useMemo(() => {
    return analytics.locationPricing.filter(item => {
      const matchesSearch = (item.location || '').toLowerCase().includes((graphSearch || '').toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.marketCategory === filterCategory;
      return matchesSearch && matchesCategory;
    }).slice(0, 20);
  }, [analytics.locationPricing, graphSearch, filterCategory]);

  const toggleComparison = (id: string) => {
    setComparisonItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-4)
    );
  };

  const comparisonData = useMemo(() => {
    return analytics.locationPricing.filter(item => 
      comparisonItems.includes(`${item.location}|${item.marketCategory}`)
    );
  }, [analytics.locationPricing, comparisonItems]);

  const trendData = useMemo(() => {
    if (!selectedTrendLoc) return [];
    const item = analytics.locationPricing.find(l => `${l.location}|${l.marketCategory}` === selectedTrendLoc);
    if (!item || !item.history) return [];
    
    const parseDate = (d: string) => {
      if (d.includes('-')) return new Date(d).getTime();
      const parts = d.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return new Date(`${year}-${parts[1]}-${parts[0]}`).getTime();
      }
      return new Date(d).getTime();
    };

    const sortedHistory = [...item.history]
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));

    const regressionPoints = sortedHistory.map(h => ({
      x: parseDate(h.date),
      y: h.rate
    }));

    const trendline = calculateTrendline(regressionPoints);

    return sortedHistory.map((h, i) => {
      const x = parseDate(h.date);
      return {
        ...h,
        timestamp: x,
        formattedDate: h.date,
        trend: trendline ? trendline.slope * x + trendline.intercept : null,
        isLatest: i === sortedHistory.length - 1
      };
    });
  }, [analytics.locationPricing, selectedTrendLoc]);

  const trendAnalysis = useMemo(() => {
    if (trendData.length < 2) return null;
    const item = analytics.locationPricing.find(l => `${l.location}|${l.marketCategory}` === selectedTrendLoc);
    if (!item) return null;

    const first = trendData[0].rate;
    const last = trendData[trendData.length - 1].rate;
    const prev = trendData[trendData.length - 2].rate;
    
    const overallGrowth = ((last - first) / first) * 100;
    const weeklyChange = ((last - prev) / prev) * 100;
    
    let direction: 'Uptrend' | 'Downtrend' | 'Stable' = 'Stable';
    if (overallGrowth > 2) direction = 'Uptrend';
    else if (overallGrowth < -2) direction = 'Downtrend';

    return {
      overallGrowth: overallGrowth.toFixed(2),
      weeklyChange: weeklyChange.toFixed(2),
      direction,
      isPositive: overallGrowth >= 0,
      summary: `The property valuation in this sector has ${overallGrowth >= 0 ? 'appreciated' : 'depreciated'} by ${Math.abs(overallGrowth).toFixed(2)}% during the observed timeframe. This shift reflects the current liquidity and demand-supply dynamics specific to the ${item.marketCategory} asset class in ${item.location}. Investors should monitor this ${item.trendDirection} trend closely to optimize entry and exit points in the local market.`
    };
  }, [trendData, analytics.locationPricing, selectedTrendLoc]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6'];
  const BROKER_COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

  const categories: (MarketCategory | 'All')[] = ['All', 'Residential', 'Plot', 'Commercial', 'Industrial', 'Other'];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="border-b border-slate-200">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('visuals')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${activeTab === 'visuals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Analytics Dashboard</button>
          <button onClick={() => setActiveTab('comparison')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${activeTab === 'comparison' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Comparison Engine</button>
          <button onClick={() => setActiveTab('trends')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${activeTab === 'trends' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Historical Trends</button>
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Executive Briefing</button>
        </div>
      </div>

      {activeTab === 'visuals' && (
        <div className="space-y-6">
          {/* Global Category Filter */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Global Asset Filter</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.categoryInsights.filter(i => filterCategory === 'All' || i.category === filterCategory).map((insight, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{insight.category}</p>
                  <span className="text-[9px] font-bold text-slate-300 group-hover:text-indigo-400">{insight.totalLeads} Data Points</span>
                </div>
                <h4 className="text-2xl font-black text-slate-800">₹{insight.avgPricePerSqFt}<span className="text-[10px] text-slate-400 font-medium ml-1">/sqft</span></h4>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{insight.notes}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Intelligence Chart */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Price Intelligence</h3>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search Project..."
                      className="pl-8 pr-4 py-2 text-[10px] border border-slate-200 rounded-lg outline-none focus:border-indigo-500 w-full transition-all font-bold"
                      value={graphSearch}
                      onChange={(e) => setGraphSearch(e.target.value)}
                    />
                    <svg className="w-3 h-3 absolute left-3 top-2.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
               </div>
               
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredPricing}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="location" fontSize={9} axisLine={false} tickLine={false} fontWeight="800" textAnchor="end" height={60} interval={0} angle={-45} dy={10} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} fontWeight="600" />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }} 
                        labelStyle={{ fontWeight: '900', color: '#1e293b', fontSize: '10px' }}
                      />
                      <Bar dataKey="avgRate" radius={[6, 6, 0, 0]} barSize={24}>
                        {filteredPricing.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Broker Activity Chart */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="flex items-center space-x-3 mb-10">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Broker Market Presence</h3>
               </div>
               
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topBrokers} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" fontSize={9} axisLine={false} tickLine={false} fontWeight="600" />
                      <YAxis type="category" dataKey="name" fontSize={9} axisLine={false} tickLine={false} fontWeight="800" width={100} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
                        labelStyle={{ fontWeight: '900', color: '#1e293b', fontSize: '10px' }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                        {analytics.topBrokers.map((_, index) => <Cell key={`cell-broker-${index}`} fill={BROKER_COLORS[index % BROKER_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-4 text-center">Top 5 active brokers by total lead acquisition volume</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Overlay Comparison Board</h2>
            <p className="text-slate-400 text-sm mb-8 font-medium max-w-xl">Compare specific project categories side-by-side. Select tags below to visualize market variance across different asset classes.</p>
            <div className="flex flex-wrap gap-2">
              {analytics.locationPricing.slice(0, 30).map((loc) => {
                const id = `${loc.location}|${loc.marketCategory}`;
                return (
                  <button 
                    key={id} 
                    onClick={() => toggleComparison(id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${comparisonItems.includes(id) ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:border-indigo-400/50 hover:text-white'}`}
                  >
                    {loc.location} <span className="opacity-50 ml-1">({loc.marketCategory})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {comparisonItems.length > 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm animate-fade-in">
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey={(d) => `${d.location}\n(${d.marketCategory})`} 
                      fontSize={9} 
                      axisLine={false} 
                      tickLine={false} 
                      fontWeight="900" 
                    />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-100">
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{data.marketCategory}</p>
                              <p className="text-sm font-black text-slate-800 mb-2">{data.location}</p>
                              <div className="space-y-1 border-t pt-2">
                                <p className="text-xs font-bold text-slate-600">Avg: ₹{data.avgRate}/sqft</p>
                                <p className="text-[10px] text-slate-400">Range: ₹{data.minPrice} - ₹{data.maxPrice}</p>
                                <p className={`text-[10px] font-bold uppercase ${data.trendDirection === 'up' ? 'text-emerald-600' : data.trendDirection === 'down' ? 'text-rose-600' : 'text-slate-400'}`}>
                                  Trend: {data.trendDirection}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }} />
                    <Bar name="Market Value (₹/sqft)" dataKey="avgRate" fill="#4f46e5" radius={[12, 12, 0, 0]} barSize={60}>
                       {comparisonData.map((_, index) => <Cell key={`cell-comp-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Select Project Categories Above to Generate Comparison</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Historic Price Trend – {selectedTrendLoc ? selectedTrendLoc.split('|')[0] : 'Market'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">Select a project to visualize its price trajectory over time.</p>
              </div>
              <div className="w-full md:w-72">
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest outline-none focus:border-indigo-500 bg-slate-50"
                  value={selectedTrendLoc}
                  onChange={(e) => setSelectedTrendLoc(e.target.value)}
                >
                  <option value="">Select Project Node...</option>
                  {analytics.locationPricing.filter(l => (l.history?.length || 0) >= 1).map(l => (
                    <option key={`${l.location}|${l.marketCategory}`} value={`${l.location}|${l.marketCategory}`}>
                      {l.location} ({l.marketCategory})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTrendLoc ? (
              <div className="space-y-12 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-inner">
                  <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 40, right: 40, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="formattedDate" fontSize={10} axisLine={false} tickLine={false} fontWeight="800" />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} fontWeight="600" domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: '900', fontSize: '10px', color: '#1e293b' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }} />
                        
                        <Line 
                          type="monotone" 
                          dataKey="rate" 
                          name="Price per Sq Ft" 
                          stroke="#1f77b4" 
                          strokeWidth={4} 
                          dot={{ r: 6, fill: '#1f77b4', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                        
                        <Line 
                          type="monotone" 
                          dataKey="trend" 
                          name="Trendline (Linear Regression)" 
                          stroke="#94a3b8" 
                          strokeWidth={2} 
                          strokeDasharray="5 5" 
                          dot={false} 
                          activeDot={false}
                        />

                        {trendData.length > 0 && (
                          <ReferenceLine x={trendData[trendData.length - 1].formattedDate} stroke="transparent">
                            <Label 
                              value="Latest Update" 
                              position="top" 
                              fill="#1f77b4" 
                              fontSize={10} 
                              fontWeight="900" 
                              offset={10}
                              className="uppercase tracking-widest"
                            />
                          </ReferenceLine>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {trendAnalysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-2 h-6 rounded-full ${trendAnalysis.isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Market Insight Summary</h4>
                        </div>
                        <p className="text-lg text-slate-700 font-bold leading-relaxed">
                          {trendAnalysis.summary}
                        </p>
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Change</p>
                            <p className={`text-lg font-black ${Number(trendAnalysis.weeklyChange) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {Number(trendAnalysis.weeklyChange) >= 0 ? '+' : ''}{trendAnalysis.weeklyChange}%
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Growth</p>
                            <p className={`text-lg font-black ${trendAnalysis.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {trendAnalysis.isPositive ? '+' : ''}{trendAnalysis.overallGrowth}%
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Trend Direction</p>
                            <p className={`text-lg font-black ${trendAnalysis.direction === 'Uptrend' ? 'text-emerald-600' : trendAnalysis.direction === 'Downtrend' ? 'text-rose-600' : 'text-slate-500'}`}>
                              {trendAnalysis.direction}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Points</p>
                            <p className="text-lg font-black text-slate-800">{trendData.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-900 p-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Historical Dataset</h4>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Week</th>
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Price/Sqft</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[...trendData].reverse().map((h, i) => (
                              <tr key={i} className={h.isLatest ? 'bg-indigo-50/50' : ''}>
                                <td className="px-4 py-3 text-xs font-bold text-slate-600">
                                  {h.formattedDate}
                                  {h.isLatest && <span className="ml-2 text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Latest</span>}
                                </td>
                                <td className="px-4 py-3 text-xs font-black text-slate-800 text-right">₹{h.rate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Select a project node to initialize trend analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm animate-fade-in max-w-5xl mx-auto border-t-[8px] border-t-indigo-600">
           <div className="flex items-center space-x-6 mb-12">
              <div className="w-16 h-16 bg-indigo-900 rounded-2xl flex items-center justify-center text-[#D4AF37] shadow-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Real Estate Executive Intelligence</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Confidential Market Report • PropLead AI Engine</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-1 gap-10">
              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-indigo-600/5 rotate-12">
                   <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-6">Market Narratives</h4>
                <p className="text-xl text-slate-800 leading-relaxed font-bold tracking-tight">
                  {analytics.executiveNarrative}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100/50">
                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-6 flex items-center">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mr-2"></span>
                    Hottest Locations (Demand Velocity)
                  </h4>
                  <div className="space-y-4">
                    {analytics.topDemandLocations.map((l, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{l.location}</span>
                        <div className="flex items-center space-x-3">
                           <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(l.count/analytics.topDemandLocations[0].count)*100}%` }}></div>
                           </div>
                           <span className="text-xs font-black text-amber-700 w-12 text-right">{l.count} req</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100/50">
                  <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-6 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-2"></span>
                    Primary Supply Nodes (Inventory Focus)
                  </h4>
                  <div className="space-y-4">
                    {analytics.topSupplyLocations.map((l, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{l.location}</span>
                        <div className="flex items-center space-x-3">
                           <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(l.count/analytics.topSupplyLocations[0].count)*100}%` }}></div>
                           </div>
                           <span className="text-xs font-black text-emerald-700 w-12 text-right">{l.count} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
           </div>

           <div className="mt-12 text-center">
              <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">This analysis is dynamically generated and subject to variance based on sample size.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;