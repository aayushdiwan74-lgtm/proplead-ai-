
import React from 'react';
// Import MarketCategory since PropertyType does not exist in types.ts
import { MarketCategory } from '../types';

interface FilterState {
  searchTerm: string;
  propertyType: string;
  startDate: string;
  endDate: string;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  resultCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, onReset, resultCount }) => {
  // Manually define the list of property types as MarketCategory is a type union, not an enum.
  const propertyTypes: MarketCategory[] = ['Residential', 'Commercial', 'Industrial', 'Plot', 'Other'];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Keyword Search */}
        <div className="flex-grow">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Search Keywords</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Broker name or location..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
        </div>

        {/* Property Type Filter */}
        <div className="w-full lg:w-48">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Property Type</label>
          <select
            className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
            value={filters.propertyType}
            onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
          >
            <option value="">All Types</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex gap-2 items-end w-full lg:w-auto">
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">From Date</label>
            <input
              type="date"
              className="block w-full px-3 py-2.5 text-sm border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">To Date</label>
            <input
              type="date"
              className="block w-full px-3 py-2.5 text-sm border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest h-[42px]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
            {resultCount} Result{resultCount !== 1 ? 's' : ''} Found
          </span>
        </div>
        <div className="flex gap-2">
          {filters.propertyType && (
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{filters.propertyType}</span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase italic">Date Filter Active</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
