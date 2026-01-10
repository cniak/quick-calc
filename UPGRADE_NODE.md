# UPGRADE REQUIRED ⚠️

## Your Node.js is Outdated

**Current Node.js**: 16.15.1
**Required Node.js**: >=20.19.0

This project uses modern tooling that requires Node.js 20.19+. You cannot run the development server or build the project until you upgrade.

## Why Upgrade?

- **Security**: Node 16 reached End-of-Life in September 2023
- **Performance**: Node 20 offers significant performance improvements
- **Features**: Modern JavaScript features and better tooling support
- **Dependencies**: Current project dependencies require Node 20+

## How to Upgrade

### 🏆 Recommended: Use nvm (Node Version Manager)

#### Windows
1. Install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
2. Open PowerShell as Administrator
3. Run:
   ```powershell
   nvm install 20.19.0
   nvm use 20.19.0
   ```

#### macOS/Linux
1. Install nvm from: https://github.com/nvm-sh/nvm
2. Run:
   ```bash
   nvm install 20.19.0
   nvm use 20.19.0
   nvm alias default 20.19.0
   ```

### 📥 Alternative: Direct Installation

#### Windows
```powershell
# Using winget
winget install OpenJS.NodeJS.LTS

# Using Chocolatey
choco install nodejs-lts
```

#### macOS
```bash
# Using Homebrew
brew install node@20
```

#### Linux
```bash
# Using apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using dnf (Fedora)
sudo dnf install nodejs
```

### ✅ Verify Installation

After upgrading, verify:
```bash
node --version  # Should show v20.19.0 or higher
npm --version   # Should show v10.0.0 or higher
```

### 🔄 Complete Setup

Once Node is upgraded:
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Start development
npm run dev
```

## Need Help?

- Node.js Downloads: https://nodejs.org/
- nvm for Windows: https://github.com/coreybutler/nvm-windows
- nvm for macOS/Linux: https://github.com/nvm-sh/nvm
- Project Issues: See project README.md

---

**This check runs automatically before `npm run dev` and `npm run build`**
