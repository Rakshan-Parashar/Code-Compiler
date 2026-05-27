const { app, BrowserWindow, ipcMain, dialog, Menu, shell, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn, execSync } = require('child_process')

const isDev = process.env.NODE_ENV !== 'production'
let win = null, runningProcess = null, ptyProcess = null

const ud = () => app.getPath('userData')
const jR = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(ud(), f), 'utf-8')) } catch { return d } }
const jW = (f, v) => { try { fs.mkdirSync(ud(), { recursive: true }); fs.writeFileSync(path.join(ud(), f), JSON.stringify(v, null, 2)) } catch {} }

const DEF_SETTINGS = {
  fontSize: 14, fontFamily: 'JetBrains Mono', tabSize: 2,
  wordWrap: false, minimap: true, lineNumbers: true,
  autoSave: false, autoSaveDelay: 1500, formatOnSave: false,
  terminalFontSize: 13, accentColor: '#7C3AED',
  showIndentGuides: true, renderWhitespace: 'selection',
  smoothScrolling: true, stickyScroll: true, bracketPairColors: true,
  zenMode: false, liveErrors: true,
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 920, minWidth: 900, minHeight: 600,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 14, y: 12 },
    backgroundColor: '#0a0a0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  if (isDev) win.loadURL('http://localhost:5174')
  else win.loadFile(path.join(__dirname, '../../dist/index.html'))
  Menu.setApplicationMenu(null)
  win.on('maximize',          () => win.webContents.send('win:state', 'maximized'))
  win.on('unmaximize',        () => win.webContents.send('win:state', 'normal'))
  win.on('enter-full-screen', () => win.webContents.send('win:fullscreen', true))
  win.on('leave-full-screen', () => win.webContents.send('win:fullscreen', false))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

/* window controls */
ipcMain.on('win:minimize',   () => win.minimize())
ipcMain.on('win:maximize',   () => win.isMaximized() ? win.unmaximize() : win.maximize())
ipcMain.on('win:close',      () => win.close())
ipcMain.on('win:fullscreen', () => win.setFullScreen(!win.isFullScreen()))
ipcMain.handle('win:isMax',  () => win.isMaximized())

/* settings */
ipcMain.handle('settings:load', () => ({ ...DEF_SETTINGS, ...jR('settings.json', {}) }))
ipcMain.handle('settings:save', (_, s) => { jW('settings.json', s); return { ok: true } })

/* account */
ipcMain.handle('account:load',   ()    => jR('account.json', null))
ipcMain.handle('account:save',   (_, a) => { jW('account.json', a); return { ok: true } })
ipcMain.handle('account:logout', ()    => { jW('account.json', null); return { ok: true } })

/* cloud snippets */
ipcMain.handle('cloud:list', () => jR('cloud.json', []))
ipcMain.handle('cloud:save', (_, s) => {
  const list = jR('cloud.json', [])
  const idx = list.findIndex(x => x.id === s.id)
  const entry = { ...s, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = entry
  else list.unshift({ ...entry, id: `snip_${Date.now()}`, createdAt: Date.now() })
  jW('cloud.json', list)
  return { ok: true, list }
})
ipcMain.handle('cloud:delete', (_, id) => {
  const list = jR('cloud.json', []).filter(s => s.id !== id)
  jW('cloud.json', list)
  return { ok: true, list }
})

/* recent + bookmarks */
const addRecent = fp => { let r = jR('recent.json', []).filter(p => p !== fp); r.unshift(fp); jW('recent.json', r.slice(0, 25)) }
ipcMain.handle('recent:load',    () => jR('recent.json', []).filter(p => { try { fs.statSync(p); return true } catch { return false } }))
ipcMain.handle('bookmarks:load', () => jR('bookmarks.json', []))
ipcMain.handle('bookmarks:save', (_, b) => { jW('bookmarks.json', b); return { ok: true } })

/* file history */
const fileHistory = new Map()
ipcMain.handle('history:push', (_, { fp, content }) => {
  if (!fileHistory.has(fp)) fileHistory.set(fp, [])
  const s = fileHistory.get(fp)
  s.push({ content, ts: Date.now() })
  if (s.length > 50) s.shift()
  return { ok: true }
})
ipcMain.handle('history:undo', (_, fp) => {
  const s = fileHistory.get(fp) || []
  if (s.length < 2) return null
  s.pop()
  return s[s.length - 1] || null
})

/* filesystem */
const IGNORE = new Set(['.git','node_modules','__pycache__','.DS_Store','dist','.next','build','.venv','venv','.idea','.turbo','coverage','.cache'])

function walkDir(dir, depth = 0) {
  if (depth > 5) return []
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(i => !IGNORE.has(i.name))
      .map(i => {
        const full = path.join(dir, i.name)
        if (i.isDirectory()) return { name: i.name, path: full, type: 'folder', children: walkDir(full, depth + 1) }
        const stat = fs.statSync(full)
        return { name: i.name, path: full, type: 'file', ext: path.extname(i.name).slice(1), size: stat.size, mtime: stat.mtimeMs }
      })
      .sort((a, b) => { if (a.type !== b.type) return a.type === 'folder' ? -1 : 1; return a.name.localeCompare(b.name) })
  } catch { return [] }
}

