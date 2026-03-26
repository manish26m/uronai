from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from bson.objectid import ObjectId
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os, requests, re, json, uuid
from dotenv import load_dotenv

load_dotenv()
from database import subject_collection, video_collection, db

# ─────────── Config ───────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
YT_API_KEY  = os.getenv("YT_API_KEY", "")
JWT_SECRET  = os.getenv("JWT_SECRET", "super_secret")
JWT_ALGO    = "HS256"
JWT_EXPIRE  = 60 * 24 * 7  # 7 days in minutes
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@uron.ai")
ADMIN_PASS  = os.getenv("ADMIN_PASSWORD", "Wearebro@123")

user_collection = db["users"]

bearer  = HTTPBearer(auto_error=False)

app = FastAPI(title="UronAI API — Next-Gen Adaptive Learning")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ─────────── Helpers ───────────
def hash_password(p: str) -> str:
    # Truncate to 72 bytes if necessary, then hash
    b_pass = p.encode('utf-8')[:72]
    return bcrypt.hashpw(b_pass, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    b_plain = plain.encode('utf-8')[:72]
    return bcrypt.checkpw(b_plain, hashed.encode('utf-8'))

# ─────────── Seed Admin ───────────
def seed_admin():
    if not user_collection.find_one({"email": ADMIN_EMAIL}):
        user_collection.insert_one({
            "email": ADMIN_EMAIL,
            "name": "Admin",
            "hashed_password": hash_password(ADMIN_PASS),
            "role": "admin",
            "avatar": None,
            "created_at": datetime.utcnow().isoformat()
        })
seed_admin()

def create_token(data: dict):
    payload = {**data, "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def parse_user(doc) -> dict:
    return {"id": str(doc["_id"]), "email": doc.get("email",""), "name": doc.get("name",""), "role": doc.get("role","student"), "avatar": doc.get("avatar"), "gemini_api_key": doc.get("gemini_api_key", ""), "created_at": doc.get("created_at","")}

def parse_subject(doc) -> dict:
    return {"id": str(doc["_id"]), "user_id": doc.get("user_id",""), "title": doc.get("title",""), "description": doc.get("description",""), "progress_percentage": doc.get("progress_percentage",0), "nodes": doc.get("nodes",[]), "edges": doc.get("edges",[]), "xp": doc.get("xp",0), "level": doc.get("level",1), "created_at": doc.get("created_at","")}

def generate_gemini_content(prompt: str, user_api_key: str = "", model_name: str = "gemini-1.5-flash") -> str:
    key = user_api_key if user_api_key else GEMINI_API_KEY
    if not key: raise HTTPException(status_code=400, detail="The platform's default AI key is missing. Please add your own Google Gemini API Key in the Settings page to continue.")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts":[{"text": prompt}]}]}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        res_json = response.json()
        return res_json["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.HTTPError as ex:
        err_msg = ex.response.json().get("error", {}).get("message", str(ex))
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {err_msg}")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(ex)}")

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload.get("sub")
        if not uid: raise HTTPException(status_code=401, detail="Invalid token")
        doc = user_collection.find_one({"_id": ObjectId(uid)})
        if not doc: raise HTTPException(status_code=401, detail="User not found")
        return parse_user(doc)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ─────────── Pydantic Models ───────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    avatar: Optional[str] = None

class RoadmapNode(BaseModel):
    id: str
    type: str = "custom"
    title: str
    status: str = "locked"
    score: Optional[int] = None
    position: Optional[dict] = None
    transcript: Optional[str] = None

class RoadmapEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True

class SubjectBase(BaseModel):
    title: str
    description: Optional[str] = ""
    nodes: List[Any] = []
    edges: List[Any] = []
    xp: int = 0
    level: int = 1
    progress_percentage: int = 0

class WizardRequest(BaseModel):
    goal: str
    timeframe: Optional[str] = "4 weeks"
    youtube_url: Optional[str] = None

class QuizRequest(BaseModel):
    subject: str
    transcript: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: str

class ApiKeyRequest(BaseModel):
    api_key: str

# ─────────── ≡ Auth Routes ───────────

@app.get("/")
def root(): return {"message": "UronAI API — Next-Gen Adaptive Learning Platform"}

@app.post("/auth/register")
def register(req: RegisterRequest):
    if user_collection.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {"email": req.email, "name": req.name, "hashed_password": hash_password(req.password), "role": "student", "avatar": None, "created_at": datetime.utcnow().isoformat()}
    result = user_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    token = create_token({"sub": str(result.inserted_id), "role": "student"})
    return {"token": token, "user": parse_user(doc)}

@app.post("/auth/login")
def login(req: LoginRequest):
    doc = user_collection.find_one({"email": req.email})
    if not doc or not verify_password(req.password, doc.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": str(doc["_id"]), "role": doc.get("role", "student")})
    return {"token": token, "user": parse_user(doc)}

@app.post("/auth/google")
def google_auth(req: GoogleAuthRequest):
    doc = user_collection.find_one({"email": req.email})
    if not doc:
        new_doc = {"email": req.email, "name": req.name, "hashed_password": "", "role": "student", "avatar": req.avatar, "gemini_api_key": "", "created_at": datetime.utcnow().isoformat()}
        result = user_collection.insert_one(new_doc)
        new_doc["_id"] = result.inserted_id
        doc = new_doc
    token = create_token({"sub": str(doc["_id"]), "role": doc.get("role","student")})
    return {"token": token, "user": parse_user(doc)}

@app.get("/auth/me")
def me(user=Depends(get_current_user)): return user

@app.post("/auth/api-key")
def save_api_key(req: ApiKeyRequest, user=Depends(get_current_user)):
    user_collection.update_one({"_id": ObjectId(user["id"])}, {"$set": {"gemini_api_key": req.api_key}})
    return {"message": "API Key saved successfully"}

# ─────────── ≡ Admin Routes ───────────

@app.get("/admin/users")
def admin_users(admin=Depends(require_admin)):
    users = []
    for u in user_collection.find({"role": {"$ne": "admin"}}):
        u_data = parse_user(u)
        u_data["subjects"] = [parse_subject(s) for s in subject_collection.find({"user_id": str(u["_id"])})]
        u_data["total_xp"] = sum(s["xp"] for s in u_data["subjects"])
        u_data["missions"] = len(u_data["subjects"])
        users.append(u_data)
    return users

# ─────────── ≡ Subject Routes ───────────

@app.post("/subjects/")
def create_subject(subject: SubjectBase, user=Depends(get_current_user)):
    doc = subject.model_dump()
    doc["user_id"] = user["id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    result = subject_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return parse_subject(doc)

@app.get("/subjects/")
def list_subjects(user=Depends(get_current_user)):
    return [parse_subject(d) for d in subject_collection.find({"user_id": user["id"]})]

@app.get("/subjects/{subject_id}")
def get_subject(subject_id: str, user=Depends(get_current_user)):
    doc = subject_collection.find_one({"_id": ObjectId(subject_id), "user_id": user["id"]})
    if not doc: raise HTTPException(status_code=404, detail="Not found")
    return parse_subject(doc)

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: str, user=Depends(get_current_user)):
    res = subject_collection.delete_one({"_id": ObjectId(subject_id), "user_id": user["id"]})
    if res.deleted_count == 0: raise HTTPException(status_code=404)
    return {"message": "Deleted"}

# ─────────── ≡ Roadmap Generator (Gemini) ───────────

@app.post("/subjects/generate-detailed")
def generate_detailed_roadmap(req: WizardRequest, user=Depends(get_current_user)):
    # 1. Extract YouTube transcript if provided
    transcript_snippet = ""
    if req.youtube_url:
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            vid_id_match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", req.youtube_url)
            if vid_id_match:
                transcript_data = YouTubeTranscriptApi.get_transcript(vid_id_match.group(1))
                full_text = " ".join([t["text"] for t in transcript_data])
                transcript_snippet = full_text[:3000] # Use more text for Gemini!
        except Exception as ex:
            print(f"Transcript error: {ex}")

    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})

    extra = f" Base the roadmap strictly on this YouTube video transcript: {transcript_snippet}" if transcript_snippet else ""
    prompt = f"Create a highly detailed, step-by-step learning roadmap for '{req.goal}', designed to be completed in approximately '{req.timeframe}'. {extra} Output ONLY a raw JSON array of module objects. Format exactly as: [{{\"id\":\"1\",\"title\":\"Module Name\",\"description\":\"...\",\"depends_on\":[]}}]"

    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""))
        text = text.replace("```json", "").replace("```", "").strip()
        s, e = text.find("["), text.rfind("]")
        if s != -1 and e != -1:
            modules = json.loads(text[s:e+1])
            nodes, edges, y = [], [], 0
            for i, m in enumerate(modules):
                nid = str(m.get("id", i + 1))
                nodes.append({"id": nid, "type": "custom", "title": m.get("title", f"Module {nid}"), "description": m.get("description", ""), "status": "active" if i == 0 else "locked", "position": {"x": 300 + (i % 2) * 180, "y": y}, "transcript": transcript_snippet if i == 0 else ""})
                y += 160
                for dep in m.get("depends_on", []):
                    edges.append({"id": f"e{dep}-{nid}", "source": str(dep), "target": nid, "animated": True})
            return {"nodes": nodes, "edges": edges, "title": req.goal}
    except HTTPException:
        raise
    except Exception as ex:
        print(f"Gemini Graph Error: {ex}")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(ex)}")

