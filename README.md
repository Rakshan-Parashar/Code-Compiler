# 🌌 Atmos IDE

**Ultimate Hybrid Code Execution Environment** — a premium, high-performance desktop code compiler and editor built with Electron, React, Monaco Editor, xterm.js, and Vite, backed by a FastAPI SQLite server for secure local database storage and an AI-driven vector RAG (Retrieval-Augmented Generation) assistant.

For a detailed visual guide on data flow, execution mechanisms, and internal communications, check out [STRUCTURE.md](file:///d:/Code-Compiler/STRUCTURE.md).

---

## 🗂 Project Structure

```
atmos-ide/
├── backend/                  # 🐍 FastAPI Backend
│   ├── main.py               #   FastAPI app entry & routes mapping
│   ├── config.py             #   App logging and directory configuration
│   ├── auth_manager.py       #   User validation and session security
│   ├── db_manager.py         #   SQLite client helper
│   ├── rag_manager.py        #   AI codebase embeddings index
│   └── requirements.txt      #   Python dependency list
│
├── electron/                 # 🖥️ Electron Main Process (Desktop Wrapper)
│   ├── main.js               #   OS integrations, IPC routes, compilers runtime
│   └── preload.js            #   Electron contextBridge IPC mapping
│
├── frontend/                 # ⚡ React Frontend App (Web UI)
│   ├── main.jsx              #   React bootstrap mount
│   ├── App.jsx               #   Main layout shell, state router
│   ├── components/           #   Core layout modules (TitleBar, EditorArea, BottomPanel, etc.)
│   ├── panels/               #   Overlays (Settings, Account, Snippets, AI sidebar)
│   ├── hooks/                #   React state controllers (useFiles, useSettings, etc.)
│   └── utils/                #   Utility scripts & browser shims
│
├── db.sqlite3                # 💾 SQLite local database (created automatically)
├── package.json              # 📦 Frontend npm configuration
├── tailwind.config.js        # 🎨 Tailwind CSS configurations
└── vite.config.js            # ⚡ Vite frontend bundler config
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

### Backend Setup (FastAPI & SQLite)

The backend powers user authentication, local snippet synchronization, and WebSocket-based live collaboration.

#### Requirements
- **Python 3.9+**
- **SQLite** (included in Python standard library)

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

# SQLite database path is managed automatically

# JWT secret key for session tokens
JWT_SECRET=your_jwt_secret_key_here
BACKEND_URL=http://127.0.0.1:8000
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Live Collaboration** | Real-time WebSocket-based multiplayer code editing & cursor tracking. |
| **Local SQLite Sync** | Securely register/login to store and sync your snippets and settings in a local SQLite database. |
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
| **SQLite** | Local database for authentication & snippet syncing |
| **WebSockets** | Real-time bi-directional collaborative communication |
| **dnspython** | Robust fallback nameserver (Google/Cloudflare) resolution |
| **passlib & bcrypt** | Cryptographic password hashing and verification |
| **xterm.js** | Full terminal emulator |
| **Vite 5** | Dev server + bundler |
| **CSS Modules** | Scoped component styling |

---

MIT License
