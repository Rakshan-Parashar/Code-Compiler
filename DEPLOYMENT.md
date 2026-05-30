# 🚀 Atmos IDE — Deployment Guide (Beginner Friendly)

This guide walks you through the entire process of deploying your Atmos IDE project step by step. No prior deployment experience needed.

---

## 📋 What We'll Do

```
Phase 1: Build the .exe installer        (10 minutes)
Phase 2: Push code to GitHub              (5 minutes)
Phase 3: Create a GitHub Release          (5 minutes)
Phase 4: Deploy backend to Render         (10 minutes)
Phase 5: Connect everything               (5 minutes)
```

**Total time: ~35 minutes**
**Total cost: ₹0 (completely free)**

---

## Phase 1: Build the Windows Installer (.exe)

This converts your project into a real installable application — just like when you install VS Code or Chrome.

### Step 1.1: Make sure your code builds successfully

Open your terminal in the project folder and run:

```bash
npm run build
```

This does two things:
1. **Vite** compiles your React code into optimized files (saved in `/dist`)
2. **electron-builder** packages everything into a `.exe` installer (saved in `/dist-electron`)

### Step 1.2: Find your installer

After the build finishes, look inside:

```
d:\Code-Compiler\dist-electron\
    └── Atmos IDE Setup 1.0.0.exe    ← This is your installer!
```

### Step 1.3: Test it!

1. Double-click the `.exe` file
2. It will install Atmos IDE on your computer
3. Open it and verify everything works
4. If it works — you're ready to share it with the world!

> **💡 Tip:** If the build fails, it's usually because of `node-pty` (the terminal module).
> You may need to run: `npx electron-rebuild` first.

---

## Phase 2: Push Your Code to GitHub

If you already have a GitHub repo set up, skip to Phase 3.

### Step 2.1: Create a GitHub account

