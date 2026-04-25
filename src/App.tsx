import { useState, useEffect } from 'react';
import { 
  Terminal, 
  Settings, 
  Cpu, 
  HardDrive, 
  Wind, 
  Package, 
  Info, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Play,
  Monitor,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- PowerShell Script Template ---
const generateScript = (packages: { name: string, code: string }[], spoofData: { cpu: string, ram: string, version: string }) => {
  const packageDefinitions = packages.map(pkg => `
        "setup" {
            apt install-internal "${pkg.name}" @"
${pkg.code}
"@
        }`).join('\n');

  return `
# APT for Windows - Advanced Management Script
# Generated at ${new Date().toLocaleString()}

$APT_DATA_DIR = Join-Path $env:USERPROFILE ".apt_windows"
$APT_PKG_DIR = Join-Path $APT_DATA_DIR "packages"

# Ensure directories exist
if (-not (Test-Path $APT_PKG_DIR)) {
    New-Item -Path $APT_PKG_DIR -ItemType Directory -Force | Out-Null
}

function Invoke-Apt {
    param(
        [Parameter(Position = 0)]
        [ValidateSet("setup", "install", "delete", "list", "opengui", "help", "uninstall", "spoof")]
        $Action = "help",

        [Parameter(Position = 1)]
        $Param1,

        [Parameter(Position = 2)]
        $Param2
    )

    switch ($Action) {
        "help" {
            Write-Host "\n--- APT for Windows Help ---" -ForegroundColor Cyan
            Write-Host "apt setup <name> '<code>'   - Register <code> as <name>"
            Write-Host "apt install <name>          - Execute the package script"
            Write-Host "apt delete <name>           - Remove a package"
            Write-Host "apt list                    - Show all packages"
            Write-Host "apt spoof <type> <val>      - Visual System Spoofing"
            Write-Host "    types: cpu, ram, version"
            Write-Host "apt opengui                 - Launch the management window"
            Write-Host "apt uninstall               - Remove APT from this session"
            Write-Host "\nTo make 'apt' permanent, add the install line to your \$PROFILE" -ForegroundColor Gray
        }

        "setup" {
            if (-not $Param1 -or -not $Param2) {
                Write-Host "Usage: apt setup <package-name> <code-or-description>" -ForegroundColor Red
                return
            }
            $targetPath = Join-Path $APT_PKG_DIR "$Param1.ps1"
            $Param2 | Out-File -FilePath $targetPath -Encoding utf8
            Write-Host "Package '$Param1' registered successfully." -ForegroundColor Cyan
        }

        "install" {
            if (-not $Param1) {
                Write-Host "Usage: apt install <package-name>" -ForegroundColor Red
                return
            }
            $targetPath = Join-Path $APT_PKG_DIR "$Param1.ps1"
            if (Test-Path $targetPath) {
                Write-Host "Executing package '$Param1'..." -ForegroundColor Green
                & $targetPath
            } else {
                Write-Host "Package '$Param1' not found." -ForegroundColor Red
            }
        }

        "delete" {
            if (-not $Param1) {
                Write-Host "Usage: apt delete <package-name>" -ForegroundColor Red
                return
            }
            $targetPath = Join-Path $APT_PKG_DIR "$Param1.ps1"
            if (Test-Path $targetPath) {
                Remove-Item $targetPath
                Write-Host "Package '$Param1' deleted." -ForegroundColor Yellow
            } else {
                Write-Host "Package '$Param1' not found." -ForegroundColor Red
            }
        }

        "list" {
            $pkgs = Get-ChildItem $APT_PKG_DIR -Filter "*.ps1"
            if ($pkgs.Count -eq 0) {
                Write-Host "No packages installed." -ForegroundColor Gray
            } else {
                Write-Host "Installed packages:" -ForegroundColor Cyan
                $pkgs | ForEach-Object { Write-Host " - \$(\$_.BaseName)" }
            }
        }

        "spoof" {
            if (-not $Param1 -or -not $Param2) {
                Write-Host "Usage: apt spoof <cpu|ram|version> <value>" -ForegroundColor Red
                return
            }
            
            # Requires Elevation for Registry Modifications
            $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
            if (-not $isAdmin) {
                Write-Host "ERROR: Registry modifications require Administrator privileges." -ForegroundColor Red
                return
            }

            switch ($Param1) {
                "cpu" {
                    Write-Host "Spoofing CPU to: $Param2" -ForegroundColor Cyan
                    Set-ItemProperty -Path "HKLM:\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0" -Name "ProcessorNameString" -Value $Param2
                }
                "version" {
                    Write-Host "Spoofing Windows Version to: $Param2" -ForegroundColor Cyan
                    Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "DisplayVersion" -Value $Param2
                    Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "ProductName" -Value "Windows $Param2"
                }
                "ram" {
                    Write-Host "Spoofing RAM is limited (Visual Only in specific apps)." -ForegroundColor Yellow
                    # There is no single Registry key for RAM total size that Windows uses widely.
                    # We can add an OEM record though.
                    if (-not (Test-Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation")) {
                        New-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation" -Force | Out-Null
                    }
                    Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation" -Name "Model" -Value "$Param2 RAM Installed"
                }
            }
            Write-Host "System info updated. Restart explorer.exe or your PC to see effects in some windows." -ForegroundColor Green
        }

        "opengui" {
            Show-AptGui
        }

        "uninstall" {
            if ($Param1 -eq "apt" -or $Param1 -eq "aptapt" -or $null -eq $Param1) {
                Write-Host "[APT] Initiating full uninstallation..." -ForegroundColor Cyan
                $corePath = Join-Path $APT_DATA_DIR "core.ps1"
                if (Test-Path $PROFILE) {
                    $content = Get-Content $PROFILE | Where-Object { \$_ -notlike "*$corePath*" }
                    $content | Out-File $PROFILE -Encoding utf8
                    Write-Host "[APT] Removed from PowerShell Profile." -ForegroundColor Gray
                }
                if (Test-Path Alias:apt) { Remove-Item Alias:apt }
                Write-Host "APT successfully uninstalled from this session and profile." -ForegroundColor Yellow
            } else {
                Write-Host "Did you mean 'apt uninstall apt' or 'apt uninstall aptapt'?" -ForegroundColor Red
            }
        }
    }
}

function Register-AptPermanently {
    if (-not (Test-Path $APT_DATA_DIR)) { New-Item -Path $APT_DATA_DIR -ItemType Directory -Force | Out-Null }
    $corePath = Join-Path $APT_DATA_DIR "core.ps1"
    
    # Reconstruct the core script for local persistence
    $definitions = @"
# APT for Windows Core
\`$APT_DATA_DIR = Join-Path \`$env:USERPROFILE ".apt_windows"
\`$APT_PKG_DIR = Join-Path \`$APT_DATA_DIR "packages"

if (-not (Test-Path \`$APT_PKG_DIR)) { New-Item -Path \`$APT_PKG_DIR -ItemType Directory -Force | Out-Null }

function Invoke-Apt { \$((Get-Command Invoke-Apt).ScriptBlock) }
function Show-AptGui { \$((Get-Command Show-AptGui).ScriptBlock) }

if (Test-Path Alias:apt) { Remove-Item Alias:apt }
Set-Alias -Name apt -Value Invoke-Apt -Scope Global
"@
    $definitions | Out-File -FilePath $corePath -Encoding utf8

    # Update Profile
    if (-not (Test-Path $PROFILE)) {
        $profileDir = Split-Path $PROFILE
        if (-not (Test-Path $profileDir)) { New-Item -Path $profileDir -ItemType Directory -Force | Out-Null }
        New-Item -Path $PROFILE -ItemType File -Force | Out-Null
    }
    
    $profileContent = Get-Content $PROFILE
    $entry = ". '\$corePath'"
    if ($profileContent -notcontains $entry) {
        Add-Content $PROFILE "\`n$entry"
        Write-Host "[APT] Persistence enabled via \`$PROFILE" -ForegroundColor Gray
    }
}

function Show-AptGui {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object Windows.Forms.Form
    $form.Text = "APT for Windows - Package Manager + System Spoof"
    $form.Size = New-Object Drawing.Size(800, 500)
    $form.StartPosition = "CenterScreen"
    $form.BackColor = [Drawing.Color]::FromArgb(25, 25, 26)
    $form.ForeColor = [Drawing.Color]::White
    $form.Font = New-Object Drawing.Font("Segoe UI Variable", 10)

    # Tabs
    $tabControl = New-Object Windows.Forms.TabControl
    $tabControl.Location = New-Object Drawing.Point(10, 10)
    $tabControl.Size = New-Object Drawing.Size(760, 430)
    $form.Controls.Add($tabControl)

    $tabPackages = New-Object Windows.Forms.TabPage
    $tabPackages.Text = "Packages"
    $tabPackages.BackColor = [Drawing.Color]::FromArgb(32, 32, 33)
    $tabControl.TabPages.Add($tabPackages)

    $tabSpoof = New-Object Windows.Forms.TabPage
    $tabSpoof.Text = "System Spoof"
    $tabSpoof.BackColor = [Drawing.Color]::FromArgb(32, 32, 33)
    $tabControl.TabPages.Add($tabSpoof)

    # --- PACKAGES TAB ---
    $listBox = New-Object Windows.Forms.ListBox
    $listBox.Location = New-Object Drawing.Point(10, 20)
    $listBox.Size = New-Object Drawing.Size(180, 360)
    $listBox.BackColor = [Drawing.Color]::FromArgb(45, 45, 45)
    $listBox.ForeColor = [Drawing.Color]::White
    $listBox.BorderStyle = "None"
    $tabPackages.Controls.Add($listBox)

    $nameInput = New-Object Windows.Forms.TextBox
    $nameInput.Location = New-Object Drawing.Point(210, 20)
    $nameInput.Size = New-Object Drawing.Size(530, 25)
    $nameInput.BackColor = [Drawing.Color]::FromArgb(45, 45, 45)
    $tabPackages.Controls.Add($nameInput)

    $codeInput = New-Object Windows.Forms.TextBox
    $codeInput.Location = New-Object Drawing.Point(210, 60)
    $codeInput.Size = New-Object Drawing.Size(530, 280)
    $codeInput.Multiline = $true
    $codeInput.ScrollBars = "Vertical"
    $codeInput.BackColor = [Drawing.Color]::FromArgb(45, 45, 45)
    $codeInput.Font = New-Object Drawing.Font("Consolas", 10)
    $tabPackages.Controls.Add($codeInput)

    $btnSave = New-Object Windows.Forms.Button
    $btnSave.Text = "Save Package"
    $btnSave.Location = New-Object Drawing.Point(210, 350)
    $btnSave.Size = New-Object Drawing.Size(120, 30)
    $btnSave.FlatStyle = "Flat"
    $btnSave.BackColor = [Drawing.Color]::FromArgb(0, 120, 215)
    $tabPackages.Controls.Add($btnSave)

    # --- SPOOF TAB ---
    
    # CPU
    $lblCpu = New-Object Windows.Forms.Label
    $lblCpu.Text = "Fake CPU Name"
    $lblCpu.Location = New-Object Drawing.Point(20, 20)
    $lblCpu.Size = New-Object Drawing.Size(150, 25)
    $tabSpoof.Controls.Add($lblCpu)

    $txtCpu = New-Object Windows.Forms.TextBox
    $txtCpu.Location = New-Object Drawing.Point(20, 45)
    $txtCpu.Size = New-Object Drawing.Size(400, 25)
    $txtCpu.Text = "${spoofData.cpu}"
    $tabSpoof.Controls.Add($txtCpu)

    # Windows Version
    $lblVer = New-Object Windows.Forms.Label
    $lblVer.Text = "Fake Windows Version (e.g. 24H2)"
    $lblVer.Location = New-Object Drawing.Point(20, 80)
    $lblVer.Size = New-Object Drawing.Size(250, 25)
    $tabSpoof.Controls.Add($lblVer)

    $txtVer = New-Object Windows.Forms.TextBox
    $txtVer.Location = New-Object Drawing.Point(20, 105)
    $txtVer.Size = New-Object Drawing.Size(400, 25)
    $txtVer.Text = "${spoofData.version}"
    $tabSpoof.Controls.Add($txtVer)

    # RAM
    $lblRam = New-Object Windows.Forms.Label
    $lblRam.Text = "Fake RAM Info (System Properties)"
    $lblRam.Location = New-Object Drawing.Point(20, 140)
    $lblRam.Size = New-Object Drawing.Size(250, 25)
    $tabSpoof.Controls.Add($lblRam)

    $txtRam = New-Object Windows.Forms.TextBox
    $txtRam.Location = New-Object Drawing.Point(20, 165)
    $txtRam.Size = New-Object Drawing.Size(400, 25)
    $txtRam.Text = "${spoofData.ram}"
    $tabSpoof.Controls.Add($txtRam)

    $btnApplySpoof = New-Object Windows.Forms.Button
    $btnApplySpoof.Text = "Apply System Spoof"
    $btnApplySpoof.Location = New-Object Drawing.Point(20, 220)
    $btnApplySpoof.Size = New-Object Drawing.Size(200, 40)
    $btnApplySpoof.FlatStyle = "Flat"
    $btnApplySpoof.BackColor = [Drawing.Color]::SeaGreen
    $btnApplySpoof.Add_Click({
        Invoke-Apt spoof cpu \$txtCpu.Text
        Invoke-Apt spoof version \$txtVer.Text
        Invoke-Apt spoof ram \$txtRam.Text
    })
    $tabSpoof.Controls.Add($btnApplySpoof)

    $lblWarning = New-Object Windows.Forms.Label
    $lblWarning.Text = "Note: Spoofing requires Admin rights and acts on the Registry."
    $lblWarning.Location = New-Object Drawing.Point(20, 270)
    $lblWarning.Size = New-Object Drawing.Size(400, 50)
    $lblWarning.ForeColor = [Drawing.Color]::DarkOrange
    $tabSpoof.Controls.Add($lblWarning)

    # Refresh Function
    $RefreshList = {
        \$listBox.Items.Clear()
        Get-ChildItem \$APT_PKG_DIR -Filter "*.ps1" | ForEach-Object {
            [void]\$listBox.Items.Add(\$_.BaseName)
        }
    }

    $btnSave.Add_Click({
        if (\$nameInput.Text) {
            Invoke-Apt setup \$nameInput.Text \$codeInput.Text
            &\$RefreshList
        }
    })

    &\$RefreshList
    [void]\$form.ShowDialog()
}

# Auto-apply preset spoof if integrated
# Invoke-Apt spoof cpu "${spoofData.cpu}" -ErrorAction SilentlyContinue

# Register command
if (Test-Path Alias:apt) { Remove-Item Alias:apt }
Set-Alias -Name apt -Value Invoke-Apt -Scope Global
Register-AptPermanently
Write-Host "\`n[APT] for Windows initialized and installed to profile." -ForegroundColor Green
Write-Host "[APT] Type 'apt' or 'apt help' to see commands." -ForegroundColor Cyan
`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'packages' | 'spoof' | 'installer'>('dashboard');
  const [packages, setPackages] = useState<{ name: string, code: string }[]>([
    { name: 'chrome-install', code: 'Write-Host "Installing Chrome..."\n# Add your silent install command here' },
    { name: 'clean-temp', code: 'Remove-Item "$env:TEMP\\*" -Recurse -Force' }
  ]);
  const [spoofData, setSpoofData] = useState({
    cpu: 'Intel(R) Core(TM) i9-14900KS @ 6.20GHz',
    ram: '128 GB',
    version: '24H2 Enterprise'
  });
  const [copied, setCopied] = useState(false);

  const fullScript = generateScript(packages, spoofData);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apt-installer.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#D1D1D2] font-sans selection:bg-blue-500/30 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#1F1F22] bg-[#0C0C0D] flex flex-col p-4 gap-6">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
            A
          </div>
          <span className="font-bold text-lg tracking-tight text-white">APT Windows</span>
        </div>

        <nav className="flex flex-col gap-1">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<Layout size={18} />} 
            label="Overview" 
          />
          <NavButton 
            active={activeTab === 'packages'} 
            onClick={() => setActiveTab('packages')} 
            icon={<Package size={18} />} 
            label="Packages" 
          />
          <NavButton 
            active={activeTab === 'spoof'} 
            onClick={() => setActiveTab('spoof')} 
            icon={<Monitor size={18} />} 
            label="System Spoof" 
          />
          <div className="h-px bg-[#1F1F22] my-4 mx-2" />
          <NavButton 
            active={activeTab === 'installer'} 
            onClick={() => setActiveTab('installer')} 
            icon={<Terminal size={18} />} 
            label="Generate Installer" 
          />
        </nav>

        <div className="mt-auto p-4 bg-[#141416] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Info size={12} />
            <span>PowerShell v5.1+</span>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-wider font-semibold">
            Run as Administrator for full Registry access.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-10 max-w-5xl mx-auto space-y-8"
            >
              <header>
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Build your environment.</h1>
                <p className="text-gray-400">Configure your custom Windows package manager and system information preset.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                  icon={<Package className="text-blue-500" />} 
                  title="Total Packages" 
                  value={packages.length.toString()} 
                />
                <StatCard 
                  icon={<Cpu className="text-emerald-500" />} 
                  title="Target CPU" 
                  value={spoofData.cpu.split('@')[0]} 
                />
                <StatCard 
                  icon={<Wind className="text-purple-500" />} 
                  title="OS Preset" 
                  value={spoofData.version} 
                />
              </div>

              <section className="bg-[#0C0C0D] border border-[#1F1F22] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#1F1F22] flex items-center justify-between">
                  <h2 className="font-semibold text-white">System Configuration</h2>
                  <div className="flex items-center gap-2 text-xs font-mono bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full">
                    REGISTRY_READY
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">Hardware Profile</h3>
                      <div className="space-y-4">
                        <SystemSpec label="Processor" value={spoofData.cpu} />
                        <SystemSpec label="Installed RAM" value={spoofData.ram} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">Software Profile</h3>
                      <div className="space-y-4">
                        <SystemSpec label="Windows Edition" value={`Windows ${spoofData.version}`} />
                        <SystemSpec label="Distribution Type" value="APT-Managed Core" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'packages' && (
            <motion.div 
              key="packages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Package Registry</h1>
                  <p className="text-gray-500 text-sm">Scripts bundled into your APT installation.</p>
                </div>
                <button 
                  onClick={() => setPackages([...packages, { name: 'new-package', code: '# New Script' }])}
                  className="bg-white text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <Plus size={18} />
                  Add Package
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-4">
                {packages.map((pkg, idx) => (
                  <div key={idx} className="bg-[#0C0C0D] border border-[#1F1F22] rounded-xl p-5 hover:border-white/10 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                      <input 
                        value={pkg.name}
                        onChange={(e) => {
                          const newPkgs = [...packages];
                          newPkgs[idx].name = e.target.value;
                          setPackages(newPkgs);
                        }}
                        className="bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-lg"
                      />
                      <button 
                        onClick={() => setPackages(packages.filter((_, i) => i !== idx))}
                        className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <textarea 
                      value={pkg.code}
                      onChange={(e) => {
                        const newPkgs = [...packages];
                        newPkgs[idx].code = e.target.value;
                        setPackages(newPkgs);
                      }}
                      className="w-full bg-[#070708] border border-[#1F1F22] rounded-lg p-3 font-mono text-sm h-32 focus:ring-1 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'spoof' && (
            <motion.div 
              key="spoof"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10 max-w-3xl mx-auto space-y-10"
            >
              <header>
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <Monitor size={24} />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">Visual System Spoof</h1>
                <p className="text-gray-500 mt-2">Modify how your PC reports hardware and software info in System views.</p>
              </header>

              <div className="space-y-8">
                <InputGroup 
                  label="Processor Name" 
                  description="Changes the CPU name in Task Manager and System Properties."
                  value={spoofData.cpu}
                  onChange={(v) => setSpoofData({...spoofData, cpu: v})}
                />
                <InputGroup 
                  label="Installed RAM" 
                  description="Adds a custom model descriptor to OEM info for visual confirmation."
                  value={spoofData.ram}
                  onChange={(v) => setSpoofData({...spoofData, ram: v})}
                />
                <InputGroup 
                  label="Windows Version" 
                  description="Overrides DisplayVersion (e.g. 24H2) and ProductName."
                  value={spoofData.version}
                  onChange={(v) => setSpoofData({...spoofData, version: v})}
                />
              </div>

              <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-4">
                <div className="text-yellow-500 shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-yellow-500 font-bold text-sm mb-1 uppercase tracking-wider">Elevation Required</h4>
                  <p className="text-xs text-yellow-500/80 leading-relaxed">
                    These changes interact directly with the Windows Registry. You must run the generated PowerShell script as Administrator to apply these effects.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'installer' && (
            <motion.div 
              key="installer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Deploy Script</h1>
                  <p className="text-gray-500 text-sm">Copy and run this in a PowerShell instance to initialize your APT environment.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 border border-white/10 transition-all active:scale-95"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    {copied ? 'Copied' : 'Copy Code'}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                  >
                    <Download size={18} />
                    Download .ps1
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-[#09090A] border border-[#1F1F22] rounded-2xl overflow-hidden relative group">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="h-full overflow-y-auto p-8 font-mono text-xs leading-relaxed text-blue-100/70 selection:bg-blue-500/40">
                  <pre className="whitespace-pre-wrap">{fullScript}</pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
        ${active ? 'bg-blue-500/10 text-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
      `}
    >
      <span className={`${active ? 'text-blue-500' : 'text-gray-600 group-hover:text-gray-400'}`}>
        {icon}
      </span>
      <span className="font-semibold text-sm">{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
    </button>
  );
}

function StatCard({ icon, title, value }: { icon: any, title: string, value: string }) {
  return (
    <div className="bg-[#0C0C0D] border border-[#1F1F22] rounded-2xl p-6 space-y-4 shadow-sm hover:border-white/5 transition-colors">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function SystemSpec({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">{label}</span>
      <span className="text-sm text-gray-200 font-medium">{value}</span>
    </div>
  );
}

function InputGroup({ label, description, value, onChange }: { label: string, description: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-bold text-white">{label}</label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0C0C0D] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-700 font-medium"
      />
    </div>
  );
}