# ─────────── ≡ Evaluate Node (Adaptive Engine) ───────────

@app.post("/subjects/evaluate-node/{subject_id}/{node_id}")
def evaluate_node(subject_id: str, node_id: str, score: int, user=Depends(get_current_user)):
    doc = subject_collection.find_one({"_id": ObjectId(subject_id), "user_id": user["id"]})
    if not doc: raise HTTPException(status_code=404)
    nodes, edges = doc.get("nodes", []), doc.get("edges", [])
    node = next((n for n in nodes if n["id"] == node_id), None)
    if not node: raise HTTPException(status_code=404)

    node["score"] = score
    xp = doc.get("xp", 0)

    if score < 50:
        node["status"] = "failed"
        xp = max(0, xp - 10)
        # Inject 2 remedial nodes
        r1, r2 = str(uuid.uuid4())[:8], str(uuid.uuid4())[:8]
        last_pos = node.get("position", {"x": 300, "y": 0})
        nodes.append({"id": r1, "type": "custom", "title": f"📖 Review: {node['title']} Fundamentals", "status": "active", "position": {"x": last_pos["x"] - 100, "y": last_pos["y"] + 180}})
        nodes.append({"id": r2, "type": "custom", "title": f"✏️ Practice: {node['title']} Drills", "status": "locked", "position": {"x": last_pos["x"] + 100, "y": last_pos["y"] + 360}})
        edges.append({"id": f"e{node_id}-{r1}", "source": node_id, "target": r1, "animated": True})
        edges.append({"id": f"e{r1}-{r2}", "source": r1, "target": r2, "animated": True})
    else:
        node["status"] = "completed"
        xp += score + (50 if score >= 80 else 0)
        for n in nodes:
            if n["id"] in [e["target"] for e in edges if e["source"] == node_id]:
                n["status"] = "active"

    total = len(nodes)
    completed = len([n for n in nodes if n.get("status") == "completed"])
    progress = int((completed / total) * 100) if total > 0 else 0
    level = max(1, xp // 200 + 1)

    subject_collection.update_one({"_id": ObjectId(subject_id)}, {"$set": {"nodes": nodes, "edges": edges, "xp": xp, "level": level, "progress_percentage": progress}})
    doc.update({"nodes": nodes, "edges": edges, "xp": xp, "level": level, "progress_percentage": progress})
    return parse_subject(doc)

# ─────────── ≡ Quiz (Transcript-Powered) ───────────

@app.post("/quizzes/generate")
def generate_quiz(req: QuizRequest, user=Depends(get_current_user)):
    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})

    if req.transcript:
        context = f"Based strictly on this video transcript: {req.transcript[:2500]}. "
    else:
        context = f"Based on the academic subject '{req.subject}'. "
    
    prompt = f"{context}Generate exactly 4 multiple choice questions to test understanding. Output ONLY a raw JSON array, without markdown. Format: [{{\"id\":1,\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":\"A\",\"explanation\":\"...\"}}]"

    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        text = text.replace("```json", "").replace("```", "").strip()
        s, e = text.find("["), text.rfind("]")
        if s != -1 and e != -1:
            return {"questions": json.loads(text[s:e+1])}
    except HTTPException:
        raise
    except Exception as ex:
        print(f"Quiz error: {ex}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz. Verify Gemini API key.")

