# Calculator v2 - Scoped Web Calculator

A modern, fast calculator web application with named scopes, ordered variable definitions, in-page JavaScript functions, and real-time evaluation.

## 🚨 Requirements (ENFORCED)

**You MUST upgrade to use this project:**

### Required Versions
- **Node.js**: `>=20.19.0` (Current LTS)
- **npm**: `>=10.0.0`

### Check Your Versions
```bash
node --version
npm --version
```

### ⚠️ Upgrade Instructions

See [UPGRADE_NODE.md](UPGRADE_NODE.md) for detailed upgrade instructions.

**Quick upgrade with nvm:**
```bash
nvm install 20.19.0
nvm use 20.19.0
```

### After Upgrading
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 🚀 Features

- **Multiple Scopes**: Create and switch between named calculation contexts (e.g., "Salary", "Budget")
- **Ordered Variables**: Define variables that depend on earlier ones (`a = 1`, `b = a + 1`)
- **Inline Results**: See calculation results immediately next to each line
- **Custom Functions**: Write JavaScript functions and use them in calculations
- **Auto Recalculation**: Updates propagate instantly when values change
- **Local Persistence**: All data saved in browser LocalStorage
- **Modern UI**: Built with shadcn/ui and Tailwind CSS

## 📦 Installation

1. **Ensure you meet the requirements above**

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm run preview
```

## 🎯 Usage

### Calculator Lines
- Enter expressions like `1+1` or assign variables `a = 5`
- Results appear inline
- Variables must be defined before use (top-to-bottom order)

### Scopes
- Create multiple scopes for different contexts
- Switch between them using the left panel
- Each scope maintains its own variables and functions

### Functions
- Define reusable JavaScript functions
- Edit and save them (unsaved changes marked with `*`)
- Use them in your calculations
- Collapse/expand for better organization

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool (rolldown)
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **Zustand 5** - State management
- **lucide-react** - Icons

## 📝 Project Structure

```
src/
├── components/
│   ├── calculator-lines/  # Expression input and results
│   ├── functions-pane/    # Function editor
│   └── scope-list/        # Scope selector
├── features/
│   └── scoped-calculator/
│       ├── state/         # Types and models
│       └── utils/         # Parser, evaluator, deps
├── state/                 # Zustand store
└── utils/                 # Storage helpers
```

## 🔒 Browser Compatibility

Requires modern evergreen browsers:
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## 📄 License

MIT
