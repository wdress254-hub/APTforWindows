import { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Shield, Globe, ExternalLink, Github, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const githubUrl = 'https://raw.githubusercontent.com/wdress254-hub/APTforWindows/main/apt-installer.ps1';
  const installCommand = `irm "${githubUrl}" | iex`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyConnection = async () => {
    setIsVerifying(true);
    setVerifyStatus('idle');
    try {
      const response = await fetch(githubUrl, { method: 'HEAD' });
      if (response.ok) {
        setVerifyStatus('success');
      } else {
        setVerifyStatus('error');
      }
    } catch (e) {
      setVerifyStatus('error');
    }
    setIsVerifying(false);
  };

  const downloadOneClick = () => {
    const batContent = `@echo off\ntitle APT for Windows Installer\necho. \necho --------------------------------------------------\necho   APT for Windows - Automated Installer\necho --------------------------------------------------\necho. \necho Installing from: ${githubUrl}\necho. \npowershell -NoProfile -ExecutionPolicy Bypass -Command "${installCommand}"\necho. \necho Installation complete. You can now use the 'apt' command.\npause`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Install-APT.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    verifyConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-8"
      >
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-600/20">
            <Terminal size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white">APT for Windows</h1>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-gray-500 font-bold">
            <div className={`flex items-center gap-1.5 ${verifyStatus === 'success' ? 'text-emerald-500' : verifyStatus === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
              <Globe size={14} />
              {isVerifying ? 'Verifying Link...' : verifyStatus === 'success' ? 'GitHub Raw: Online' : 'GitHub Raw: 404 Offline'}
            </div>
            <div className="w-1 h-1 bg-gray-800 rounded-full" />
            <a href="https://github.com/wdress254-hub/APTforWindows" target="_blank" rel="noreferrer" className="hover:text-blue-500 flex items-center gap-1 transition-colors">
              <Github size={14} /> Repository <ExternalLink size={10} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Install (Manual) */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest">Method A: Pro One-Liner</span>
                <Shield size={16} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Copy and paste this directly into an Administrator PowerShell window.
              </p>
              <div className="bg-black/50 border border-white/5 rounded-xl p-3 font-mono text-[11px] text-blue-100/70 break-all mb-4">
                {installCommand}
              </div>
            </div>
            <button 
              onClick={copyToClipboard}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Command</>}
            </button>
          </div>

          {/* Quick Install (Auto) */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-all group flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <div className="bg-blue-600 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter">Fastest</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest">Method B: Automatic Mode</span>
                <Zap size={16} className="text-blue-500" />
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Download and run the automated installer. It will handle the terminal setup for you.
              </p>
              {verifyStatus === 'error' && (
                <div className="flex items-center gap-2 text-[10px] text-red-500 bg-red-500/10 p-2 rounded-lg mb-4 border border-red-500/20">
                  <AlertCircle size={12} />
                  <span>The script URL is returning 404. Check your GitHub file path.</span>
                </div>
              )}
            </div>
            <button 
              onClick={downloadOneClick}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20"
            >
              <Zap size={16} fill="currentColor" /> Quick Install
            </button>
          </div>
        </div>

        <div className="text-center pt-8">
           <button 
             onClick={verifyConnection}
             className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest font-bold transition-colors"
           >
             {isVerifying ? 'Refreshing Status...' : 'Click to re-verify github link'}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
