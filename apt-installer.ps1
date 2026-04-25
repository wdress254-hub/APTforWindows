# APT for Windows - PowerShell Script
# This script provides the 'apt' command and a management GUI.

$APT_DATA_DIR = Join-Path $env:USERPROFILE ".apt_windows"
$APT_PKG_DIR = Join-Path $APT_DATA_DIR "packages"

# Ensure directories exist
if (-not (Test-Path $APT_PKG_DIR)) {
    New-Item -Path $APT_PKG_DIR -ItemType Directory -Force | Out-Null
}

function Invoke-Apt {
    param(
        [Parameter(Position = 0)]
        [ValidateSet("setup", "install", "delete", "list", "opengui", "help", "uninstall")]
        $Action = "help",

        [Parameter(Position = 1)]
        $PackageName,

        [Parameter(Position = 2)]
        $PackageCode
    )

    switch ($Action) {
        "help" {
            Write-Host "`n--- APT for Windows Help ---" -ForegroundColor Cyan
            Write-Host "apt setup <name> '<code>'   - Register <code> as <name>"
            Write-Host "apt install <name>          - Execute the package script"
            Write-Host "apt delete <name>           - Remove a package"
            Write-Host "apt list                    - Show all packages"
            Write-Host "apt opengui                 - Launch the management window"
            Write-Host "apt uninstall               - Remove APT from this session"
            Write-Host "`nTo make 'apt' permanent, add the install line to your `$PROFILE" -ForegroundColor Gray
        }

        "setup" {
            if (-not $PackageName -or -not $PackageCode) {
                Write-Host "Usage: apt setup <package-name> <code-or-description>" -ForegroundColor Red
                return
            }
            $targetPath = Join-Path $APT_PKG_DIR "$PackageName.ps1"
            $PackageCode | Out-File -FilePath $targetPath -Encoding utf8
            Write-Host "Package '$PackageName' registered successfully." -ForegroundColor Cyan
        }

        "install" {
            if (-not $PackageName) {
                Write-Host "Usage: apt install <package-name>" -ForegroundColor Red
                return
            }
            $targetPath = Join-Path $APT_PKG_DIR "$PackageName.ps1"
            if (Test-Path $targetPath) {
                Write-Host "Executing package '$PackageName'..." -ForegroundColor Green
                & $targetPath
            } else {
                Write-Host "Package '$PackageName' not found." -ForegroundColor Red
            }
        }

        "delete" {
            if (-not $PackageName) {
                Write-Host "Usage: apt delete <package-name>" -ForegroundColor Red
                return
            }
            $targetPath = Join-Path $APT_PKG_DIR "$PackageName.ps1"
            if (Test-Path $targetPath) {
                Remove-Item $targetPath
                Write-Host "Package '$PackageName' deleted." -ForegroundColor Yellow
            } else {
                Write-Host "Package '$PackageName' not found." -ForegroundColor Red
            }
        }

        "list" {
            $pkgs = Get-ChildItem $APT_PKG_DIR -Filter "*.ps1"
            if ($pkgs.Count -eq 0) {
                Write-Host "No packages installed." -ForegroundColor Gray
            } else {
                Write-Host "Installed packages:" -ForegroundColor Cyan
                $pkgs | ForEach-Object { Write-Host " - $($_.BaseName)" }
            }
        }

        "opengui" {
            Show-AptGui
        }

        "uninstall" {
            if ($PackageName -eq "apt" -or $PackageName -eq "aptapt" -or $null -eq $PackageName) {
                Write-Host "[APT] Initiating full uninstallation..." -ForegroundColor Cyan
                $corePath = Join-Path $APT_DATA_DIR "core.ps1"
                if (Test-Path $PROFILE) {
                    $content = Get-Content $PROFILE | Where-Object { $_ -notlike "*$corePath*" }
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
`$APT_DATA_DIR = Join-Path `$env:USERPROFILE ".apt_windows"
`$APT_PKG_DIR = Join-Path `$APT_DATA_DIR "packages"

if (-not (Test-Path `$APT_PKG_DIR)) { New-Item -Path `$APT_PKG_DIR -ItemType Directory -Force | Out-Null }

function Invoke-Apt { $((Get-Command Invoke-Apt).ScriptBlock) }
function Show-AptGui { $((Get-Command Show-AptGui).ScriptBlock) }

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
    $entry = ". '$corePath'"
    if ($profileContent -notcontains $entry) {
        Add-Content $PROFILE "`n$entry"
        Write-Host "[APT] Persistence enabled via `$PROFILE" -ForegroundColor Gray
    }
}

function Show-AptGui {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object Windows.Forms.Form
    $form.Text = "APT for Windows - Package Manager"
    $form.Size = New-Object Drawing.Size(600, 450)
    $form.StartPosition = "CenterScreen"
    $form.BackColor = [Drawing.Color]::FromArgb(30, 30, 30)
    $form.ForeColor = [Drawing.Color]::White
    $form.Font = New-Object Drawing.Font("Segoe UI", 10)

    # Package List
    $listBox = New-Object Windows.Forms.ListBox
    $listBox.Location = New-Object Drawing.Point(10, 40)
    $listBox.Size = New-Object Drawing.Size(180, 320)
    $listBox.BackColor = [Drawing.Color]::FromArgb(45, 45, 45)
    $listBox.ForeColor = [Drawing.Color]::White
    $form.Controls.Add($listBox)

    $titleLabel = New-Object Windows.Forms.Label
    $titleLabel.Text = "Packages"
    $titleLabel.Location = New-Object Drawing.Point(10, 15)
    $titleLabel.Size = New-Object Drawing.Size(180, 25)
    $form.Controls.Add($titleLabel)

    # Name Entry
    $nameLabel = New-Object Windows.Forms.Label
    $nameLabel.Text = "Package Name"
    $nameLabel.Location = New-Object Drawing.Point(210, 15)
    $nameLabel.Size = New-Object Drawing.Size(120, 25)
    $form.Controls.Add($nameLabel)

    $nameInput = New-Object Windows.Forms.TextBox
    $nameInput.Location = New-Object Drawing.Point(210, 40)
    $nameInput.Size = New-Object Drawing.Size(360, 30)
    $nameInput.BackColor = [Drawing.Color]::FromArgb(45, 45, 45)
    $nameInput.ForeColor = [Drawing.Color]::White
    $form.Controls.Add($nameInput)

    # Code Input
    $codeLabel = New-Object Windows.Forms.Label
    $codeLabel.Text = "PowerShell Script / Code"
    $codeLabel.Location = New-Object Drawing.Point(210, 80)
    $codeLabel.Size = New-Object Drawing.Size(200, 25)
    $form.Controls.Add($codeLabel)

    $codeInput = New-Object Windows.Forms.TextBox
    $codeInput.Location = New-Object Drawing.Point(210, 105)
    $codeInput.Size = New-Object Drawing.Size(360, 215)
    $codeInput.Multiline = $true
    $codeInput.ScrollBars = "Vertical"
    $codeInput.BackColor = [Drawing.Color]::FromArgb(45, 45, 45)
    $codeInput.ForeColor = [Drawing.Color]::White
    $codeInput.Font = New-Object Drawing.Font("Consolas", 10)
    $form.Controls.Add($codeInput)

    # Refresh Function
    $RefreshList = {
        $listBox.Items.Clear()
        Get-ChildItem $APT_PKG_DIR -Filter "*.ps1" | ForEach-Object {
            [void]$listBox.Items.Add($_.BaseName)
        }
        $nameInput.Text = ""
        $codeInput.Text = ""
    }

    # Selection Event
    $listBox.Add_SelectedIndexChanged({
        if ($listBox.SelectedItem) {
            $pkg = $listBox.SelectedItem.ToString()
            $path = Join-Path $APT_PKG_DIR "$pkg.ps1"
            if (Test-Path $path) {
                $nameInput.Text = $pkg
                $codeInput.Text = Get-Content $path -Raw
            }
        }
    })

    # Buttons
    $btnSave = New-Object Windows.Forms.Button
    $btnSave.Text = "Save"
    $btnSave.Location = New-Object Drawing.Point(210, 330)
    $btnSave.Size = New-Object Drawing.Size(80, 35)
    $btnSave.FlatStyle = "Flat"
    $btnSave.BackColor = [Drawing.Color]::FromArgb(0, 120, 215)
    $btnSave.Add_Click({
        if ($nameInput.Text) {
            $cleanedName = $nameInput.Text -replace '[^a-zA-Z0-9_-]', ''
            $path = Join-Path $APT_PKG_DIR "$cleanedName.ps1"
            $codeInput.Text | Out-File -FilePath $path -Encoding utf8
            &$RefreshList
        }
    })
    $form.Controls.Add($btnSave)

    $btnDelete = New-Object Windows.Forms.Button
    $btnDelete.Text = "Delete"
    $btnDelete.Location = New-Object Drawing.Point(300, 330)
    $btnDelete.Size = New-Object Drawing.Size(80, 35)
    $btnDelete.FlatStyle = "Flat"
    $btnDelete.BackColor = [Drawing.Color]::DarkRed
    $btnDelete.Add_Click({
        if ($listBox.SelectedItem) {
            $path = Join-Path $APT_PKG_DIR "$($listBox.SelectedItem.ToString()).ps1"
            Remove-Item $path
            &$RefreshList
        }
    })
    $form.Controls.Add($btnDelete)

    $btnExecute = New-Object Windows.Forms.Button
    $btnExecute.Text = "Execute"
    $btnExecute.Location = New-Object Drawing.Point(490, 330)
    $btnExecute.Size = New-Object Drawing.Size(80, 35)
    $btnExecute.FlatStyle = "Flat"
    $btnExecute.BackColor = [Drawing.Color]::SeaGreen
    $btnExecute.Add_Click({
        if ($codeInput.Text) {
            Write-Host "`n--- Executing Visual Code ---" -ForegroundColor Cyan
            try {
                Invoke-Expression $codeInput.Text
            } catch {
                Write-Error $_
            }
        }
    })
    $form.Controls.Add($btnExecute)

    &$RefreshList
    [void]$form.ShowDialog()
}

# Register command
if (Test-Path Alias:apt) { Remove-Item Alias:apt }
Set-Alias -Name apt -Value Invoke-Apt -Scope Global
Register-AptPermanently
Write-Host "`n[APT] for Windows initialized and installed to profile." -ForegroundColor Green
Write-Host "[APT] Type 'apt' or 'apt help' to see commands." -ForegroundColor Cyan
