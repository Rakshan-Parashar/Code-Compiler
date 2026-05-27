import { useState, useEffect, useCallback } from 'react';

export function useNotebooks(rootFolderPath, notify) {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);

  const refreshNotebooks = useCallback(async () => {
    const res = await window.api.notebooksList(rootFolderPath);
    if (res.ok) {
      setNotebooks(res.notebooks);
    } else {
      notify('error', 'Failed to load notebooks: ' + res.error);
    }
  }, [rootFolderPath, notify]);

  useEffect(() => {
    refreshNotebooks();
  }, [refreshNotebooks]);

  const createNotebook = async (name) => {
    const res = await window.api.notebooksCreate(rootFolderPath, name);
    if (res.ok) {
      notify('success', `Notebook '${res.name}' created.`);
      await refreshNotebooks();
      await readNotebook(res.name);
    } else {
      notify('error', 'Failed to create notebook: ' + res.error);
    }
  };

  const readNotebook = async (name) => {
    const res = await window.api.notebooksRead(rootFolderPath, name);
    if (res.ok) {
      setActiveNotebook({ name, content: res.content, modified: false });
    } else {
      notify('error', `Failed to read notebook '${name}': ` + res.error);
    }
  };

  const writeNotebook = async (name, content) => {
    const res = await window.api.notebooksWrite(rootFolderPath, name, content);
    if (res.ok) {
      notify('success', `Notebook '${name}' saved.`);
      setActiveNotebook(n => ({ ...n, modified: false }));
    } else {
      notify('error', `Failed to save notebook '${name}': ` + res.error);
    }
  };

  const deleteNotebook = async (name) => {
    const res = await window.api.notebooksDelete(rootFolderPath, name);
    if (res.ok) {
      notify('info', `Notebook '${name}' deleted.`);
      if (activeNotebook?.name === name) {
        setActiveNotebook(null);
      }
      await refreshNotebooks();
    } else {
      notify('error', `Failed to delete notebook '${name}': ` + res.error);
    }
  };
  
  const updateContent = (content) => {
    if (!activeNotebook) return;
    setActiveNotebook(n => ({ ...n, content, modified: true }));
  }

  return {
    notebooks,
    activeNotebook,
    refreshNotebooks,
    createNotebook,
    readNotebook,
    writeNotebook,
    deleteNotebook,
    setActiveNotebook,
    updateContent,
  };
}
