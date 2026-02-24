
import React from 'react';
import { ProcessedData } from '../types';

interface HistoryViewProps {
  reports: ProcessedData[];
  onSelect: (report: ProcessedData) => void;
  onDelete: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ reports, onSelect, onDelete }) => {
  if (reports.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Your Vault is Empty</h3>
        <p className="text-slate-500 mt-2">Processed leads will automatically appear here for permanent storage.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Lead Archive Vault</h2>
          <p className="text-slate-500 font-medium">Historical records of all data engineering runs</p>
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{reports.length} Reports Saved</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.sort((a, b) => b.timestamp - a.timestamp).map((report) => (
          <div key={report.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center space-x-5">
              <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Report: {report.analytics.monthlySummary.monthName}</h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(report.timestamp).toLocaleString()}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">
                    {report.leads.length} Leads Extracted
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button 
                onClick={() => onSelect(report)}
                className="flex-grow md:flex-grow-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                Restore View
              </button>
              <button 
                onClick={() => onDelete(report.id)}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Permanently Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;
