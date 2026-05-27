import React, { useState, useCallback, useEffect, useRef } from "react";
import TitleBar from "./components/TitleBar.jsx";
import ActivityBar from "./components/ActivityBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import EditorArea from "./components/EditorArea.jsx";
import BottomPanel from "./components/BottomPanel.jsx";
import StatusBar from "./components/StatusBar.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import Notifications from "./components/Notifications.jsx";
import SettingsPanel from "./panels/SettingsPanel.jsx";
import AccountPanel from "./panels/AccountPanel.jsx";
import CloudPanel from "./panels/CloudPanel.jsx";
import AiPanel from "./panels/AiPanel.jsx";
import NotebookPanel from "./panels/NotebookPanel.jsx";
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
  const dragging = useRef(false);

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
    }
  }, [settings.accentColor]);

  const handleRun = useCallback(async () => {
    if (!activeFile) return;
    clearTerminal();
    setRunning(true);
    setActivePanel("output");
    setPanelOpen(true);
    await window.api.runCode(
      activeFile.content,
      EXT_LANG[activeFile.ext] || "plaintext",
    );
  }, [activeFile, clearTerminal, setRunning]);

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

  const handleSave = useCallback(async () => {
    if (settings.formatOnSave) await formatFile();
    await saveFile();
    if (settings.liveErrors) runLint(activeFile);
  }, [saveFile, formatFile, settings, activeFile, runLint]);

  const onDivider = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      const y0 = e.clientY,
        h0 = panelH;
      const move = (e) => {
        if (dragging.current)
          setPanelH(Math.max(80, Math.min(700, h0 + y0 - e.clientY)));
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
      if (m && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (m && e.shiftKey && e.key === "S") {
        e.preventDefault();
        saveFileAs();
      }
      if (m && e.key === "o") {
        e.preventDefault();
        openFileFromDisk();
      }
      if (m && e.key === "n") {
        e.preventDefault();
        newFile();
      }
      if (m && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      if (m && e.key === "`") {
        e.preventDefault();
        setPanelOpen((v) => !v);
      }
      if (m && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setPalOpen(true);
      }
      if (m && e.key === "\\\\") {
        e.preventDefault();
        setSplitMode((v) => !v);
      }
      if (m && e.shiftKey && e.key === "F") {
        e.preventDefault();
        formatFile();
      }
      if (m && e.shiftKey && e.key === "K") {
        e.preventDefault();
        setOverlay("ai");
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
  ]);

  const onActivity = (id) => {
    if (["settings", "account", "cloud", "ai", "notebooks"].includes(id)) {
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
        onAI={() => setOverlay("ai")}
        branch={git.branch}
        gitStatus={git.status}
        zenMode={settings.zenMode}
        splitMode={splitMode}
        errorCount={errorCount}
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
          />
          {panelOpen && (
            <>
              <div className={S.divider} onMouseDown={onDivider} />
              <BottomPanel
                height={panelH}
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
                lintErrors={activeFile ? lintErrors[activeFile.id] || [] : []}
                activeFile={activeFile}
              />
            </>
          )}
        </div>
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
      {overlay === "cloud" && (
        <CloudPanel
          activeFile={activeFile}
          onClose={() => setOverlay(null)}
          notify={notify}
          onOpenFile={openFile}
        />
      )}
      {overlay === "ai" && (
        <AiPanel
          activeFile={activeFile}
          onClose={() => setOverlay(null)}
          notify={notify}
          onInsert={(code) => {
            if (activeFile)
              updateFileContent(
                activeFile.id,
                activeFile.content + "\n" + code,
              );
          }}
        />
      )}
      {overlay === "notebooks" && (
        <NotebookPanel onClose={() => setOverlay(null)} notify={notify} />
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