# ─────────── ≡ YouTube Transcript ───────────

@app.get("/youtube/transcript")
def get_transcript(video_id: str):
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        data = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([t["text"] for t in data])
        return {"transcript": text, "length": len(text)}
    except Exception as ex:
        return {"transcript": "", "error": str(ex)}

@app.get("/youtube/search")
def search_youtube(q: str):
    try:
        res = requests.get(f"https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q={q}&type=video&key={YT_API_KEY}", timeout=6)
        if res.status_code == 200 and res.json().get("items"):
            item = res.json()["items"][0]
            return {"video_id": item["id"]["videoId"], "title": item["snippet"]["title"], "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"]}
    except Exception:
        pass
    return {"video_id": "kqtD5dpn9C8", "title": "Tutorial", "thumbnail": ""}

# ─────────── ≡ AI Tutor Chat ───────────

@app.post("/mentor/chat")
def mentor_chat(req: ChatRequest, user=Depends(get_current_user)):
    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})

    prompt = f"You are an expert AI tutor. The student is currently studying: '{req.context}'. They say: '{req.message}'. Reply with a concise, encouraging, and clear explanation."
    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        return {"reply": text.strip()}
    except HTTPException:
        raise
    except Exception as ex:
        print(f"Chat error: {ex}")
        raise HTTPException(status_code=500, detail="Chat generation failed.")
