# ⚡ Zenith IDE v2

**Minimal Hybrid Code Execution Environment** — a full VS Code-style desktop IDE built with Electron, React, Monaco Editor, xterm.js, and Vite.

---

## 🗂 Project Structure

```
zenith-ide/
├── src/
│   ├── main/
│   │   ├── main.js          ← Electron main process (IPC, fs, exec, pty)
│   │   └── preload.js       ← Secure contextBridge API
│   └── renderer/
│       ├── App.jsx           ← Root layout + keyboard shortcuts
│       ├── main.jsx          ← React entry point
│       ├── components/
│       │   ├── TitleBar.jsx          Custom title bar + menus
│       │   ├── ActivityBar.jsx       Left icon navigation bar
│       │   ├── Sidebar.jsx           Explorer / Search / Git / Extensions
│       │   ├── EditorArea.jsx        Monaco editor + tabs + welcome screen
│       │   ├── BottomPanel.jsx       Output pane + xterm.js terminal
│       │   ├── StatusBar.jsx         Bottom status bar
│       │   ├── CommandPalette.jsx    ⌘⇧P command palette
│       │   └── Notifications.jsx     Toast notification system
│       ├── panels/
│       │   ├── SettingsPanel.jsx     Full settings UI (5 tabs)
│       │   ├── AccountPanel.jsx      Login / profile / account management
│       │   ├── CloudPanel.jsx        Cloud snippet manager
│       │   └── Panel.module.css      Shared panel styles
│       ├── hooks/
│       │   ├── useFiles.js           File state + disk I/O
│       │   ├── useTerminal.js        Output lines state
│       │   ├── useSettings.js        Persisted settings
│       │   └── useNotifications.js   Toast system
│       └── styles/
│           ├── global.css            Design tokens + reset
│           └── App.module.css        Root layout
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Requirements
- **Node.js** v18+ → https://nodejs.org
- **npm** v8+
- **Python 3** (optional, for running .py files)
- **Git** (optional)

Check: `node --version` `npm --version`

---

### Step 1 — Install dependencies

```bash
cd zenith-ide
npm install
```

---

### Step 2 — Start in dev mode

```bash
npm run dev
```

This starts Vite on `localhost:5174` then launches Electron. The IDE opens automatically.

---

### Step 3 — (Optional) Full terminal support

For the real interactive shell terminal (bash/zsh/PowerShell), install `node-pty`:

```bash
npm install node-pty
npm run install:native   # rebuilds native module for Electron
```

Without it, the Terminal tab uses a basic fallback shell. The **Output** tab (for running code via F5) always works without node-pty.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Monaco Editor** | VS Code engine — IntelliSense, syntax highlighting, 20+ languages |
| **Code Execution** | Run JS, TS, Python, Bash, Ruby, PHP with real-time stdout/stderr |
| **xterm.js Terminal** | Full interactive shell (bash/zsh/PowerShell) |
| **File Explorer** | Folder tree, create/rename/delete, right-click context menu |
| **12 Extensions** | Install/uninstall Prettier, ESLint, GitLens, AI Copilot, and more |
| **Command Palette** | ⌘⇧P — search files, run commands, navigate |
| **Settings Panel** | Font, theme, accent color, auto-save, keybindings (5 tabs) |
| **Account Panel** | Local account with profile editing |
| **Cloud Snippets** | Save/manage/copy code snippets stored locally |
| **Search** | Full-text search across all open files |
| **Notifications** | Toast notifications for all actions |
| **Auto Save** | Configurable auto-save with delay |
| **Custom Theme** | Deep obsidian dark theme with violet accent |

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Run file | `F5` |
| Save | `⌘/Ctrl + S` |
| Save As | `⌘/Ctrl + Shift + S` |
| Open file | `⌘/Ctrl + O` |
| New file | `⌘/Ctrl + N` |
| Command Palette | `⌘/Ctrl + Shift + P` |
| Toggle Sidebar | `⌘/Ctrl + Shift + E` |
| Toggle Panel | `⌘/Ctrl + `` ` |
| Close tab | `Middle click` tab |

---

## 🔧 Supported Languages

| Language | Extension | Run |
|----------|-----------|-----|
| JavaScript | .js .jsx | ✅ Node.js |
| TypeScript | .ts .tsx | ✅ Node.js |
| Python | .py | ✅ python3 |
| Bash/Shell | .sh | ✅ bash |
| Ruby | .rb | ✅ ruby |
| PHP | .php | ✅ php |
| HTML, CSS, JSON, Markdown, Go, Rust, C/C++, Java, SQL, YAML | edit only | ✗ |

---

## 🐛 Troubleshooting

**Port 5174 already in use:**
```bash
npx kill-port 5174 && npm run dev
```

**Python not found:**
- macOS/Linux: ensure `python3` is in PATH
- Windows: ensure `python` is in PATH, or install from python.org

**Monaco editor blank:**
- Press `Ctrl+Shift+I` to open DevTools and check console

**node-pty build fails:**
- Requires Python + C++ build tools
- macOS: `xcode-select --install`
- Windows: `npm install --global windows-build-tools`

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Electron 28** | Cross-platform desktop shell |
| **React 18** | UI framework |
| **Monaco Editor** | VS Code editor engine (IntelliSense, syntax highlight) |
| **xterm.js** | Full terminal emulator |
| **Node.js child_process** | Code execution (stdout/stderr streaming) |
| **node-pty** | Real PTY terminal (optional) |
| **Vite 5** | Dev server + bundler |
| **CSS Modules** | Scoped component styling |

---

MIT License
