
import React, { useState } from 'react';

interface LogUploaderProps {
  onProcess: (logs: string) => void;
}

const LogUploader: React.FC<LogUploaderProps> = ({ onProcess }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onProcess(text);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste WhatsApp chat log here..."
          className="w-full h-80 p-5 text-sm text-slate-900 font-mono border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white transition-all hide-scrollbar shadow-inner"
        />
        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 transition-colors uppercase tracking-widest border border-slate-200">
            Select File (.txt)
            <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!text.trim()}
        className="w-full bg-indigo-600 text-white font-black py-4 px-6 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.99] uppercase tracking-[0.2em] text-[11px]"
      >
        Execute Data Pipeline
      </button>
    </form>
  );
};

export default LogUploader;
