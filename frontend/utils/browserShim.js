// Expose the API to the window object in browser environment
if (typeof window !== 'undefined' && !window.api) {
  const BACKEND_URL = 'http://localhost:8000';

  // Helper for backend requests
  async function callBackend(endpoint, method = 'GET', body = null, useToken = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (useToken) {
      const accStr = localStorage.getItem('atmos_account');
      if (accStr) {
        try {
          const acc = JSON.parse(accStr);
          if (acc && acc.token) {
            headers['Authorization'] = `Bearer ${acc.token}`;
          }
        } catch (e) {}
      }
    }
    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.detail || `Server error: ${res.status}` };
      }
      return data;
    } catch (e) {
      return { ok: false, error: `Failed to connect to backend: ${e.message}` };
    }
  }

  // Virtual Filesystem in memory/localStorage
  const defaultFs = {
    folderPath: '/virtual-workspace',
    folderName: 'virtual-workspace',
    tree: [
      {
        name: 'main.py',
        path: '/virtual-workspace/main.py',
        type: 'file',
        ext: 'py',
        content: 'print("Hello from Atmos IDE web client!")\n\n# Try live collaboration by opening the collaboration panel!\n# Code here is kept in browser memory.',
        size: 153,
        mtime: Date.now()
      },
      {
        name: 'index.js',
        path: '/virtual-workspace/index.js',
        type: 'file',
        ext: 'js',
        content: 'console.log("Welcome to Atmos IDE!");\n\n// Press Run to simulate execution.',
        size: 72,
        mtime: Date.now()
      },
      {
        name: 'README.md',
        path: '/virtual-workspace/README.md',
        type: 'file',
        ext: 'md',
        content: '# Atmos IDE Web Client\\n\\nYou are running Atmos IDE directly in your web browser.\\n\\n### Available Features in Web Mode:\\n- **Cloud Sync**: Save and load snippets to MongoDB Atlas.\\n- **Real-time Collaboration**: Start a session, copy the room ID, and collaborate live!\\n- **Editor**: Full Monaco Editor with syntax highlighting.\\n\\n*Note: Local filesystem execution, terminal PTY, and full local Git require running Atmos IDE as a Desktop App.*',
        size: 472,
        mtime: Date.now()
      }
    ]
  };

  const getVirtualFs = () => {
    const data = localStorage.getItem('atmos_virtual_fs');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
    return defaultFs;
  };

  const saveVirtualFs = (fsData) => {
    localStorage.setItem('atmos_virtual_fs', JSON.stringify(fsData));
  };

  // Listeners maps
  const listeners = {
    'win:state': [],
    'win:fullscreen': [],
    'exec:out': [],
    'exec:done': [],
    'ai:progress': [],
    'pty:data': [],
    'pty:exit': [],
    'watch:change': []
  };

  const on = (event, cb) => {
    if (listeners[event]) {
      listeners[event].push(cb);
    }
    return () => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(x => x !== cb);
      }
    };
  };

  const trigger = (event, data) => {
    if (listeners[event]) {
      listeners[event].forEach(cb => cb(data));
    }
  };

  window.api = {
    // Window controls
    winMin: () => console.log('[Browser Shim] Window Minimized'),
    winMax: () => console.log('[Browser Shim] Window Maximized'),
    winClose: () => console.log('[Browser Shim] Window Closed'),
    winFullscreen: () => console.log('[Browser Shim] Window Fullscreen'),
    winIsMax: async () => false,
    onWinState: cb => on('win:state', cb),
    onFullscreen: cb => on('win:fullscreen', cb),

    // Settings
    loadSettings: async () => {
      const s = localStorage.getItem('atmos_settings');
      return s ? JSON.parse(s) : null;
    },
    saveSettings: async (s) => {
      localStorage.setItem('atmos_settings', JSON.stringify(s));
      return { ok: true };
    },

    // Account
    loadAccount: async () => {
      const acc = localStorage.getItem('atmos_account');
      return acc ? JSON.parse(acc) : null;
    },
    saveAccount: async (a) => {
      localStorage.setItem('atmos_account', JSON.stringify(a));
      return { ok: true };
    },
    logout: async () => {
      localStorage.removeItem('atmos_account');
      return { ok: true };
    },
    accountSignup: async (name, email, password) => {
      const res = await callBackend('/api/auth/signup', 'POST', { name, email, password }, false);
      if (res.ok && res.token) {
        const accountData = {
          token: res.token,
          name: res.account.name,
          email: res.account.email,
          createdAt: res.account.createdAt,
          plan: res.account.plan
        };
        localStorage.setItem('atmos_account', JSON.stringify(accountData));
        return { ok: true, account: accountData };
      }
      return res;
    },
    accountLogin: async (email, password) => {
      const res = await callBackend('/api/auth/login', 'POST', { email, password }, false);
      if (res.ok && res.token) {
        const accountData = {
          token: res.token,
          name: res.account.name,
          email: res.account.email,
          createdAt: res.account.createdAt,
          plan: res.account.plan
        };
        localStorage.setItem('atmos_account', JSON.stringify(accountData));
        return { ok: true, account: accountData };
      }
      return res;
    },

    // Cloud snippets
    cloudList: async () => {
      const res = await callBackend('/api/snippets', 'GET');
      if (Array.isArray(res)) {
        return res;
      }
      const localCloud = localStorage.getItem('atmos_cloud_fallback');
      return localCloud ? JSON.parse(localCloud) : [];
    },
    cloudSave: async (s) => {
      const payload = {
        id: s.id || null,
        name: s.name,
        description: s.description || '',
        language: s.language,
        code: s.code
      };
      const res = await callBackend('/api/snippets', 'POST', payload);
      if (res.ok && res.list) {
        return { ok: true, list: res.list };
      }
      const localCloud = localStorage.getItem('atmos_cloud_fallback');
      const list = localCloud ? JSON.parse(localCloud) : [];
      const idx = list.findIndex(x => x.id === s.id);
      const entry = { ...s, id: s.id || `snip_${Date.now()}`, updatedAt: Date.now(), createdAt: s.createdAt || Date.now() };
      if (idx >= 0) list[idx] = entry;
      else list.unshift(entry);
      localStorage.setItem('atmos_cloud_fallback', JSON.stringify(list));
      return { ok: true, list };
    },
    cloudDelete: async (id) => {
      if (id && !id.startsWith('snip_')) {
        const res = await callBackend(`/api/snippets/${id}`, 'DELETE');
        if (res.ok && res.list) {
          return { ok: true, list: res.list };
        }
      }
      const localCloud = localStorage.getItem('atmos_cloud_fallback');
      const list = (localCloud ? JSON.parse(localCloud) : []).filter(s => s.id !== id);
      localStorage.setItem('atmos_cloud_fallback', JSON.stringify(list));
      return { ok: true, list };
    },

    // Recent + bookmarks
    loadRecent: async () => {
      const r = localStorage.getItem('atmos_recent');
      return r ? JSON.parse(r) : [];
    },
    loadBookmarks: async () => {
      const b = localStorage.getItem('atmos_bookmarks');
      return b ? JSON.parse(b) : [];
    },
    saveBookmarks: async (b) => {
      localStorage.setItem('atmos_bookmarks', JSON.stringify(b));
      return { ok: true };
    },

    // File history
    historyPush: async (fp, c) => ({ ok: true }),
    historyUndo: async (fp) => null,

    // Virtual filesystem
    openFile: async () => {
      const fsData = getVirtualFs();
      if (fsData.tree.length > 0) {
        const file = fsData.tree[0];
        return {
          path: file.path,
          name: file.name,
          content: file.content,
          ext: file.ext,
          size: file.size,
          mtime: file.mtime
        };
      }
      return null;
    },
    openFolder: async () => {
      const fsData = getVirtualFs();
      return {
        folderPath: fsData.folderPath,
        folderName: fsData.folderName,
        tree: fsData.tree
      };
    },
    readFile: async (fp) => {
      const fsData = getVirtualFs();
      const file = fsData.tree.find(f => f.path === fp);
      if (file) {
        return {
          path: file.path,
          name: file.name,
          content: file.content,
          ext: file.ext,
          size: file.size,
          mtime: file.mtime
        };
      }
      return { error: 'File not found in virtual workspace.' };
    },
    saveFile: async (fp, content) => {
      const fsData = getVirtualFs();
      const fileIndex = fsData.tree.findIndex(f => f.path === fp);
      const mtime = Date.now();
      if (fileIndex >= 0) {
        fsData.tree[fileIndex].content = content;
        fsData.tree[fileIndex].size = content.length;
        fsData.tree[fileIndex].mtime = mtime;
        saveVirtualFs(fsData);
        trigger('watch:change', { type: 'change', path: fp });
        return { ok: true, mtime };
      }
      return { error: 'File not found in virtual workspace.' };
    },
    saveFileAs: async (content, defaultName) => {
      const fsData = getVirtualFs();
      const fp = `${fsData.folderPath}/${defaultName}`;
      const ext = defaultName.split('.').pop() || '';
      const newFileObj = {
        name: defaultName,
        path: fp,
        type: 'file',
        ext,
        content,
        size: content.length,
        mtime: Date.now()
      };
      fsData.tree.push(newFileObj);
      saveVirtualFs(fsData);
      trigger('watch:change', { type: 'create', path: fp });
      return { path: fp, name: defaultName, ext };
    },
    newFile: async (dir, name) => {
      const fsData = getVirtualFs();
      const fp = `${dir}/${name}`;
      const ext = name.split('.').pop() || '';
      const newFileObj = {
        name,
        path: fp,
        type: 'file',
        ext,
        content: '',
        size: 0,
        mtime: Date.now()
      };
      fsData.tree.push(newFileObj);
      saveVirtualFs(fsData);
      trigger('watch:change', { type: 'create', path: fp });
      return { path: fp, name, content: '', ext };
    },
    newFolder: async (dir, name) => {
      return { ok: true };
    },
    deleteItem: async (fp) => {
      const fsData = getVirtualFs();
      fsData.tree = fsData.tree.filter(f => f.path !== fp);
      saveVirtualFs(fsData);
      trigger('watch:change', { type: 'delete', path: fp });
      return { ok: true };
    },
    renameItem: async (oldPath, newName) => {
      const fsData = getVirtualFs();
      const file = fsData.tree.find(f => f.path === oldPath);
      if (file) {
        const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
        const newPath = `${dir}/${newName}`;
        file.name = newName;
        file.path = newPath;
        file.ext = newName.split('.').pop() || '';
        saveVirtualFs(fsData);
        trigger('watch:change', { type: 'rename', oldPath, newPath });
        return { ok: true, newPath };
      }
      return { error: 'File not found' };
    },
    refreshDir: async (p) => {
      const fsData = getVirtualFs();
      return fsData.tree;
    },
    revealItem: async (p) => {},
    clipboardWrite: async (t) => {
      try {
        await navigator.clipboard.writeText(t);
      } catch (e) {
        console.error('Clipboard write failed:', e);
      }
    },
    clipboardRead: async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return '';
      }
    },

    // Mock Git
    gitStatus: async (cwd) => ({ ok: true, files: [] }),
    gitBranch: async (cwd) => ({ ok: true, out: 'web-session' }),
    gitLog: async (cwd) => ({ ok: true, commits: [] }),
    gitDiff: async (cwd, f) => ({ ok: true, out: '' }),
    gitShowHead: async (cwd, f) => ({ ok: true, out: '' }),
    gitStage: async (cwd, f) => ({ ok: true }),
    gitUnstage: async (cwd, f) => ({ ok: true }),
    gitCommit: async (cwd, msg) => ({ ok: false, err: 'Git operations require Desktop App mode.' }),
    gitPush: async (cwd) => ({ ok: false, err: 'Git operations require Desktop App mode.' }),
    gitPull: async (cwd) => ({ ok: false, err: 'Git operations require Desktop App mode.' }),
    gitDiscard: async (cwd, f) => ({ ok: true }),
    gitInit: async (cwd) => ({ ok: false, err: 'Git operations require Desktop App mode.' }),

    // Code execution
    runCode: async (code, lang) => {
      trigger('exec:out', `Running code in web terminal simulation...\r\n`);
      setTimeout(() => {
        if (['js', 'javascript'].includes(lang)) {
          try {
            const originalLog = console.log;
            let logs = [];
            console.log = (...args) => { logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')) };
            const result = new Function(code)();
            console.log = originalLog;
            logs.forEach(l => trigger('exec:out', `${l}\r\n`));
            if (result !== undefined) trigger('exec:out', `Return value: ${result}\r\n`);
          } catch (e) {
            trigger('exec:out', `Error: ${e.message}\r\n`);
          }
        } else if (lang === 'py' || lang === 'python') {
          trigger('exec:out', `Atmos Python Runner (Web Shim):\r\n`);
          const printMatches = code.match(/print\((['"])(.*?)\1\)/g);
          if (printMatches) {
            printMatches.forEach(m => {
              const val = m.replace(/print\((['"])(.*?)\1\)/, '$2');
              trigger('exec:out', `${val}\r\n`);
            });
          } else {
            trigger('exec:out', `Python execution simulated successfully.\r\n`);
          }
        } else {
          trigger('exec:out', `Code execution for .${lang} is only supported in Desktop App mode.\r\n`);
        }
        trigger('exec:done', { code: 0, ms: 15 });
      }, 500);
      return { ok: true };
    },
    stopCode: async () => {
      trigger('exec:out', `Execution stopped.\r\n`);
      trigger('exec:done', { code: -1, ms: 0 });
    },
    onExecOut: cb => on('exec:out', cb),
    onExecDone: cb => on('exec:done', cb),

    // AI
    aiChat: async (prompt, provider, apiKey, model) => {
      return { ok: false, error: 'AI features require Desktop App mode.' };
    },
    aiReview: async (code, language, provider, apiKey, model) => {
      return { ok: false, error: 'AI features require Desktop App mode.' };
    },
    aiCancel: async () => {},
    onAiProgress: cb => on('ai:progress', cb),
    hasEnvKey: async () => false,

    // PTY
    ptyCreate: async (cwd) => {
      setTimeout(() => {
        trigger('pty:data', `Atmos Web PTY Terminal Initialized.\r\n$ `);
      }, 100);
      return { ok: true };
    },
    ptyWrite: (d) => {
      if (d === '\r') {
        trigger('pty:data', `\r\nWeb client terminal is simulated. Run code or scripts in the Desktop App!\r\n$ `);
      } else if (d === '\x03') {
        trigger('pty:data', `^C\r\n$ `);
      } else {
        trigger('pty:data', d);
      }
    },
    ptyResize: (c, r) => {},
    ptyKill: async () => ({ ok: true }),
    onPtyData: cb => on('pty:data', cb),
    onPtyExit: cb => on('pty:exit', cb),

    // Extras
    lintJS: async (code) => ({ ok: true, errors: [] }),
    formatCode: async (code, lang) => ({ ok: false }),
    sysInfo: async () => ({ os: 'Web Browser', platform: navigator.platform }),
    watchStart: async (fp) => ({}),
    watchStop: async (fp) => ({}),
    onFileChange: cb => on('watch:change', cb),

    // Notebooks
    notebooksList: async (root) => {
      const data = localStorage.getItem('atmos_notebooks');
      return { ok: true, notebooks: data ? JSON.parse(data) : [] };
    },
    notebooksCreate: async (root, name) => {
      const current = localStorage.getItem('atmos_notebooks');
      const list = current ? JSON.parse(current) : [];
      if (!list.includes(name)) {
        list.push(name);
        localStorage.setItem('atmos_notebooks', JSON.stringify(list));
      }
      localStorage.setItem(`atmos_notebook_${name}`, JSON.stringify({ cells: [] }));
      return { ok: true, name };
    },
    notebooksRead: async (root, name) => {
      const cellData = localStorage.getItem(`atmos_notebook_${name}`);
      return { ok: true, content: cellData ? JSON.parse(cellData) : { cells: [] } };
    },
    notebooksWrite: async (root, name, content) => {
      localStorage.setItem(`atmos_notebook_${name}`, JSON.stringify(content));
      return { ok: true };
    },
    notebooksDelete: async (root, name) => {
      const current = localStorage.getItem('atmos_notebooks');
      const list = (current ? JSON.parse(current) : []).filter(n => n !== name);
      localStorage.setItem('atmos_notebooks', JSON.stringify(list));
      localStorage.removeItem(`atmos_notebook_${name}`);
      return { ok: true };
    }
  };
}