ipcMain.handle('fs:openFile', async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Code', extensions: ['js','jsx','ts','tsx','py','html','css','json','md','txt','sh','bash','c','cpp','java','go','rs','rb','php','vue','svelte','yaml','yml','toml','xml','sql','swift','kt','dart'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (r.canceled || !r.filePaths.length) return null
  const fp = r.filePaths[0]
  addRecent(fp)
  const stat = fs.statSync(fp)
  return { path: fp, name: path.basename(fp), content: fs.readFileSync(fp, 'utf-8'), ext: path.extname(fp).slice(1), size: stat.size, mtime: stat.mtimeMs }
})

ipcMain.handle('fs:openFolder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
  if (r.canceled || !r.filePaths.length) return null
  const fp = r.filePaths[0]
  return { folderPath: fp, folderName: path.basename(fp), tree: walkDir(fp) }
})

ipcMain.handle('fs:readFile', async (_, fp) => {
  try {
    const stat = fs.statSync(fp)
    addRecent(fp)
    return { path: fp, name: path.basename(fp), content: fs.readFileSync(fp, 'utf-8'), ext: path.extname(fp).slice(1), size: stat.size, mtime: stat.mtimeMs }
  } catch (e) { return { error: e.message } }
})

ipcMain.handle('fs:saveFile', async (_, { filePath, content }) => {
  try { fs.writeFileSync(filePath, content, 'utf-8'); return { ok: true, mtime: fs.statSync(filePath).mtimeMs } }
  catch (e) { return { error: e.message } }
})

ipcMain.handle('fs:saveFileAs', async (_, { content, defaultName }) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: defaultName || 'untitled.js',
    filters: [
      { name: 'JavaScript', extensions: ['js','jsx'] }, { name: 'TypeScript', extensions: ['ts','tsx'] },
      { name: 'Python', extensions: ['py'] }, { name: 'HTML', extensions: ['html'] },
      { name: 'CSS', extensions: ['css'] }, { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] }, { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (r.canceled) return null
  fs.writeFileSync(r.filePath, content, 'utf-8')
  addRecent(r.filePath)
  return { path: r.filePath, name: path.basename(r.filePath), ext: path.extname(r.filePath).slice(1) }
})

ipcMain.handle('fs:newFile', async (_, { folderPath, fileName }) => {
  try { const fp = path.join(folderPath, fileName); fs.writeFileSync(fp, '', 'utf-8'); return { path: fp, name: fileName, content: '', ext: path.extname(fileName).slice(1) } }
  catch (e) { return { error: e.message } }
})
ipcMain.handle('fs:newFolder', async (_, { folderPath, folderName }) => {
  try { const fp = path.join(folderPath, folderName); fs.mkdirSync(fp, { recursive: true }); return { ok: true, path: fp } }
  catch (e) { return { error: e.message } }
})
ipcMain.handle('fs:delete', async (_, fp) => {
  try { fs.statSync(fp).isDirectory() ? fs.rmSync(fp, { recursive: true, force: true }) : fs.unlinkSync(fp); return { ok: true } }
  catch (e) { return { error: e.message } }
})
ipcMain.handle('fs:rename', async (_, { oldPath, newName }) => {
  try { const np = path.join(path.dirname(oldPath), newName); fs.renameSync(oldPath, np); return { ok: true, newPath: np } }
  catch (e) { return { error: e.message } }
})
ipcMain.handle('fs:refresh', async (_, fp) => walkDir(fp))
ipcMain.handle('fs:reveal',  async (_, fp) => { shell.showItemInFolder(fp) })
ipcMain.handle('clipboard:write', (_, t) => { clipboard.writeText(t); return { ok: true } })
ipcMain.handle('clipboard:read',  () => clipboard.readText())

