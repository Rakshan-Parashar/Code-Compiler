import os
import uuid
import time
from typing import List, Optional
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, Security, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

from backend.config import MONGODB_URI, JWT_SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, logger
from backend.db_manager import DatabaseManager
from backend.auth_manager import AuthManager
from backend.collab_manager import CollaborationManager

# Initialize Managers
db_manager = DatabaseManager(MONGODB_URI)
auth_manager = AuthManager(JWT_SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES)
collab_manager = CollaborationManager()

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

# --- WebSocket Collaboration Endpoint ---

@app.websocket("/api/collaboration/{room_id}/{username}")
async def websocket_collaboration(websocket: WebSocket, room_id: str, username: str):
    """Real-time collaboration endpoint."""
    active_users = await collab_manager.connect(room_id, username, websocket)
    
    # Broadcast updated user list to everyone in the room
    await collab_manager.broadcast(room_id, {
        "type": "users",
        "users": active_users
    })
    
    try:
        while True:
            # Wait for messages from this client
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "edit":
                await collab_manager.broadcast(
                    room_id,
                    {
                        "type": "edit",
                        "content": data.get("content"),
                        "username": username
                    },
                    exclude_user=username
                )
            elif msg_type == "cursor":
                await collab_manager.broadcast(
                    room_id,
                    {
                        "type": "cursor",
                        "position": data.get("position"),
                        "username": username
                    },
                    exclude_user=username
                )
    except WebSocketDisconnect:
        active_users = collab_manager.disconnect(room_id, username)
        # Broadcast updated user list
        await collab_manager.broadcast(room_id, {
            "type": "users",
            "users": active_users
        })
