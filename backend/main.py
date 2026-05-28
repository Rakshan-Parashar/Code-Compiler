import os
import uuid
import time
from typing import List, Optional
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
import requests

from backend.config import JWT_SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, logger
from backend.db_manager import DatabaseManager
from backend.auth_manager import AuthManager

# Initialize Managers
db_manager = DatabaseManager()
auth_manager = AuthManager(JWT_SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    Verifies database connection and creates indexes.
    """
    db_manager.create_indexes()
    yield

# Initialize FastAPI App
app = FastAPI(title="Zenith IDE Backend", version="1.0.0", lifespan=lifespan)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security helper for Bearer token extraction
security = HTTPBearer()

# --- Database & Auth Helpers ---

def get_db():
    """Dependency to retrieve the active database client instance."""
    db = db_manager.get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not available."
        )
    return db

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    database = Depends(get_db)
) -> dict:
    """Dependency that decodes, verifies the JWT, and returns the current authenticated user."""
    return auth_manager.get_current_user_dependency(credentials, database)

def get_user_snippets(email: str, database) -> List[dict]:
    """Helper function to retrieve and format all snippets for a user, sorted by updatedAt descending."""
    cursor = database.snippets.find({"userId": email})
    snippets = []
    for doc in cursor:
        snippets.append({
            "id": doc["id"],
            "name": doc["name"],
            "description": doc.get("description", ""),
            "language": doc["language"],
            "code": doc["code"],
            "createdAt": doc.get("createdAt"),
            "updatedAt": doc.get("updatedAt")
        })
    snippets.sort(key=lambda x: x.get("updatedAt", 0), reverse=True)
    return snippets

# --- Pydantic Schemas ---

class UserSignup(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SnippetSchema(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    language: str
    code: str

class DbQuerySchema(BaseModel):
    db_name: str
    collection_name: str
    query: Optional[dict] = Field(default_factory=dict)
    limit: Optional[int] = 50
    skip: Optional[int] = 0

class DbCreateSchema(BaseModel):
    db_name: str
    collection_name: str
    document: dict

class DbUpdateSchema(BaseModel):
    db_name: str
    collection_name: str
    doc_id: str
    document: dict

class DbDeleteSchema(BaseModel):
    db_name: str
    collection_name: str
    doc_id: str

class ProxyRequestSchema(BaseModel):
    url: str
    method: str = "GET"
    headers: Optional[dict] = Field(default_factory=dict)
    body: Optional[str] = ""

# --- API Endpoints ---

@app.get("/")
def read_root():
    """Health check root endpoint."""
    return {"status": "ok", "message": "Zenith IDE Backend is running."}

@app.post("/api/auth/signup")
def signup(user_in: UserSignup, database = Depends(get_db)):
    """User registration endpoint."""
    existing_user = database.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    user_dict = {
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": auth_manager.hash_password(user_in.password),
        "createdAt": int(time.time() * 1000),
        "plan": "free"
    }
    
    database.users.insert_one(user_dict)
    
    access_token = auth_manager.create_access_token(
        data={"sub": user_in.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "ok": True,
        "token": access_token,
        "account": {
            "name": user_dict["name"],
            "email": user_dict["email"],
            "createdAt": user_dict["createdAt"],
            "plan": user_dict["plan"]
        }
    }

@app.post("/api/auth/login")
def login(user_in: UserLogin, database = Depends(get_db)):
    """User authentication and login endpoint."""
    user = database.users.find_one({"email": user_in.email})
    if not user or not auth_manager.verify_password(user_in.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    access_token = auth_manager.create_access_token(
        data={"sub": user["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "ok": True,
        "token": access_token,
        "account": {
            "name": user["name"],
            "email": user["email"],
            "createdAt": user["createdAt"],
            "plan": user["plan"]
        }
    }

@app.get("/api/snippets")
def list_snippets(current_user = Depends(get_current_user), database = Depends(get_db)):
    """Lists all cloud snippets belonging to the authenticated user."""
    return get_user_snippets(current_user["email"], database)

@app.post("/api/snippets")
def save_snippet(
    snippet: SnippetSchema, 
    current_user = Depends(get_current_user), 
    database = Depends(get_db)
):
    """Creates a new snippet or updates an existing one for the authenticated user."""
    t = int(time.time() * 1000)
    
    if snippet.id:
        existing = database.snippets.find_one({"id": snippet.id, "userId": current_user["email"]})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snippet not found or access denied."
            )
            
        update_data = {
            "name": snippet.name,
            "description": snippet.description,
            "language": snippet.language,
            "code": snippet.code,
            "updatedAt": t
        }
        
        database.snippets.update_one(
            {"id": snippet.id, "userId": current_user["email"]},
            {"$set": update_data}
        )
        
    else:
        snip_id = f"snip_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
        new_doc = {
            "id": snip_id,
            "userId": current_user["email"],
            "name": snippet.name,
            "description": snippet.description,
            "language": snippet.language,
            "code": snippet.code,
            "createdAt": t,
            "updatedAt": t
        }
        database.snippets.insert_one(new_doc)

    updated_list = get_user_snippets(current_user["email"], database)
    return {"ok": True, "list": updated_list}

@app.delete("/api/snippets/{snippet_id}")
def delete_snippet(
    snippet_id: str, 
    current_user = Depends(get_current_user), 
    database = Depends(get_db)
):
    """Deletes the specified snippet for the authenticated user."""
    existing = database.snippets.find_one({"id": snippet_id, "userId": current_user["email"]})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snippet not found or access denied."
        )
        
    database.snippets.delete_one({"id": snippet_id, "userId": current_user["email"]})
    
    updated_list = get_user_snippets(current_user["email"], database)
    return {"ok": True, "list": updated_list}

# --- MongoDB Explorer Endpoints ---

@app.get("/api/db/databases")
def get_databases():
    """Retrieves only the active database to prevent cross-db leaks."""
    active_db = db_manager.get_db()
    db_name = active_db.name if active_db else "zenith_ide"
    return {"databases": [db_name]}

@app.get("/api/db/collections/{db_name}")
def get_collections(db_name: str):
    """Retrieves collections for the database, excluding sensitive user collections."""
    active_db = db_manager.get_db()
    active_name = active_db.name if active_db else "zenith_ide"
    if db_name != active_name:
        raise HTTPException(status_code=403, detail="Access to this database is restricted.")
        
    all_cols = db_manager.list_collections(db_name)
    # Hide users collection to prevent exposing user identities and hashes
    filtered_cols = [c for c in all_cols if c != "users"]
    return {"collections": filtered_cols}

@app.post("/api/db/documents")
def get_documents(payload: DbQuerySchema):
    """Queries documents in a collection, validating collection permissions."""
    active_db = db_manager.get_db()
    active_name = active_db.name if active_db else "zenith_ide"
    if payload.db_name != active_name:
        raise HTTPException(status_code=403, detail="Access to this database is restricted.")
    if payload.collection_name == "users":
        raise HTTPException(status_code=403, detail="Access to the 'users' collection is restricted.")
        
    try:
        docs = db_manager.query_documents(
            payload.db_name,
            payload.collection_name,
            payload.query,
            payload.limit,
            payload.skip
        )
        return {"ok": True, "documents": docs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/db/documents/create")
def create_document(payload: DbCreateSchema):
    """Inserts a new document, validating collection permissions."""
    active_db = db_manager.get_db()
    active_name = active_db.name if active_db else "zenith_ide"
    if payload.db_name != active_name:
        raise HTTPException(status_code=403, detail="Access to this database is restricted.")
    if payload.collection_name == "users":
        raise HTTPException(status_code=403, detail="Access to the 'users' collection is restricted.")
        
    try:
        res = db_manager.insert_document(
            payload.db_name,
            payload.collection_name,
            payload.document
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/db/documents/update")
def update_document(payload: DbUpdateSchema):
    """Updates an existing document, validating collection permissions."""
    active_db = db_manager.get_db()
    active_name = active_db.name if active_db else "zenith_ide"
    if payload.db_name != active_name:
        raise HTTPException(status_code=403, detail="Access to this database is restricted.")
    if payload.collection_name == "users":
        raise HTTPException(status_code=403, detail="Access to the 'users' collection is restricted.")
        
    try:
        res = db_manager.update_document(
            payload.db_name,
            payload.collection_name,
            payload.doc_id,
            payload.document
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/db/documents/delete")
def delete_document(payload: DbDeleteSchema):
    """Deletes a document, validating collection permissions."""
    active_db = db_manager.get_db()
    active_name = active_db.name if active_db else "zenith_ide"
    if payload.db_name != active_name:
        raise HTTPException(status_code=403, detail="Access to this database is restricted.")
    if payload.collection_name == "users":
        raise HTTPException(status_code=403, detail="Access to the 'users' collection is restricted.")
        
    try:
        res = db_manager.delete_document(
            payload.db_name,
            payload.collection_name,
            payload.doc_id
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- API Proxy Endpoint ---

@app.post("/api/proxy/request")
def proxy_request(payload: ProxyRequestSchema):
    """
    Sends an HTTP request from the backend to bypass browser CORS restrictions.
    """
    start_time = time.time()
    try:
        method = payload.method.upper()
        # Clean headers: remove Host to prevent issues with backend proxying
        headers = {k: v for k, v in (payload.headers or {}).items() if k.lower() != 'host'}
        
        # Make the request
        resp = requests.request(
            method=method,
            url=payload.url,
            headers=headers,
            data=payload.body.encode('utf-8') if payload.body else None,
            timeout=10.0
        )
        
        duration = int((time.time() - start_time) * 1000)
        
        # Try to parse response body as JSON, fallback to text
        try:
            body_content = resp.json()
        except ValueError:
            body_content = resp.text
            
        return {
            "ok": True,
            "status": resp.status_code,
            "status_text": resp.reason,
            "headers": dict(resp.headers),
            "body": body_content,
            "time_ms": duration,
            "size_bytes": len(resp.content)
        }
    except Exception as e:
        duration = int((time.time() - start_time) * 1000)
        return {
            "ok": False,
            "error": str(e),
            "status": 0,
            "time_ms": duration
        }


# --- RAG Endpoint ---

class RagQuerySchema(BaseModel):
    query: str
    root_path: str
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = None
    model: Optional[str] = None
    max_results: Optional[int] = 5

@app.post("/api/ai/rag/query")
def rag_query(payload: RagQuerySchema):
    """
    Retrieves relevant code blocks from the workspace for RAG.
    Performs query expansion via the LLM, then searches code-blocks.
    """
    from backend.rag_manager import RAGManager, expand_query
    try:
        # 1. Expand query to keywords using LLM
        keywords = expand_query(
            payload.query, 
            payload.provider, 
            payload.api_key, 
            payload.model
        )
        
        # 2. Search workspace
        snippets = RAGManager.search_workspace(
            payload.root_path, 
            keywords, 
            payload.max_results
        )
        
        return {
            "ok": True,
            "keywords": keywords,
            "snippets": snippets
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

