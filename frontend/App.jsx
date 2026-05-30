import React, { useState, useCallback, useEffect, useRef } from "react";
import TitleBar from "./components/TitleBar/TitleBar.jsx";
import ActivityBar from "./components/ActivityBar/ActivityBar.jsx";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import EditorArea from "./components/EditorArea/EditorArea.jsx";
import BottomPanel from "./components/BottomPanel/BottomPanel.jsx";
import StatusBar from "./components/StatusBar/StatusBar.jsx";
import CommandPalette from "./components/CommandPalette/CommandPalette.jsx";
import Notifications from "./components/Notifications/Notifications.jsx";
import SettingsPanel from "./panels/SettingsPanel/SettingsPanel.jsx";
import AccountPanel from "./panels/AccountPanel/AccountPanel.jsx";
import CloudPanel from "./panels/CloudPanel/CloudPanel.jsx";
import AiPanel from "./panels/AiPanel/AiPanel.jsx";
import NotebookPanel from "./panels/NotebookPanel/NotebookPanel.jsx";
import DataPanel from "./panels/DataPanel/DataPanel.jsx";
import HelpOverlayPanel from "./panels/HelpOverlayPanel/HelpOverlayPanel.jsx";
import { useFiles } from "./hooks/useFiles.js";
import { useTerminal } from "./hooks/useTerminal.js";
import { useSettings } from "./hooks/useSettings.js";
import { useNotifications } from "./hooks/useNotifications.js";
import { useGit } from "./hooks/useGit.js";
import { useNotebooks } from "./hooks/useNotebooks.js";
import { EXT_LANG, RUNNABLE } from "./utils/language.js";
import S from "./styles/App.module.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelH, setPanelH] = useState(260);
  const [activeActivity, setActiveActivity] = useState("explorer");
  const [overlay, setOverlay] = useState(null);
  const [palOpen, setPalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("output");
  const [splitMode, setSplitMode] = useState(false);
  const [gotoLine, setGotoLine] = useState(null);
  const [panelMaximized, setPanelMaximized] = useState(false);
  const [editorMode, setEditorMode] = useState("code"); // 'code', 'preview', 'debug'
  const dragging = useRef(false);

  const handleEditorModeChange = useCallback((mode) => {
    setEditorMode(mode);
    if (mode === "debug") {
      setActivePanel("debug");
      setPanelOpen(true);
    }
  }, [setActivePanel, setPanelOpen]);



  const { notify, notifications, dismiss } = useNotifications();
  const { settings, updateSettings } = useSettings();
  const {
    lines,
    running,
    lastMs,
    setRunning,
    setDone,
    appendLine,
    clearTerminal,
  } = useTerminal();
  const {
    openFiles,
    activeFile,
    splitFile,
    folderTree,
    folderName,
    rootFolderPath,
    lintErrors,
    openFile,
    openFileDiff,
    closeFile,
    setActiveFile,
    setSplitFile,
    updateFileContent,
    openFolder,
    openFileFromDisk,
    saveFile,
    saveFileAs,
    newFile,
    newFolder,
    deleteItem,
    renameItem,
    refreshTree,
    formatFile,
    runLint,
  } = useFiles(notify);
  const git = useGit(rootFolderPath, notify);
  const notebooks = useNotebooks(rootFolderPath, notify);



  const lang = activeFile ? EXT_LANG[activeFile.ext] || "plaintext" : "";
  const canRun = !!activeFile && RUNNABLE.has(activeFile.ext);
  const errorCount = activeFile ? lintErrors[activeFile.id]?.length || 0 : 0;

  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty("--ac", settings.accentColor);
      const h = settings.accentColor.replace("#", "");
      const r = Math.min(255, parseInt(h.slice(0, 2), 16) + 25);
      const g = Math.min(255, parseInt(h.slice(2, 4), 16) + 25);
      const b = Math.min(255, parseInt(h.slice(4, 6), 16) + 25);
      document.documentElement.style.setProperty(
        "--acl",
        "#" +
          r.toString(16).padStart(2, "0") +
          g.toString(16).padStart(2, "0") +
          b.toString(16).padStart(2, "0"),
      );
      
      const baseR = parseInt(h.slice(0, 2), 16);
      const baseG = parseInt(h.slice(2, 4), 16);
      const baseB = parseInt(h.slice(4, 6), 16);
      if (!isNaN(baseR) && !isNaN(baseG) && !isNaN(baseB)) {
        document.documentElement.style.setProperty("--acd", `rgba(${baseR}, ${baseG}, ${baseB}, 0.08)`);
        document.documentElement.style.setProperty("--acg", `rgba(${baseR}, ${baseG}, ${baseB}, 0.22)`);

        // Convert hex to HSL
        let rNorm = baseR / 255, gNorm = baseG / 255, bNorm = baseB / 255;
        let max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
        let hDeg = 0, sPct = 0, lPct = (max + min) / 2;
        if (max !== min) {
          let d = max - min;
          sPct = lPct > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === rNorm) hDeg = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
          else if (max === gNorm) hDeg = (bNorm - rNorm) / d + 2;
          else if (max === bNorm) hDeg = (rNorm - gNorm) / d + 4;
          hDeg /= 6;
        }
        hDeg *= 360;
        sPct *= 100;
        lPct *= 100;

        // Shift hue to create harmonious analogous gradient boundaries
        const startH = (hDeg - 25 + 360) % 360;
        const startHex = hslToHexStr(startH, sPct, Math.max(20, lPct - 5));
        const endH = (hDeg + 25) % 360;
        const endHex = hslToHexStr(endH, sPct, Math.min(90, lPct + 5));

        document.documentElement.style.setProperty("--ac-start", startHex);
        document.documentElement.style.setProperty("--ac-end", endHex);
      }
    }
  }, [settings.accentColor]);

  const handleSave = useCallback(async () => {
    if (settings.formatOnSave) await formatFile();
    await saveFile();
    if (settings.liveErrors) runLint(activeFile);
  }, [saveFile, formatFile, settings, activeFile, runLint]);

  const lastLintedFileIdRef = useRef(null);
  useEffect(() => {
    if (!settings.liveErrors || !activeFile) {
      lastLintedFileIdRef.current = null;
      return;
    }
    
    if (activeFile.id !== lastLintedFileIdRef.current) {
      runLint(activeFile);
      lastLintedFileIdRef.current = activeFile.id;
      return;
    }

    const timer = setTimeout(() => {
      runLint(activeFile);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeFile?.id, activeFile?.content, settings.liveErrors, runLint]);

  const handleRun = useCallback(async () => {
    if (!activeFile) return;
    
    // Save changes first
    await handleSave();
    if (!activeFile.path) {
      notify("error", "Please save the file first to run it in the terminal.");
      return;
    }

    if (activePanel === "output") {
      setPanelOpen(true);
      setRunning(true);
      clearTerminal();
      await window.api.runCode(activeFile.content, lang);
      return;
    }

    let runCmd = '';
    const ext = activeFile.ext;
    const fp = activeFile.path;
    const isWin = navigator.userAgent.includes('Windows') || navigator.platform.includes('Win');
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
      runCmd = `node "${fp}"`;
    } else if (ext === 'py') {
      runCmd = `python "${fp}"`;
    } else if (ext === 'rb') {
      runCmd = `ruby "${fp}"`;
    } else if (ext === 'php') {
      runCmd = `php "${fp}"`;
    } else if (['sh', 'bash'].includes(ext)) {
      runCmd = `bash "${fp}"`;
    } else if (ext === 'java') {
      runCmd = `java "${fp}"`;
    } else if (ext === 'go') {
      runCmd = `go run "${fp}"`;
    } else if (ext === 'c') {
      const outBase = fp.slice(0, fp.lastIndexOf('.'));
      const outName = isWin ? `${outBase}.exe` : outBase;
      runCmd = isWin 
        ? `gcc "${fp}" -o "${outName}"; if ($?) { & "${outName}" }` 
        : `gcc "${fp}" -o "${outName}" && "${outName}"`;
    } else if (ext === 'cpp') {
      const outBase = fp.slice(0, fp.lastIndexOf('.'));
      const outName = isWin ? `${outBase}.exe` : outBase;
      runCmd = isWin 
        ? `g++ "${fp}" -o "${outName}"; if ($?) { & "${outName}" }` 
        : `g++ "${fp}" -o "${outName}" && "${outName}"`;
    } else if (ext === 'rs') {
      const outBase = fp.slice(0, fp.lastIndexOf('.'));
      const outName = isWin ? `${outBase}.exe` : outBase;
      runCmd = isWin 
        ? `rustc "${fp}" -o "${outName}"; if ($?) { & "${outName}" }` 
        : `rustc "${fp}" -o "${outName}" && "${outName}"`;
    } else {
      notify("error", `Running .${ext} files in terminal is not supported.`);
      return;
    }

    // Switch to Terminal Panel
    setActivePanel("terminal");
    setPanelOpen(true);

    // Wait a brief moment for the PTY to mount/initialize
    setTimeout(() => {
      const ctrlC = '\x03'; // Send Ctrl+C to cancel current line input
      window.api.ptyWrite(ctrlC + runCmd + '\r');
    }, 450);
  }, [activeFile, handleSave, activePanel, setRunning, clearTerminal, lang, setActivePanel, setPanelOpen, notify]);

  const handleJumpToProblem = useCallback(async (filePath, line) => {
    const existing = openFiles.find(f => f.path === filePath);
    if (existing) {
      setActiveFile(existing.id);
    } else {
      await openFile({ path: filePath });
    }
    setGotoLine({ line, ts: Date.now() });
  }, [openFiles, openFile, setActiveFile, setGotoLine]);

  const handleStop = useCallback(() => window.api.stopCode(), []);

  useEffect(() => {
    const u1 = window.api.onExecOut((d) => appendLine(d));
    const u2 = window.api.onExecDone((res) => {
      setDone(res);
      if (res.code !== 0 && res.code !== -1)
        notify("error", "Exit " + res.code + " � " + res.ms + "ms");
    });
    return () => {
      u1();
      u2();
    };
  }, [appendLine, setDone, notify]);

  useEffect(() => {
    if (!settings.autoSave || !activeFile?.modified || !activeFile?.path)
      return;
    const t = setTimeout(() => handleSave(), settings.autoSaveDelay || 1500);
    return () => clearTimeout(t);
  }, [activeFile?.content, settings.autoSave]);

  const onDivider = useCallback(
    (e) => {
      e.preventDefault();
      setPanelMaximized(false);
      dragging.current = true;
      const y0 = e.clientY,
        h0 = panelH;
      const move = (e) => {
        if (dragging.current) {
          const maxH = Math.max(100, window.innerHeight - 150);
          setPanelH(Math.max(80, Math.min(maxH, h0 + y0 - e.clientY)));
        }
      };
      const up = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [panelH],
  );

  useEffect(() => {
    const h = (e) => {
      const m = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (m && key === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (m && e.shiftKey && key === "s") {
        e.preventDefault();
        saveFileAs();
      }
      if (m && key === "o") {
        e.preventDefault();
        openFileFromDisk();
      }
      if (m && key === "n") {
        e.preventDefault();
        newFile();
      }
      if (m && e.shiftKey && key === "e") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      if (m && e.key === "`") {
        e.preventDefault();
        setPanelOpen((v) => !v);
      }
      if (m && e.shiftKey && key === "p") {
        e.preventDefault();
        setPalOpen(true);
      }
      if (m && e.key === "\\") {
        e.preventDefault();
        setSplitMode((v) => !v);
      }
      if (m && e.shiftKey && key === "f") {
        e.preventDefault();
        formatFile();
      }
      if (m && e.shiftKey && key === "k") {
        e.preventDefault();
        setOverlay("ai");
      }
      if (m && key === ",") {
        e.preventDefault();
        setOverlay((v) => (v === "settings" ? null : "settings"));
      }
      if (m && e.shiftKey && key === "g") {
        e.preventDefault();
        setActiveActivity("git");
        setSidebarOpen(true);
      }
      if (m && e.shiftKey && key === "m") {
        e.preventDefault();
        setOverlay((v) => (v === "notebooks" ? null : "notebooks"));
      }
      if (e.key === "F5") {
        e.preventDefault();
        handleRun();
      }
      if (e.key === "F11") {
        e.preventDefault();
        window.api.winFullscreen();
      }
      if (e.key === "Escape") {
        setPalOpen(false);
        setOverlay(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [
    handleSave,
    saveFileAs,
    openFileFromDisk,
    newFile,
    formatFile,
    handleRun,
    overlay,
  ]);

  const onActivity = (id) => {
    if (["settings", "account", "cloud", "ai", "notebooks", "data"].includes(id)) {
      setOverlay(id);
      return;
    }
    if (activeActivity === id && sidebarOpen) setSidebarOpen(false);
    else {
      setActiveActivity(id);
      setSidebarOpen(true);
    }
  };

  return (
    <div className={S.app} data-zen={settings.zenMode ? "true" : "false"}>
      <TitleBar
        activeFile={activeFile}
        running={running}
        canRun={canRun}
        onRun={handleRun}
        onStop={handleStop}
        onOpen={openFileFromDisk}
        onSave={handleSave}
        onSaveAs={saveFileAs}
        onOpenFolder={openFolder}
        onNewFile={newFile}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onTogglePanel={() => setPanelOpen((v) => !v)}
        onToggleSplit={() => setSplitMode((v) => !v)}
        onZenMode={() => updateSettings({ zenMode: !settings.zenMode })}
        onPalette={() => setPalOpen(true)}
        onFormat={formatFile}
        onAI={() => setOverlay((v) => (v === "ai" ? null : "ai"))}
        onData={() => setOverlay("data")}
        onClearTerminal={clearTerminal}
        onShowWelcome={() => setOverlay("welcome")}
        onShowShortcuts={() => setOverlay("shortcuts")}
        onShowAbout={() => setOverlay("about")}
        onShowGoToLine={() => setOverlay("gotoline")}
        onOpenAccount={() => setOverlay("account")}
        onOpenCloud={() => setOverlay("cloud")}
        branch={git.branch}
        gitStatus={git.status}
        zenMode={settings.zenMode}
        splitMode={splitMode}
        errorCount={errorCount}
        editorMode={editorMode}
        onChangeEditorMode={handleEditorModeChange}
      />
      <div className={S.body}>
        {!settings.zenMode && (
          <ActivityBar
            active={activeActivity}
            onSelect={onActivity}
            gitCount={git.status.length}
          />
        )}
        {sidebarOpen && !settings.zenMode && (
          <Sidebar
            activity={activeActivity}
            folderTree={folderTree}
            folderName={folderName}
            rootFolderPath={rootFolderPath}
            openFiles={openFiles}
            activeFile={activeFile}
            onOpenFile={openFile}
            onOpenFileDiff={openFileDiff}
            onOpenFolder={openFolder}
            onNewFile={newFile}
            onNewFolder={newFolder}
            onDeleteItem={deleteItem}
            onRenameItem={renameItem}
            onRefresh={refreshTree}
            notify={notify}
            git={git}
            lintErrors={lintErrors}
          />
        )}
        <div className={S.main}>
          <div style={{ display: panelMaximized ? 'none' : 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <EditorArea
              openFiles={openFiles}
              activeFile={activeFile}
              splitFile={splitFile}
              settings={settings}
              language={lang}
              splitMode={splitMode}
              lintErrors={lintErrors}
              onSelectTab={setActiveFile}
              onCloseTab={closeFile}
              onChangeContent={updateFileContent}
              onRun={handleRun}
              onSave={handleSave}
              onSplitSelect={setSplitFile}
              gotoLine={gotoLine}
              editorMode={editorMode}
            />
          </div>
          {panelOpen && (
            <>
              {!panelMaximized && <div className={S.divider} onMouseDown={onDivider} />}
              <BottomPanel
                height={panelMaximized ? "100%" : panelH}
                activeTab={activePanel}
                onTabChange={setActivePanel}
                lines={lines}
                running={running}
                lastMs={lastMs}
                canRun={canRun}
                rootFolderPath={rootFolderPath}
                onRun={handleRun}
                onStop={handleStop}
                onClear={clearTerminal}
                lintErrors={lintErrors}
                openFiles={openFiles}
                activeFile={activeFile}
                panelMaximized={panelMaximized}
                onToggleMaximize={() => setPanelMaximized(p => !p)}
                onClosePanel={() => setPanelOpen(false)}
                onJumpToProblem={handleJumpToProblem}
              />
            </>
          )}
        </div>
        {overlay === "ai" && !settings.zenMode && (
          <div className={S.aiSidebar}>
            <AiPanel
              activeFile={activeFile}
              rootFolderPath={rootFolderPath}
              onClose={() => setOverlay(null)}
              notify={notify}
              settings={settings}
              updateSettings={updateSettings}
              onJumpToLine={(line) => setGotoLine({ line, ts: Date.now() })}
              onInsert={(code) => {
                if (activeFile)
                  updateFileContent(
                    activeFile.id,
                    activeFile.content + "\n" + code,
                  );
              }}
            />
          </div>
        )}
      </div>
      <StatusBar
        language={lang}
        fileName={activeFile?.name}
        modified={activeFile?.modified}
        line={activeFile?.cursor?.line || 1}
        col={activeFile?.cursor?.col || 1}
        running={running}
        lastMs={lastMs}
        branch={git.branch}
        hasGit={git.hasGit}
        gitChanges={git.status.length}
        errorCount={errorCount}
        onOpenSettings={() => setOverlay("settings")}
        onOpenGit={() => {
          setActiveActivity("git");
          setSidebarOpen(true);
        }}
      />
      {overlay === "settings" && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setOverlay(null)}
          notify={notify}
        />
      )}
      {overlay === "account" && (
        <AccountPanel
          onClose={() => setOverlay(null)}
          notify={notify}
          onOpenCloud={() => setOverlay("cloud")}
        />
      )}
      {overlay === "data" && (
        <DataPanel
          onClose={() => setOverlay(null)}
          notify={notify}
        />
      )}
      {overlay === "cloud" && (
        <CloudPanel
          activeFile={activeFile}
          onClose={() => setOverlay(null)}
          notify={notify}
          onOpenFile={openFile}
        />
      )}

      {overlay === "notebooks" && (
        <NotebookPanel
          onClose={() => setOverlay(null)}
          notify={notify}
          notebooks={notebooks.notebooks}
          activeNotebook={notebooks.activeNotebook}
          createNotebook={notebooks.createNotebook}
          readNotebook={notebooks.readNotebook}
          writeNotebook={notebooks.writeNotebook}
          deleteNotebook={notebooks.deleteNotebook}
          updateContent={notebooks.updateContent}
          setActiveNotebook={notebooks.setActiveNotebook}
        />
      )}
      {['welcome', 'about', 'shortcuts', 'gotoline'].includes(overlay) && (
        <HelpOverlayPanel
          view={overlay}
          onClose={() => setOverlay(null)}
          openFiles={openFiles}
          activeFile={activeFile}
          onSelectTab={setActiveFile}
          onNewFile={newFile}
          onOpenFolder={openFolder}
          onOpenFile={openFile}
          onAI={() => setOverlay("ai")}
          onOpenSettings={() => setOverlay("settings")}
          onJumpToLine={(line) => setGotoLine({ line, ts: Date.now() })}
        />
      )}
      {palOpen && (
        <CommandPalette
          openFiles={openFiles}
          activeFile={activeFile}
          onClose={() => setPalOpen(false)}
          onSelectFile={(f) => {
            setActiveFile(f.id);
            setPalOpen(false);
          }}
          onOpen={() => {
            openFileFromDisk();
            setPalOpen(false);
          }}
          onOpenFolder={() => {
            openFolder();
            setPalOpen(false);
          }}
          onSave={() => {
            handleSave();
            setPalOpen(false);
          }}
          onRun={() => {
            handleRun();
            setPalOpen(false);
          }}
          onFormat={() => {
            formatFile();
            setPalOpen(false);
          }}
          onSettings={() => {
            setOverlay("settings");
            setPalOpen(false);
          }}
          onAccount={() => {
            setOverlay("account");
            setPalOpen(false);
          }}
          onCloud={() => {
            setOverlay("cloud");
            setPalOpen(false);
          }}
          onNotebooks={() => {
            setOverlay("notebooks");
            setPalOpen(false);
          }}
          onAI={() => {
            setOverlay("ai");
            setPalOpen(false);
          }}
          onToggleSidebar={() => {
            setSidebarOpen((v) => !v);
            setPalOpen(false);
          }}
          onTogglePanel={() => {
            setPanelOpen((v) => !v);
            setPalOpen(false);
          }}
          onToggleSplit={() => {
            setSplitMode((v) => !v);
            setPalOpen(false);
          }}
          onZen={() => {
            updateSettings({ zenMode: !settings.zenMode });
            setPalOpen(false);
          }}
          onNewFile={() => {
            newFile();
            setPalOpen(false);
          }}
          onGit={() => {
            setActiveActivity("git");
            setSidebarOpen(true);
            setPalOpen(false);
          }}
        />
      )}
      <Notifications items={notifications} onDismiss={dismiss} />
    </div>
  );
}

function hslToHexStr(h, s, l) {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  let red = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  let green = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  let blue = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  return `#${red}${green}${blue}`;
}
