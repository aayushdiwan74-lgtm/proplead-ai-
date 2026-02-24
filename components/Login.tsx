
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (key: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a production app, this would be a real API check
    // For this demo, we use a standard firm access key: "PROP2025"
    if (key.trim().toUpperCase() === 'PROP2025' || key.trim() === 'admin') {
      onLogin(key);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-indigo-700 p-8 text-center">
          <div className="inline-block bg-white p-3 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PropLead Business Suite</h1>
          <p className="text-indigo-200 text-sm mt-1">Authorized Access Only</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Firm Access Key</label>
            <input 
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 animate-shake' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-lg tracking-widest`}
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs mt-2 font-bold">Invalid Access Credentials</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            Enter Workspace
          </button>
          
          <div className="text-center">
            <p className="text-slate-400 text-xs">Forgot Firm Key? Contact System Administrator.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