/* git */
function git(args, cwd) {
  try { return { ok: true, out: execSync(`git ${args}`, { cwd, encoding: 'utf-8', timeout: 6000, stdio: 'pipe' }).trim() } }
  catch (e) { return { ok: false, err: e.stderr?.toString().trim() || e.message } }
}
ipcMain.handle('git:status',  (_, cwd) => {
  const r = git('status --porcelain', cwd)
  if (!r.ok) return { ok: false, files: [] }
  const files = r.out.split('\n').filter(Boolean).map(l => ({ status: l.slice(0, 2).trim(), path: l.slice(3) }))
  return { ok: true, files }
})
ipcMain.handle('git:branch',  (_, cwd) => git('branch --show-current', cwd))
ipcMain.handle('git:log',     (_, cwd) => {
  const r = git('log --oneline -30 --pretty=format:"%h|%s|%an|%ar"', cwd)
  if (!r.ok) return { ok: false, commits: [] }
  const commits = r.out.split('\n').filter(Boolean).map(l => { const [hash,msg,author,time] = l.split('|'); return { hash, msg, author, time } })
  return { ok: true, commits }
})
ipcMain.handle('git:diff',    (_, { cwd, file }) => git(`diff HEAD -- "${file}"`, cwd))
ipcMain.handle('git:stage',   (_, { cwd, file }) => git(`add "${file}"`, cwd))
ipcMain.handle('git:unstage', (_, { cwd, file }) => git(`restore --staged "${file}"`, cwd))
ipcMain.handle('git:commit',  (_, { cwd, msg })  => git(`commit -m "${msg.replace(/"/g, "'")}"`, cwd))
ipcMain.handle('git:push',    (_, cwd) => git('push', cwd))
ipcMain.handle('git:pull',    (_, cwd) => git('pull', cwd))
ipcMain.handle('git:discard', (_, { cwd, file }) => git(`checkout -- "${file}"`, cwd))
ipcMain.handle('git:init',    (_, cwd) => git('init', cwd))

/* execution */
const RUNNERS = {
  javascript: { ext: 'js',  cmd: 'node' },
  typescript: { ext: 'js',  cmd: 'node' },
  python:     { ext: 'py',  cmd: process.platform === 'win32' ? 'python' : 'python3' },
  shellscript:{ ext: 'sh',  cmd: 'bash' },
  bash:       { ext: 'sh',  cmd: 'bash' },
  ruby:       { ext: 'rb',  cmd: 'ruby' },
  php:        { ext: 'php', cmd: 'php'  },
}

ipcMain.handle('exec:run', async (_, { code, language }) => {
  if (runningProcess) { try { runningProcess.kill('SIGTERM') } catch {} runningProcess = null }
  const cfg = RUNNERS[language]
  if (!cfg) {
    win.webContents.send('exec:out', { t: 'err', d: `No runner for "${language}"\n` })
    win.webContents.send('exec:done', { code: 1, ms: 0 })
    return
  }
  return new Promise(resolve => {
    const tmp = path.join(os.tmpdir(), `zenith_${Date.now()}.${cfg.ext}`)
    fs.writeFileSync(tmp, code)
    const t0 = Date.now()
    win.webContents.send('exec:out', { t: 'sys', d: `\x1b[2m[${new Date().toLocaleTimeString()}]\x1b[0m \x1b[32m▶\x1b[0m \x1b[1m${language}\x1b[0m\n\n` })
    runningProcess = spawn(cfg.cmd, [tmp], { shell: process.platform === 'win32', env: { ...process.env } })
    runningProcess.stdout.on('data', d => win.webContents.send('exec:out', { t: 'out', d: d.toString() }))
    runningProcess.stderr.on('data', d => win.webContents.send('exec:out', { t: 'err', d: d.toString() }))
    runningProcess.on('close', code => {
      const ms = Date.now() - t0
      try { fs.unlinkSync(tmp) } catch {}
      const col = code === 0 ? '\x1b[32m' : '\x1b[31m'
      win.webContents.send('exec:out', { t: 'sys', d: `\n\x1b[2m──────────────────────────────\x1b[0m\n${col}Exit ${code}\x1b[0m \x1b[2m· ${ms}ms\x1b[0m\n` })
      win.webContents.send('exec:done', { code, ms })
      runningProcess = null; resolve()
    })
    runningProcess.on('error', err => {
      try { fs.unlinkSync(tmp) } catch {}
      win.webContents.send('exec:out', { t: 'err', d: `\x1b[31m✗ ${err.message}\x1b[0m\n` })
      win.webContents.send('exec:done', { code: 1, ms: 0 })
      resolve()
    })
  })
})

