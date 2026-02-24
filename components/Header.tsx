
import React from 'react';

interface HeaderProps {
  onLogout: () => void;
  onSelectKey: () => void;
  activeTab: 'upload' | 'history' | 'intelligence';
  setActiveTab: (tab: 'upload' | 'history' | 'intelligence') => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onSelectKey, activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">PropLead <span className="text-indigo-600 italic">AI</span></h1>
        </div>
        
        <nav className="flex items-center space-x-8">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`text-sm font-bold transition-all ${activeTab === 'upload' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Processor
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-sm font-bold transition-all ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Vault
          </button>
          
          <div className="flex items-center space-x-4 border-l border-slate-200 pl-8">
            <button 
              onClick={onSelectKey}
              className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-all"
              title="Change Gemini API Key"
            >
              Key Settings
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center space-x-1 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-all uppercase tracking-widest"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
