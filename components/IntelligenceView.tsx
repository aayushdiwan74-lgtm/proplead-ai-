
import React, { useMemo } from 'react';
import { ProcessedData, Lead, Category } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface IntelligenceViewProps {
  history: ProcessedData[];
}

const IntelligenceView: React.FC<IntelligenceViewProps> = ({ history }) => {
  const aggregatedStats = useMemo(() => {
    const allLeads: Lead[] = history.flatMap(h => h.leads);
    const monthMap: Record<string, { count: number; supply: number; demand: number }> = {};

    history.forEach(report => {
      const month = report.analytics.monthlySummary.monthName;
      if (!monthMap[month]) monthMap[month] = { count: 0, supply: 0, demand: 0 };
      monthMap[month].count += report.leads.length;
      monthMap[month].supply += report.leads.filter(l => l.category === Category.SUPPLY).length;
      monthMap[month].demand += report.leads.filter(l => l.category === Category.DEMAND).length;
    });

    return {
      totalLeads: allLeads.length,
      months: Object.entries(monthMap).map(([name, stats]) => ({ name, ...stats })),
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h3 className="text-xl font-bold text-slate-800">Intelligence Requires Data</h3>
        <p className="text-slate-500 mt-2">Process and save your first batch of logs to unlock business-wide reporting.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Firm Intelligence Hub</h2>
          <p className="text-slate-500 font-medium">Consolidated multi-period lead performance analysis</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Lifecycle Leads</p>
          <p className="text-2xl font-black text-indigo-600">{aggregatedStats.totalLeads}</p>
        </div>
      </div>

      {/* Monthly Business Report */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
          <h3 className="text-xl font-bold text-slate-800">Global Monthly Reports</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 p-6 rounded-3xl text-white">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Volume Growth</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregatedStats.months}>
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Consolidated volume across all firm branches and brokers based on aggregated historical exports.
            </p>
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Month</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Total Leads</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Demand %</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Supply %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aggregatedStats.months.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{m.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{m.count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-600 font-bold text-sm">{Math.round((m.demand/m.count)*100)}%</span>
                        <div className="flex-grow h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{width: `${(m.demand/m.count)*100}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-600 font-bold text-sm">{Math.round((m.supply/m.count)*100)}%</span>
                        <div className="flex-grow h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{width: `${(m.supply/m.count)*100}%`}}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntelligenceView;
