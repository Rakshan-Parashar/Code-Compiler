# 🌌 ( • ) Atmos IDE

**Atmos IDE** is a premium, high-performance hybrid code editor and execution environment. Built with **Electron, React, Monaco Editor, and Vite**, it features a native **FastAPI + SQLite backend**, a workspace-aware **AI RAG Assistant**, and native compilation tools. It runs seamlessly as a standalone desktop app or can be deployed directly to the web.

---

## ✨ Key Features

- 🖥️ **Sleek Desktop Client**: A clean, modern developer interface with a flat single-border layout, Consolas typography, and theme-reactive accents.
- ⚙️ **Multi-Language Runner**: Execute and compile code in **JavaScript, TypeScript, Python, Ruby, PHP, Go, Java, Rust, C, and C++** with real-time feedback.
- 🔍 **AI Assistant & Workspace RAG**: Ask questions, request reviews, and run codebase-aware RAG queries directly against your open workspace files.
- 🗄️ **Local SQLite Database**: User authentication and snippet storage are securely managed in a local SQLite file (`db.sqlite3`).
- ☁️ **Firebase Web Cloud Sync**: Automatically falls back to Firebase Firestore sync when accessed in web browser mode.
- 🔄 **Auto-Updating EXE**: Packaged installer checks GitHub Releases on startup to download and apply updates silently.
- 🛠️ **Custom Output Routing**: Easily choose whether execution output prints to the read-only **Output panel** or the interactive **Terminal panel** inside settings.

---

## 🗂 Project Structure

```
atmos-ide/
├── backend/                  # 🐍 FastAPI Backend & Database
│   ├── main.py               #   FastAPI endpoint entry point & SQLite managers
│   ├── db_manager.py         #   Local database models and schemas
│   └── requirements.txt      #   Python package dependencies
│
├── electron/                 # 🖥️ Electron Main Process (Desktop Wrapper)
│   ├── main.js               #   Window controller, local HTTP server, auto-updater
│   └── preload.js            #   Secure IPC bridge exposing APIs to UI
│
├── frontend/                 # ⚡ React Frontend (Web UI)
│   ├── main.jsx              #   React mount bootstrap
│   ├── App.jsx               #   Layout grid and global state
│   ├── components/           #   Floating UI components (TitleBar, BottomPanel, etc.)
│   ├── panels/               #   Settings, Account, and Cloud overlays
│   └── utils/                #   Firebase, API, and environment shims
│
├── db.sqlite3                # 💾 Auto-generated SQLite database
└── package.json              # 📦 Node dependencies, scripts, and build properties
```

---

## 🚀 Quick Start

### 1. Standalone Installer (EXE)
To run the fully packaged desktop application:
1. Build the installer by running `npm run build` (outputs to the `dist-electron` folder).
2. Run `Atmos IDE Setup 1.0.0.exe` to install.
3. Place your `.env` file in the installation directory (or use the built-in Settings UI to save your Gemini API keys).

---

### 2. Development Setup

#### Prerequisites
- **Node.js** v18+ (https://nodejs.org)
- **Python** v3.9+

#### Step A: Frontend & Electron Client
```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server and open Electron client
npm run dev
```

#### Step B: FastAPI Backend Server
```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Configure your local .env file in the root directory
# (Set GEMINI_API_KEY, JWT_SECRET, and BACKEND_URL)
```

---

## ⌨️ Keyboard Shortcuts

| Command | Action |
|---------|--------|
| **F5** | Run/Execute active file |
| **Ctrl + S** | Save changes |
| **Ctrl + Shift + S** | Save As |
| **Ctrl + O** | Open file |
| **Ctrl + N** | New file |
| **Ctrl + Shift + P** | Open Command Palette |
| **Ctrl + Shift + E** | Toggle Left Sidebar |
| **Ctrl + `** | Toggle Bottom Output Panel |
| **Ctrl + Shift + G** | Focus Git Sidebar |
| **Ctrl + Shift + K** | Toggle AI Assistant Sidebar |

---

## 🔧 Run & Compilation Matrix

| Language | File Extension | Compiler/Interpreter Required |
|----------|----------------|-------------------------------|
| **JavaScript** | `.js`, `.jsx` | Node.js |
| **TypeScript** | `.ts`, `.tsx` | Node.js |
| **Python** | `.py` | python |
| **Go** | `.go` | go run |
| **Java** | `.java` | java |
| **Rust** | `.rs` | rustc |
| **C** | `.c` | gcc |
| **C++** | `.cpp` | g++ |
| **Ruby** | `.rb` | ruby |
| **PHP** | `.php` | php |
| **Bash/Shell** | `.sh`, `.bash` | bash |

---

## 🛠 Tech Stack

- **Desktop Shell**: Electron 28
- **UI Engine**: React 18 + Vite 5 + TailwindCSS
- **Editor**: Monaco Editor (VS Code Engine)
- **PTY Terminal**: xterm.js + node-pty
- **Backend API**: FastAPI (Python)
- **Database**: SQLite (via SQLAlchemy)
- **Cloud Backup**: Firebase Auth / Firestore (Web Client fallback)
- **Updater**: Electron Builder Auto-Updater

---

MIT License
