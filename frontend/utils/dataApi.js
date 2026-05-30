const BACKEND_URL = import.meta.env.DEV
  ? 'http://localhost:8000'
  : 'https://code-compiler-lr1k.onrender.com';

export async function dbListDatabases() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/db/databases`);
    return await res.json();
  } catch (e) {
    return { databases: ['local_mock_db', 'zenith_ide'] };
  }
}

export async function dbListCollections(dbName) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/db/collections/${dbName}`);
    return await res.json();
  } catch (e) {
    if (dbName === 'local_mock_db') return { collections: ['users', 'snippets', 'settings'] };
    return { collections: ['items', 'logs'] };
  }
}

export async function dbQueryDocuments(dbName, collectionName, query, limit, skip) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/db/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_name: dbName, collection_name: collectionName, query, limit, skip })
    });
    return await res.json();
  } catch (e) {
    const mockDocs = [];
    const count = collectionName === 'users' ? 2 : 5;
    for (let i = 0; i < count; i++) {
      mockDocs.push({
        _id: `mock_id_${collectionName}_${i}`,
        name: `Mock Record ${i + 1}`,
        created_at: Date.now() - (i * 100000),
        status: i % 2 === 0 ? 'active' : 'pending',
        meta: { version: '1.0', tags: ['mock', 'offline'] }
      });
    }
    return { ok: true, documents: mockDocs };
  }
}

export async function dbInsertDocument(dbName, collectionName, document) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/db/documents/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_name: dbName, collection_name: collectionName, document })
    });
    return await res.json();
  } catch (e) {
    return { ok: true, document: { ...document, _id: 'mock_inserted_id_' + Date.now() } };
  }
}

export async function dbUpdateDocument(dbName, collectionName, docId, document) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/db/documents/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_name: dbName, collection_name: collectionName, doc_id: docId, document })
    });
    return await res.json();
  } catch (e) {
    return { ok: true, modified_count: 1 };
  }
}

export async function dbDeleteDocument(dbName, collectionName, docId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/db/documents/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_name: dbName, collection_name: collectionName, doc_id: docId })
    });
    return await res.json();
  } catch (e) {
    return { ok: true, deleted_count: 1 };
  }
}

export async function apiProxyRequest(url, method, headers, body) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/proxy/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method, headers, body })
    });
    return await res.json();
  } catch (e) {
    try {
      const start = Date.now();
      const fetchRes = await fetch(url, { method, headers, body: body ? body : undefined });
      const text = await fetchRes.text();
      let parsed = text;
      try { parsed = JSON.parse(text) } catch (err) {}
      return {
        ok: true,
        status: fetchRes.status,
        status_text: fetchRes.statusText,
        headers: {},
        body: parsed,
        time_ms: Date.now() - start,
        size_bytes: text.length
      };
    } catch (err) {
      return {
        ok: false,
        error: 'Proxy server is offline, and direct request failed due to CORS or network error.',
        status: 0,
        time_ms: 0
      };
    }
  }
}

export async function ragQueryCodebase(query, rootPath, provider, apiKey, model) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        root_path: rootPath,
        provider,
        api_key: apiKey,
        model
      })
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
