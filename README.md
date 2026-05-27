# ⚡ Zenith IDE v3

**Ultimate Hybrid Code Execution Environment** — a full VS Code-style desktop IDE built with Electron, React, Monaco Editor, xterm.js, Vite, and backed by a FastAPI MongoDB/WebSocket server for secure cloud synchronization and real-time collaboration.

---

## 🗂 Project Structure

```
zenith-ide/
├── backend/
│   ├── config.py         ← Central configurations & logging setup
│   ├── db_manager.py     ← OOP Database manager (MongoClient + custom DNS resolver)
│   ├── auth_manager.py   ← OOP Authentication manager (Password hash, JWT)
│   ├── collab_manager.py ← OOP Collaboration manager (WebSocket rooms & broadcast)
│   ├── main.py           ← FastAPI entry point & API route mapping
│   └── requirements.txt  ← Backend dependencies (fastapi, uvicorn, pymongo, websockets, bcrypt)
├── src/
│   ├── main/
│   │   ├── main.js       ← Electron main process (IPC, fs, exec, pty)
│   │   └── preload.js    ← Secure contextBridge API
│   └── renderer/
│       ├── App.jsx       ← Root layout, WebSocket handlers, overlay router
│       ├── main.jsx      ← React entry point
│       ├── components/
│       │   ├── TitleBar.jsx        Custom title bar + Menus + Collab button
│       │   ├── ActivityBar.jsx     Left icon navigation bar
│       │   ├── Sidebar.jsx         Explorer / Search / Git / Extensions
│       │   ├── EditorArea.jsx      Monaco editor + tabs + local edit hooks
│       │   ├── BottomPanel.jsx     Output pane + xterm.js terminal
│       │   ├── StatusBar.jsx       Bottom status bar
│       │   ├── CommandPalette.jsx  ⌘⇧P command palette
│       │   └── Notifications.jsx   Toast notification system
│       ├── panels/
│       │   ├── SettingsPanel.jsx   Full settings UI (5 tabs)
│       │   ├── AccountPanel.jsx    Profile editing, user signup & login
│       │   ├── CloudPanel.jsx      Cloud snippet manager
│       │   ├── CollabPanel.jsx     Live collaboration session control
│       │   └── Panel.module.css    Shared panel styles
│       ├── hooks/
│       │   ├── useFiles.js         File state + disk I/O
│       │   ├── useTerminal.js      Output lines state
│       │   ├── useSettings.js      Persisted settings
│       │   └── useNotifications.js Toast system
│       └── styles/
│           ├── global.css          Design tokens + reset
│           └── App.module.css      Root layout
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Frontend Setup

#### Requirements
- **Node.js** v18+ → https://nodejs.org
- **npm** v8+

#### 1. Install dependencies
```bash
npm install
```

#### 2. Start in dev mode
```bash
npm run dev
```
This runs Vite on `localhost:5174` and opens Electron.

#### 3. (Optional) Full terminal support
For the real interactive shell terminal (bash/zsh/PowerShell), install `node-pty`:
```bash
npm install node-pty
npm run install:native   # rebuilds native module for Electron
```

---

### Backend Setup (FastAPI & MongoDB)

The backend powers user authentication, cloud snippet synchronization, and WebSocket-based live collaboration.

#### Requirements
- **Python 3.9+**
- **MongoDB Atlas Account** (or local MongoDB server)

#### 1. Setup Virtual Environment
```bash
# From the project root
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate
```

#### 2. Install dependencies
```bash
pip install -r backend/requirements.txt
```

#### 3. Configure Environment Variables
Copy `.env` to the project root and populate it with:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# MongoDB Connection String (Atlas SRV supported out-of-the-box)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zenith_ide

# JWT secret key for session tokens
JWT_SECRET=your_jwt_secret_key_here
BACKEND_URL=http://127.0.0.1:8000
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Live Collaboration** | Real-time WebSocket-based multiplayer code editing & cursor tracking. |
| **MongoDB Cloud Sync** | Securely register/login to store and sync your snippets and settings in the cloud. |
| **Monaco Editor** | VS Code engine — IntelliSense, syntax highlighting, 20+ languages. |
| **Code Execution** | Run JS, TS, Python, Bash, Ruby, PHP with real-time stdout/stderr. |
| **xterm.js Terminal** | Full interactive shell (bash/zsh/PowerShell). |
| **File Explorer** | Folder tree, create/rename/delete, right-click context menu. |
| **AI Assistant** | Seamless AI chat & logic diagnostics using Gemini. |
| **12 Extensions** | Install/uninstall Prettier, ESLint, GitLens, AI Copilot, and more. |
| **Command Palette** | ⌘⇧P — search files, run commands, navigate. |
| **Settings Panel** | Font, theme, accent color, auto-save, keybindings (5 tabs). |
| **Dynamic Profile Stats**| Tracks number of saved files, cloud snippets, and membership age. |
| **Custom Theme** | Deep obsidian dark theme with violet accent. |

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
| AI Review Code | `⌘/Ctrl + Shift + K` |

---

## 🔧 Supported Languages

| Language | Extension | Run |
|----------|-----------|-----|
| JavaScript | .js .jsx | ✅ Node.js |
| TypeScript | .ts .tsx | ✅ Node.js |
| Python | .py | ✅ python |
| Bash/Shell | .sh | ✅ bash |
| Ruby | .rb | ✅ ruby |
| PHP | .php | ✅ php |
| Go | .go | ✅ go run |
| Java | .java | ✅ java |
| Rust | .rs | ✅ rustc |
| C / C++ | .c .cpp | ✅ gcc / g++ |
| HTML, CSS, JSON, Markdown, SQL, YAML | edit only | ✗ |

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Electron 28** | Cross-platform desktop shell |
| **React 18** | UI framework |
| **Monaco Editor** | VS Code editor engine |
| **FastAPI** | Python microframework for API and WebSocket rooms |
| **MongoDB Atlas** | Cloud database for authentication & snippet syncing |
| **WebSockets** | Real-time bi-directional collaborative communication |
| **dnspython** | Robust fallback nameserver (Google/Cloudflare) resolution |
| **passlib & bcrypt** | Cryptographic password hashing and verification |
| **xterm.js** | Full terminal emulator |
| **Vite 5** | Dev server + bundler |
| **CSS Modules** | Scoped component styling |

---

MIT License