Go to [github.com](https://github.com) and sign up (free).

### Step 2.2: Create a new repository

1. Click the **+** button (top right) → **New repository**
2. Fill in:
   - Repository name: `atmos-ide`
   - Description: `A premium desktop code editor & compiler`
   - Set to **Public** (so anyone can download)
3. Click **Create repository**

### Step 2.3: Push your code

Open terminal in your project folder and run these commands one by one:

```bash
# Only if you haven't initialized git yet:
git init

# Add the remote repository (replace YOUR_USERNAME with your GitHub username):
git remote add origin https://github.com/YOUR_USERNAME/atmos-ide.git

# Add all files:
git add .

# Create a commit:
git commit -m "Atmos IDE v1.0 - Initial release"

# Push to GitHub:
git branch -M main
git push -u origin main
```

Now your code is on GitHub! 🎉

---

## Phase 3: Create a GitHub Release (Upload Your .exe)

This is how users will download your app — exactly like how VS Code has a download page.

### Step 3.1: Go to Releases

1. Open your repo on GitHub: `github.com/YOUR_USERNAME/atmos-ide`
2. On the right sidebar, click **Releases** (or go to the "Releases" tab)
3. Click **"Create a new release"**

### Step 3.2: Fill in release details

```
Tag version:     v1.0.0
Release title:   Atmos IDE v1.0.0
Description:     Write what's included, e.g.:
                 "First release of Atmos IDE - a premium desktop code editor
                  with built-in terminal, AI assistant, and multi-language support."
```

### Step 3.3: Upload your .exe

1. Scroll down to **"Attach binaries"**
2. Drag and drop your `.exe` file from `dist-electron/` folder
3. Wait for it to upload

### Step 3.4: Publish

Click **"Publish release"**

Now anyone can download your app from:
```
https://github.com/YOUR_USERNAME/atmos-ide/releases
```

**That's it! Your desktop app is now deployed!** 🎉

---

## Phase 4: Deploy Backend to Render (Optional)

This step makes the authentication, cloud snippets, and AI RAG features work without users needing Python installed on their machines.

> **Note:** If you only want the core IDE features (editor, terminal, file explorer, code execution),
> you can skip this phase entirely — those features work without a backend.

### Step 4.1: Create a Render account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (this makes Step 4.3 easier)

### Step 4.2: Create a new Web Service

1. From the Render dashboard, click **"New +"** → **"Web Service"**
2. Select **"Build and deploy from a Git repository"**
3. Connect your GitHub repo (`atmos-ide`)

### Step 4.3: Configure the service

Fill in these settings:

```
Name:             atmos-api
Region:           Pick the closest to you (e.g., Singapore for India)
Branch:           main
Root Directory:   backend
Runtime:          Python 3
Build Command:    pip install -r requirements.txt
Start Command:    uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Step 4.4: Set environment variables

Scroll down to **"Environment Variables"** and add:

```
Key:   JWT_SECRET
Value: (paste the same value from your .env file)

Key:   GEMINI_API_KEY
Value: (paste your Gemini API key)
```

### Step 4.5: Select free plan

1. Select **"Free"** instance type
2. Click **"Create Web Service"**

### Step 4.6: Wait for deployment

Render will:
1. Pull your code from GitHub
2. Install Python dependencies
3. Start your FastAPI server

After 2-3 minutes, you'll get a URL like:
```
https://atmos-api.onrender.com
```

Test it by visiting: `https://atmos-api.onrender.com/health` — you should see `{"status": "ok"}`

---

## Phase 5: Connect Backend to Your App

Now you need to tell your desktop app where the backend lives.

### Step 5.1: Update the backend URL

Open these files and change the URL:

**File: `frontend/utils/dataApi.js` (line 1)**
```javascript
// Change FROM:
const BACKEND_URL = 'http://localhost:8000';

// Change TO:
const BACKEND_URL = 'https://atmos-api.onrender.com';
```

**File: `frontend/utils/browserShim.js` (line 3)**
```javascript
// Change FROM:
const BACKEND_URL = 'http://localhost:8000';

// Change TO:
const BACKEND_URL = 'https://atmos-api.onrender.com';
```

**File: `.env` (line 22)**
```env
# Change FROM:
BACKEND_URL=http://127.0.0.1:8000

# Change TO:
BACKEND_URL=https://atmos-api.onrender.com
```

### Step 5.2: Rebuild and re-upload

```bash
# Rebuild the app with the new backend URL:
npm run build

# Push changes to GitHub:
git add .
git commit -m "Connect to Render backend"
git push
```

Then create a new GitHub Release (v1.0.1) and upload the new `.exe`.

---

## ✅ Done! Here's What You Have Now

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   GitHub Releases                                    │
│   github.com/you/atmos-ide/releases                  │
│   → Users download "Atmos IDE Setup.exe"             │
│                                                      │
│   Render                                             │
│   atmos-api.onrender.com                             │
│   → Handles login, snippets, AI RAG                  │
│                                                      │
│   User's Computer                                    │
│   → Atmos IDE runs locally                           │
│   → Editor, terminal, file system all work           │
│   → Connects to Render for online features           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ❓ Common Questions

### "Why can't I just put everything on one website?"
Because your app runs **native code** on the user's computer (compiling C, running Python, accessing files). Websites can't do that — only desktop apps can.

### "Do users need to install Python or Node.js?"
No! The `.exe` installer includes everything. Users just double-click and install.

### "What if I want Mac or Linux versions too?"
Run `npm run build` on a Mac to get `.dmg`, or on Linux to get `.AppImage`. You can also set up GitHub Actions to auto-build for all platforms (I can help with that).

### "The Render free tier sleeps after 15 minutes?"
Yes. The first request after sleep takes ~30 seconds to wake up. For a student/portfolio project, this is fine. For production, Render's paid plan ($7/month) keeps it always on.

### "Can I get a custom domain like atmos-ide.com?"
Yes! Buy a domain (~₹800/year from Namecheap or GoDaddy) and point it to your GitHub Pages or Render service.

---

## 🔗 Quick Reference Links

| Service | URL | What For |
|---|---|---|
| GitHub | [github.com](https://github.com) | Code hosting + Releases |
| Render | [render.com](https://render.com) | Backend API hosting |
| Electron Builder Docs | [electron.build](https://www.electron.build/) | Packaging help |
