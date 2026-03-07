
import React, { useState } from 'react';
import { Lead, Category } from '../types';

interface DataTableProps {
  leads: (Lead & { originalIndex: number })[];
  onUpdateLead: (index: number, updatedLead: Lead) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onClose: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ leads, onUpdateLead, searchTerm, onSearchChange, onClose }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (idx: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedRows(newExpanded);
  };
  
  const handleExportExcel = () => {
    const headers = ["Date", "Who", "Property Type", "Size", "Price/Rate", "LocationLink", "Additional Details", "Phone", "Category"];
    const rows = leads.map(l => [
      l.date,
      l.who,
      l.propertyType,
      l.size,
      (l.priceRate || '').replace(/,/g, ''),
      l.locationLink || '',
      (l.additionalDetails || '').replace(/\n/g, ' '),
      l.phoneNumber,
      l.category
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Property_Listings_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportGoogleSheets = () => {
    const headers = ["Date", "Who", "Property Type", "Size", "Price/Rate", "LocationLink", "Additional Details", "Phone", "Category"];
    const rows = leads.map(l => [
      l.date,
      l.who,
      l.propertyType,
      l.size,
      l.priceRate || '',
      l.locationLink || '',
      (l.additionalDetails || '').replace(/\n/g, ' '),
      l.phoneNumber,
      l.category
    ]);

    const tsvContent = [
      headers.join("\t"),
      ...rows.map(e => e.join("\t"))
    ].join("\n");

    navigator.clipboard.writeText(tsvContent).then(() => {
      alert("Formatted for Google Sheets! Open your sheet and press Ctrl+V to paste.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Property Listings Audit</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Structured Extraction Verification</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
              <span className="text-xs font-black uppercase tracking-widest">Excel</span>
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button 
              onClick={handleExportGoogleSheets}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-blue-50 text-blue-700 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10V8H7v2zm0 4h10v-2H7v2zm0 4h7v-2H7v2z"/></svg>
              <span className="text-xs font-black uppercase tracking-widest">Sheets</span>
            </button>
          </div>

          <input 
            type="text" 
            placeholder="Search listings..."
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64 shadow-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1300px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-24">Date</th>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-40">Who</th>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-32">Property Type</th>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-24">Size</th>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-32">Price/Rate</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-24">Link</th>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[300px] border-r border-slate-100">Additional Details</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length > 0 ? (
                leads.map((l) => (
                  <tr key={l.originalIndex} className="hover:bg-slate-50/80 transition-colors group align-top">
                    <td className="px-4 py-4 text-xs font-medium text-slate-500 border-r border-slate-100">{l.date}</td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <p className="text-xs font-bold text-slate-800 break-words">{l.who}</p>
                      {l.phoneNumber && l.phoneNumber !== 'N/A' ? (
                        <a 
                          href={`tel:${l.phoneNumber.replace(/\D/g, '')}`}
                          className="text-[9px] text-indigo-500 font-mono mt-1 hover:underline flex items-center space-x-1"
                        >
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span>{l.phoneNumber}</span>
                        </a>
                      ) : (
                        <p className="text-[9px] text-slate-400 font-mono mt-1">{l.phoneNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 border-r border-slate-100">{l.propertyType}</td>
                    <td className="px-4 py-4 text-xs text-slate-600 border-r border-slate-100">{l.size}</td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <p className="text-xs font-black text-indigo-600">{l.priceRate}</p>
                      <span className={`inline-block px-1.5 py-0.5 mt-1 text-[8px] font-black rounded uppercase ${l.category === Category.SUPPLY ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {l.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center border-r border-slate-100">
                      {l.locationLink ? (
                        <a href={l.locationLink} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors">
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </a>
                      ) : <span className="text-slate-200">—</span>}
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <div className="relative">
                        <p className={`text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium ${expandedRows.has(l.originalIndex) ? '' : 'line-clamp-2'}`}>
                          {l.additionalDetails}
                        </p>
                        {l.additionalDetails && l.additionalDetails.length > 80 && (
                          <button 
                            onClick={() => toggleRow(l.originalIndex)}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-3 hover:text-indigo-800 transition-all flex items-center space-x-1.5 group/details"
                          >
                            <span className="underline decoration-indigo-200 underline-offset-4 group-hover/details:decoration-indigo-600">
                              {expandedRows.has(l.originalIndex) ? 'Collapse Details' : 'Expand Full Details'}
                            </span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedRows.has(l.originalIndex) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                          {l.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {l.phoneNumber && l.phoneNumber !== 'N/A' && l.phoneNumber.replace(/\D/g, '').length > 0 ? (
                        <a 
                          href={`tel:${l.phoneNumber.replace(/\D/g, '')}`} 
                          className="inline-flex items-center justify-center space-x-2 w-full px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/60 active:scale-95 group/btn"
                        >
                          <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span className="text-[11px] font-black uppercase tracking-[0.15em]">CALL NOW</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 text-slate-300">
                          <svg className="w-5 h-5 mb-1 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 10.606l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[9px] font-bold uppercase tracking-widest italic opacity-50">No Contact</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-20 text-center text-slate-400 text-sm font-medium italic">
                    No leads discovered in the current log sequence.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
