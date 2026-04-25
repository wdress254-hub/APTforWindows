import { useState, useEffect } from 'react';
import { Terminal, Download, Shield, Zap, Box, Code, Trash2, Edit3, Save, Play, ExternalLink, Github, Info, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('install');
  const [copied, setCopied] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [realOrigin, setRealOrigin] = useState(window.location.origin);

  useEffect(() => {
    // Check server's detected origin first
    fetch('/api/origin')
      .then(res => res.json())
      .then(data => {
        const detected = data.origin;
        if (detected) {
          // If the detected origin is localhost but the browser window says otherwise,
          // prioritize the browser's knowledge of its own URL.
          if (detected.includes('localhost') && !window.location.hostname.includes('localhost')) {
            setRealOrigin(window.location.origin);
          } else {
            setRealOrigin(detected);
          }
        }
      })
      .catch(err => {
        console.error('Origin sync failed:', err);
        setRealOrigin(window.location.origin);
      });

    // Also fetch the script content for the manual code tab
    fetch(`${window.location.origin}/install-apt`)
      .then(res => res.text())
      .then(text => {
        if (text && !text.trim().startsWith('<')) {
          setScriptContent(text);
        } else {
          console.warn('Script fetch returned HTML or empty content. Likely a login gate.');
        }
      })
      .catch(err => console.error('Script fetch failed:', err));
  }, []);

  const [githubUrl, setGithubUrl] = useState('https://raw.githubusercontent.com/wdress254-hub/APTforWindows/main/apt-installer.ps1');

  // One-liner points to GitHub for public reliability
  const installCommand = `irm "${githubUrl}" | iex`;

  const downloadScript = async () => {
    try {
      const response = await fetch('/install-apt');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apt-installer.ps1';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-200 font-sans selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 sticky top-0 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Terminal size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">APT for Windows</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
            <button 
              onClick={copyToClipboard}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-xs"
            >
              Copy Command
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold mb-6"
          >
            <Shield size={12} />
            v1.0.0 Stable Release
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-tight"
          >
            The missing <span className="text-blue-500">Package Manager</span> <br />
            for PowerShell scripts.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A lightweight, powerful tool to bundle, register, and manage your custom PowerShell scripts with an apt-like CLI and a full management GUI.
          </motion.p>

          <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit mx-auto mb-8 border border-gray-800">
            <button 
              onClick={() => setActiveTab('install')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'install' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              One-Liner
            </button>
            <button 
              onClick={() => setActiveTab('manual-code')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'manual-code' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Manual Code
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            {activeTab === 'install' ? (
              <div className="bg-[#121214] border border-white/10 rounded-2xl p-2 shadow-2xl relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative flex items-center bg-[#0A0A0B] rounded-xl overflow-hidden border border-white/5">
                  <div className="pl-6 text-blue-500">
                    <Terminal size={18} />
                  </div>
                  <input 
                    readOnly 
                    value={installCommand}
                    className="w-full bg-transparent border-none text-blue-100/90 py-4 px-4 font-mono text-sm focus:ring-0"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 font-semibold transition-colors flex items-center gap-2 h-full"
                  >
                    {copied ? 'Copied!' : 'Install'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#121214] border border-white/10 rounded-2xl p-2 shadow-2xl relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative bg-[#0A0A0B] rounded-xl overflow-hidden border border-white/5 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <span className="text-[10px] uppercase font-bold text-gray-500">apt-installer.ps1</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(scriptContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy Content'}
                    </button>
                  </div>
                  <div className="p-4 font-mono text-[11px] text-gray-400 h-[200px] overflow-y-auto text-left whitespace-pre-wrap">
                    {scriptContent}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                <div className="flex justify-between w-full px-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Public GitHub Link (Raw)</label>
                  <a 
                    href="https://github.com/wdress254-hub/APTforWindows" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                  >
                    Manage Repository <ExternalLink size={10} />
                  </a>
                </div>
                <div className="relative w-full">
                  <input 
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={() => setGithubUrl('https://raw.githubusercontent.com/wdress254-hub/APTforWindows/main/apt-installer.ps1')}
                      className="text-[9px] px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"
                    >
                      Reset
                    </button>
                    <Globe size={12} className="text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 bg-blue-500/5 border border-blue-500/10 rounded-xl w-full max-w-md">
                <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Github size={14} /> Fixing the 404 & Setting up GitHub
                </h4>
                <ol className="text-[11px] text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Go to your repo and click <b>"Add file"</b> &gt; <b>"Create new file"</b></li>
                  <li>Name it <b>apt-installer.ps1</b></li>
                  <li>Paste the code from the <b>'Manual Code'</b> tab above</li>
                  <li>Click <b>"Commit changes"</b></li>
                </ol>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Shield size={14} className="text-blue-500" /> Run PowerShell as Administrator
                </p>
                <div className="w-1 h-1 bg-gray-800 rounded-full" />
                <button 
                  onClick={downloadScript}
                  className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-2 transition-colors"
                >
                  <Download size={14} /> Download .ps1
                </button>
              </div>
              <div className="px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-lg max-w-xl">
                 <p className="text-xs text-blue-400 leading-relaxed text-center">
                   <strong>Public One-Liner:</strong> Using a public GitHub Raw URL (above) allows the installer to bypass login gates. 
                   Ensure your script is uploaded to that location.
                 </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            {
              icon: <Zap className="text-blue-500" />,
              title: "Lightning Fast Setup",
              desc: "Register any script with 'apt setup'. No complex configurations needed."
            },
            {
              icon: <Box className="text-purple-500" />,
              title: "Bundle & Execute",
              desc: "Package your logic and run it instantly with 'apt install' commands."
            },
            {
              icon: <Edit3 className="text-emerald-500" />,
              title: "Native Management GUI",
              desc: "Full WinForms interface built in to edit, delete, and test your packages visually."
            }
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl"
            >
              <div className="mb-6 p-3 bg-white/5 inline-block rounded-2xl">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Command Reference Section */}
        <div id="docs" className="bg-[#121214] border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-12 lg:p-20">
              <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">CLI Overview</h2>
              <div className="space-y-8">
                {[
                  { cmd: 'apt setup "hello" "Write-Host Hello"', desc: 'Registers a new package with the specified name and code.' },
                  { cmd: 'apt install "hello"', desc: 'Executes the registered package script instantly.' },
                  { cmd: 'apt delete "hello"', desc: 'Removes the package from the registry.' },
                  { cmd: 'apt list', desc: 'Displays all currently registered packages.' },
                  { cmd: 'apt opengui', desc: 'Launches the interactive Windows management GUI.' },
                  { cmd: 'apt uninstall', desc: 'Completely removes APT from your session and profile.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <code className="text-blue-400 font-mono text-sm block mb-1">{item.cmd}</code>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-blue-500" />
                  Automatic Persistence
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  The <code className="text-blue-300">apt</code> command is now automatically registered in your PowerShell Profile upon installation.
                </p>
                <p className="text-gray-500 text-xs italic">
                  To remove it entirely, simply run <code className="text-blue-400">apt uninstall</code> in any terminal session.
                </p>
              </div>
            </div>
            <div className="bg-blue-600/5 border-l border-white/5 p-12 lg:p-20 flex flex-col justify-center">
              <div className="aspect-[4/3] bg-[#0A0A0B] rounded-3xl border border-white/10 p-4 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/40" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                    <div className="w-2 h-2 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Management Console</span>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Box size={14} />
                    <span>Package Library: 12 Active</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">clean-temp-files.ps1</span>
                      <Play size={12} className="text-emerald-500" />
                    </div>
                    <div className="text-gray-600">Remove-Item $env:TEMP\* -Recurse</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">backup-vault.ps1</span>
                      <Play size={12} className="text-emerald-500" />
                    </div>
                    <div className="text-gray-600">Compress-Archive -Path $home\Documents...</div>
                  </div>
                  <div className="flex justify-center pt-4">
                    <button 
                       onClick={() => setActiveTab('gui')}
                       className="flex items-center gap-2 text-xs text-blue-500 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-all font-sans font-medium"
                    >
                      <ExternalLink size={12} /> Open Native GUI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span>&copy; 2026 APT for Windows</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            <a href="#" className="hover:text-white transition-colors">GitHub Repository</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-all"><Github size={20} /></a>
            <a href="#" className="text-gray-500 hover:text-white transition-all"><ExternalLink size={20} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