ipcMain.handle('exec:stop', () => {
  if (runningProcess) {
    runningProcess.kill('SIGTERM'); runningProcess = null
    win.webContents.send('exec:out', { t: 'sys', d: '\n\x1b[33m⚠ Stopped\x1b[0m\n' })
    win.webContents.send('exec:done', { code: -1, ms: 0 })
  }
})

/* pty terminal */
ipcMain.handle('pty:create', async (_, { cwd }) => {
  try {
    const pty = require('node-pty')
    const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/bash')
    ptyProcess = pty.spawn(shell, [], { name: 'xterm-256color', cols: 120, rows: 30, cwd: cwd || os.homedir(), env: process.env })
    ptyProcess.onData(d => win.webContents.send('pty:data', d))
    ptyProcess.onExit(({ exitCode }) => win.webContents.send('pty:exit', exitCode))
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
})
ipcMain.on('pty:write',  (_, d) => { if (ptyProcess) ptyProcess.write(d) })
ipcMain.on('pty:resize', (_, { cols, rows }) => { if (ptyProcess) try { ptyProcess.resize(cols, rows) } catch {} })
ipcMain.handle('pty:kill', () => { if (ptyProcess) { try { ptyProcess.kill() } catch {} ptyProcess = null } })

/* lint + format */
ipcMain.handle('lint:js', (_, code) => {
  const errors = []
  code.split('\n').forEach((line, i) => {
    if (/\bconsole\.log\b/.test(line))  errors.push({ line: i+1, col: line.indexOf('console')+1, msg: 'Unexpected console.log', sev: 'warning' })
    if (/\bvar\s/.test(line))           errors.push({ line: i+1, col: line.indexOf('var')+1,     msg: "Prefer 'const' or 'let' over 'var'", sev: 'warning' })
    if (line.length > 120)              errors.push({ line: i+1, col: 121, msg: 'Line exceeds 120 characters', sev: 'info' })
  })
  return { ok: true, errors }
})

ipcMain.handle('format:code', (_, { code, language }) => {
  if (language === 'json') { try { return { ok: true, formatted: JSON.stringify(JSON.parse(code), null, 2) } } catch (e) { return { ok: false, error: e.message } } }
  return { ok: true, formatted: code.split('\n').map(l => l.trimEnd()).join('\n') }
})

ipcMain.handle('sys:info', () => ({
  platform: process.platform, arch: process.arch, node: process.version,
  home: os.homedir(), shell: process.env.SHELL || 'powershell',
  cpus: os.cpus().length, memory: { total: os.totalmem(), free: os.freemem() },
}))

/* file watcher */
const watchers = new Map()
ipcMain.handle('watch:start', (_, fp) => {
  if (watchers.has(fp)) return { ok: true }
  try { const w = fs.watch(fp, { persistent: false }, evt => win.webContents.send('watch:change', { path: fp, event: evt })); watchers.set(fp, w); return { ok: true } }
  catch { return { ok: false } }
})
ipcMain.handle('watch:stop', (_, fp) => { const w = watchers.get(fp); if (w) { w.close(); watchers.delete(fp) }; return { ok: true } })

/* notebooks */
const getNotebooksDir = (root) => {
  if (!root) throw new Error('Project folder not specified');
  return path.join(root, '.zenith', 'notebooks');
};

ipcMain.handle('notebooks:list', async (_, root) => {
  try {
    const dir = getNotebooksDir(root);
    if (!fs.existsSync(dir)) return { ok: true, notebooks: [] };
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    return { ok: true, notebooks: files };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('notebooks:create', async (_, { root, name }) => {
  try {
    const dir = getNotebooksDir(root);
    fs.mkdirSync(dir, { recursive: true });
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) throw new Error('Notebook already exists');
    fs.writeFileSync(filePath, `# ${name}\n\n`, 'utf-8');
    return { ok: true, name: fileName };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('notebooks:read', async (_, { root, name }) => {
  try {
    const dir = getNotebooksDir(root);
    const filePath = path.join(dir, name);
    const content = fs.readFileSync(filePath, 'utf-8');
    return { ok: true, content };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('notebooks:write', async (_, { root, name, content }) => {
  try {
    const dir = getNotebooksDir(root);
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('notebooks:delete', async (_, { root, name }) => {
  try {
    const dir = getNotebooksDir(root);
    const filePath = path.join(dir, name);
    fs.unlinkSync(filePath);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});