
import React, { useState, useMemo, useEffect } from 'react';
import { processChatLogs } from './services/geminiService';
import { ProcessedData, Lead } from './types';
import Header from './components/Header';
import LogUploader from './components/LogUploader';
import DataTable from './components/DataTable';
import AnalyticsView from './components/AnalyticsView';
import Login from './components/Login';
import HistoryView from './components/HistoryView';
import IntelligenceView from './components/IntelligenceView';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('prop_lead_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'intelligence'>('upload');
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [data, setData] = useState<ProcessedData | null>(null);
  const [history, setHistory] = useState<ProcessedData[]>(() => {
    const saved = localStorage.getItem('prop_lead_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<{ message: string; isQuota: boolean; isDuplicate: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dupeCount, setDupeCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('prop_lead_history', JSON.stringify(history));
  }, [history]);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (key: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('prop_lead_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('prop_lead_auth');
    setData(null);
  };

  /**
   * Semantic Fingerprinting Engine
   * Generates a unique semantic hash based on key listing attributes.
   * Resilient to whitespace and case variations.
   */
  const getLeadFingerprint = (l: Lead) => {
    const raw = `${l.date}|${l.who}|${l.location}|${l.priceRate}|${l.category}`;
    return raw.toLowerCase().trim().replace(/\s+/g, '');
  };

  const handleProcessLogs = async (logs: string) => {
    setLoading(true);
    setError(null);
    setDupeCount(0);
    setNewCount(0);
    setProgressMsg('Engineering Real Estate Data Table...');
    
    try {
      const result = await processChatLogs(logs, (msg) => setProgressMsg(msg));
      
      // Load all historical fingerprints for cross-vault comparison
      const vaultFingerprints = new Set(
        history.flatMap(report => report.leads.map(l => getLeadFingerprint(l)))
      );

      // Identify the Delta: Only leads not seen in any previous processing run
      const freshLeads = result.leads.filter(l => !vaultFingerprints.has(getLeadFingerprint(l)));
      const duplicatesFound = result.leads.length - freshLeads.length;
      
      setDupeCount(duplicatesFound);
      setNewCount(freshLeads.length);

      // Automatic Cleansing: 100% Duplicate Rate Protection
      if (freshLeads.length === 0 && result.leads.length > 0) {
        setError({ 
          message: "SYSTEM ALERT: This file has already been extracted. No new unique listings detected in the sequence.", 
          isQuota: false,
          isDuplicate: true 
        });
        setLoading(false);
        return;
      }

      if (freshLeads.length === 0 && result.leads.length === 0) {
        setError({ 
          message: "No property listings could be identified in the provided log content.", 
          isQuota: false,
          isDuplicate: false 
        });
        setLoading(false);
        return;
      }

      // Create a Delta Report: Only store the new entries to keep the vault clean
      const cleanedResult: ProcessedData = { 
        ...result, 
        leads: freshLeads,
        analytics: {
          ...result.analytics,
          monthlySummary: {
            ...result.analytics.monthlySummary,
            totalLeads: freshLeads.length
          }
        }
      };
      
      setData(cleanedResult);
      setHistory(prev => [cleanedResult, ...prev]);
    } catch (err: any) {
      setError({ 
        message: "Pipeline Error: Data extraction failed. Verify API key and log integrity.", 
        isQuota: err.message?.includes("429"),
        isDuplicate: false
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    return data.leads
      .map((l, i) => ({ ...l, originalIndex: i }))
      .filter(l => 
        (l.location || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
        (l.who || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (l.additionalDetails || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      );
  }, [data, searchTerm]);

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onLogout={handleLogout} onSelectKey={handleSelectKey} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow container mx-auto px-6 py-10">
        {activeTab === 'history' ? (
          <HistoryView reports={history} onSelect={(r) => { setData(r); setActiveTab('upload'); }} onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))} />
        ) : activeTab === 'intelligence' ? (
          <IntelligenceView history={history} />
        ) : (
          <div className="max-w-6xl mx-auto space-y-12">
            {!data && !loading && (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-black text-slate-800">Incremental Lead Processor</h2>
                </div>
                <p className="text-slate-500 mb-8 text-sm max-w-2xl font-medium">
                  Upload WhatsApp logs to extract listings. Our <b>Global Fingerprinting System</b> scans your entire history vault 
                  and automatically filters out duplicates, ensuring you only see new data.
                </p>
                <LogUploader onProcess={handleProcessLogs} />
                {error && (
                  <div className={`mt-6 p-5 rounded-2xl border flex items-start space-x-4 ${error.isDuplicate ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                    <div className={`p-2 rounded-lg ${error.isDuplicate ? 'bg-amber-100' : 'bg-rose-100'}`}>
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest">{error.isDuplicate ? 'Vault Synchronized' : 'Extraction Error'}</p>
                      <p className="text-sm font-semibold mt-1 leading-relaxed">{error.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-indigo-600 border-opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl animate-pulse flex items-center justify-center">
                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-black uppercase tracking-[0.25em] text-xs mb-1">{progressMsg}</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Identifying New Assets & Cleaning Duplicates</p>
                </div>
              </div>
            )}
            {data && !loading && (
              <div className="space-y-10">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-2xl border border-emerald-200 text-xs font-black uppercase tracking-widest flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></span>
                    {newCount} New Delta Leads
                  </div>
                  {dupeCount > 0 && (
                    <div className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest flex items-center">
                      <svg className="w-3.5 h-3.5 mr-2 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                      {dupeCount} Vault Duplicates Ignored
                    </div>
                  )}
                  <button 
                    onClick={() => setData(null)}
                    className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                    <span>Back to Uploader</span>
                  </button>
                </div>
                <DataTable leads={filteredLeads as any} onUpdateLead={(idx, l) => { const d = {...data}; d.leads[idx] = l; setData(d); }} searchTerm={searchTerm} onSearchChange={setSearchTerm} onClose={() => setData(null)} />
                <AnalyticsView analytics={data.analytics} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
