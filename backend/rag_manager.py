import os
import re

IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.idea', '.vscode'}
ALLOWED_EXTS = {
    '.js', '.jsx', '.ts', '.tsx', '.py', '.c', '.cpp', '.java', '.go', '.rs', '.rb', '.php',
    '.html', '.css', '.json', '.md', '.sql', '.yaml', '.yml', '.toml'
}

BLOCK_START_PATTERNS = [
    r'^\s*(def|class|function|fn|func)\s+\w+',
    r'^\s*(public|private|protected|static|\s)+\s*(class|interface|void|int|double|float|String|boolean)\s+\w+',
    r'^\s*(const|let|var)\s+\w+\s*=\s*(\([^)]*\)|_?\w+)\s*=>',
    r'^\s*async\s+function\s+\w+',
]

class RAGManager:
    @staticmethod
    def _chunk_file(file_path: str, content: str) -> list[dict]:
        """
        Chunks code files intelligently into logical blocks (functions/classes) if possible,
        falling back to size-based blocks.
        """
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        start_line = 1
        
        patterns = [re.compile(p) for p in BLOCK_START_PATTERNS]
        
        for idx, line in enumerate(lines):
            line_num = idx + 1
            is_block_start = False
            for pat in patterns:
                if pat.search(line):
                    is_block_start = True
                    break
                    
            if is_block_start and current_chunk:
                chunk_text = '\n'.join(current_chunk)
                if chunk_text.strip():
                    chunks.append({
                        "start_line": start_line,
                        "end_line": line_num - 1,
                        "text": chunk_text
                    })
                current_chunk = []
                start_line = line_num
                
            current_chunk.append(line)
            
            # Limit chunk size to maximum of 40 lines to maintain context accuracy
            if len(current_chunk) >= 40:
                chunk_text = '\n'.join(current_chunk)
                chunks.append({
                    "start_line": start_line,
                    "end_line": line_num,
                    "text": chunk_text
                })
                current_chunk = []
                start_line = line_num + 1
                
        if current_chunk:
            chunk_text = '\n'.join(current_chunk)
            if chunk_text.strip():
                chunks.append({
                    "start_line": start_line,
                    "end_line": len(lines),
                    "text": chunk_text
                })
                
        return chunks

    @staticmethod
    def search_workspace(root_path: str, keywords: list[str], max_results: int = 5) -> list[dict]:
        if not root_path or not os.path.exists(root_path):
            return []

        # Filter keywords
        keywords = [kw.lower() for kw in keywords if len(kw) > 2]
        if not keywords:
            return []

        candidates = []

        for root, dirs, files in os.walk(root_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext.lower() not in ALLOWED_EXTS:
                    continue

                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    rel_path = os.path.relpath(file_path, root_path)
                    rel_path_unix = rel_path.replace('\\', '/')
                    
                    # Filename matching score
                    path_lower = rel_path_unix.lower()
                    file_match_score = 0
                    for kw in keywords:
                        if kw in path_lower:
                            file_match_score += 15

                    chunks = RAGManager._chunk_file(rel_path_unix, content)
                    
                    for chunk in chunks:
                        chunk_text = chunk["text"]
                        chunk_text_lower = chunk_text.lower()
                        
                        score = file_match_score
                        match_count = 0
                        
                        for kw in keywords:
                            matches = len(re.findall(re.escape(kw), chunk_text_lower))
                            if matches > 0:
                                score += min(matches, 5) * 2
                                match_count += 1
                                
                        # Definitions boost
                        first_line = chunk_text.split('\n')[0].lower()
                        for kw in keywords:
                            if any(d in first_line for d in ['def ', 'class ', 'function ', 'fn ', 'func ']) and kw in first_line:
                                score += 10

                        if score > 0:
                            candidates.append({
                                "path": rel_path_unix,
                                "start_line": chunk["start_line"],
                                "end_line": chunk["end_line"],
                                "text": chunk_text,
                                "score": score
                            })
                except Exception:
                    continue

        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:max_results]


def expand_query(query: str, provider: str = "gemini", api_key: str = None, model: str = None) -> list[str]:
    """
    Leverages the LLM to translate natural questions into code keywords.
    """
    prompt = (
        f"Extract 3-5 technical code keywords, function names, class names, or filenames "
        f"relevant to searching a codebase for the developer query: '{query}'. "
        f"Respond with ONLY a comma-separated list of keywords. Do not include introductory text."
    )
    
    if provider == "gemini":
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            return [w for w in re.findall(r'\w+', query) if len(w) > 2]
        
        gemini_model = model if (model and model.startswith("gemini-")) else "gemini-flash-latest"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={key}"
        try:
            import requests
            resp = requests.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 100}
            }, timeout=5.0)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                keywords = [k.strip() for k in text.split(",") if k.strip()]
                return keywords
        except Exception:
            pass
            
    elif provider == "ollama":
        url = "http://localhost:11434/api/chat"
        ollama_model = model or "codellama"
        try:
            import requests
            resp = requests.post(url, json={
                "model": ollama_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 100}
            }, timeout=5.0)
            if resp.status_code == 200:
                text = resp.json()["message"]["content"].strip()
                keywords = [k.strip() for k in text.split(",") if k.strip()]
                return keywords
        except Exception:
            pass
            
    return [w for w in re.findall(r'\w+', query) if len(w) > 2]
