from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from bson.objectid import ObjectId
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os, requests, re, json, uuid, random, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

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
    # Primary admin from env
    admin = user_collection.find_one({"email": ADMIN_EMAIL})
    if not admin:
        user_collection.insert_one({
            "email": ADMIN_EMAIL, "name": "Admin", "hashed_password": hash_password(ADMIN_PASS),
            "role": "admin", "avatar": None, "created_at": datetime.utcnow().isoformat(), "is_verified": True
        })
    else:
        user_collection.update_one({"_id": admin["_id"]}, {"$set": {"role": "admin"}})
    
    # Also elevate the official Gmail to admin for the user's convenience
    if SMTP_EMAIL:
        user_collection.update_one({"email": SMTP_EMAIL}, {"$set": {"role": "admin"}})

seed_admin()

def send_otp_email(email: str, otp: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"SMTP not configured. OTP for {email} is {otp}")
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = f"UronAI <{SMTP_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = f"{otp} is your UronAI verification code"
        
        body = f"""
        <html>
        <body style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Welcome to UronAI!</h2>
            <p>One more step to start your AI-powered learning journey.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">{otp}</span>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email failed: {e}")
        return False

def create_token(data: dict):
    payload = {**data, "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def parse_user(doc) -> dict:
    return {"id": str(doc["_id"]), "email": doc.get("email",""), "name": doc.get("name",""), "role": doc.get("role","student"), "avatar": doc.get("avatar"), "gemini_api_key": doc.get("gemini_api_key", ""), "created_at": doc.get("created_at","")}

def parse_subject(doc) -> dict:
    return {"id": str(doc["_id"]), "user_id": doc.get("user_id",""), "title": doc.get("title",""), "description": doc.get("description",""), "progress_percentage": doc.get("progress_percentage",0), "nodes": doc.get("nodes",[]), "edges": doc.get("edges",[]), "xp": doc.get("xp",0), "level": doc.get("level",1), "created_at": doc.get("created_at","")}

def generate_gemini_content(prompt: str, user_api_key: str = "", default_model: str = "gemini-pro") -> str:
    key = user_api_key if user_api_key else GEMINI_API_KEY
    if not key: raise HTTPException(status_code=400, detail="The platform's default AI key is missing. Please add your own Google Gemini API Key in the Settings page to continue.")
    
    model_name = default_model
    try:
        models_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
        m_res = requests.get(models_url, timeout=5)
        if m_res.status_code == 200:
            models_data = m_res.json().get("models", [])
            available = [m["name"].replace("models/", "") for m in models_data if "generateContent" in m.get("supportedGenerationMethods", [])]
            if "gemini-1.5-pro" in available:
                model_name = "gemini-1.5-pro"
            elif "gemini-1.5-flash" in available:
                model_name = "gemini-1.5-flash"
            elif available:
                model_name = available[0]
    except Exception:
        pass

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts":[{"text": prompt}]}]}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        res_json = response.json()
        return res_json["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.HTTPError as ex:
        err_msg = ""
        try: err_msg = ex.response.json().get("error", {}).get("message", str(ex))
        except: err_msg = str(ex)
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
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

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
    disable_youtube: bool = False
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
    context: Optional[str] = "General Learning"
    language_pref: Optional[str] = "English"
    enable_yt: bool = True

class ApiKeyRequest(BaseModel):
    api_key: str

# ─────────── ≡ Auth Routes ───────────

@app.get("/")
def root(): return {"message": "UronAI API — Next-Gen Adaptive Learning Platform"}

@app.post("/auth/register")
def register(user: UserRegister):
    existing = user_collection.find_one({"email": user.email})
    if existing:
        if existing.get("is_verified"):
            raise HTTPException(status_code=400, detail="Email already registered")
        # If not verified, overwrite its OTP and resend
    
    otp = str(random.randint(100000, 999999))
    hashed = hash_password(user.password)
    
    user_data = {
        "name": user.name, "email": user.email, "hashed_password": hashed,
        "role": "student", "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.name}",
        "is_verified": False, "otp_code": otp, "otp_expires": datetime.utcnow() + timedelta(minutes=10),
        "created_at": datetime.utcnow().isoformat()
    }
    
    if existing:
        user_collection.update_one({"email": user.email}, {"$set": user_data})
    else:
        user_collection.insert_one(user_data)
    
    send_otp_email(user.email, otp)
    return {"message": "Verification code sent to email", "status": "verify_email"}

@app.post("/auth/verify-email")
def verify_email(req: VerifyEmailRequest):
    user = user_collection.find_one({"email": req.email})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("otp_code") == req.otp:
        if datetime.utcnow() > user.get("otp_expires", datetime.min):
            raise HTTPException(status_code=400, detail="OTP expired")
        
        user_collection.update_one({"_id": user["_id"]}, {"$set": {"is_verified": True}, "$unset": {"otp_code": "", "otp_expires": ""}})
        token = create_token({"sub": str(user["_id"]), "role": user.get("role", "student")})
        return {"token": token, "user": parse_user(user)}
    
    raise HTTPException(status_code=400, detail="Invalid verification code")

@app.post("/auth/resend-otp")
def resend_otp(email: EmailStr):
    user = user_collection.find_one({"email": email})
    if not user or user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Cannot resend OTP")
    
    otp = str(random.randint(100000, 999999))
    user_collection.update_one({"_id": user["_id"]}, {"$set": {"otp_code": otp, "otp_expires": datetime.utcnow() + timedelta(minutes=10)}})
    send_otp_email(email, otp)
    return {"message": "New verification code sent"}

@app.post("/auth/login")
def login(user: UserLogin):
    db_user = user_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")
    if not verify_password(user.password, db_user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    
    if not db_user.get("is_verified", True) and db_user.get("role") != "admin":
        return {"status": "verify_email", "message": "Please verify your email"}

    token = create_token({"sub": str(db_user["_id"]), "role": db_user.get("role", "student")})
    return {"token": token, "user": parse_user(db_user)}

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
    vid_id = ""
    playlist_videos = []
    
    if req.youtube_url:
        plist_match = re.search(r"[?&]list=([a-zA-Z0-9_-]+)", req.youtube_url)
        vid_id_match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", req.youtube_url)
        
        if plist_match:
            try:
                res = requests.get(f"https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=250&playlistId={plist_match.group(1)}&key={YT_API_KEY}", timeout=10)
                if res.status_code == 200:
                    for item in res.json().get("items", []):
                        try:
                            playlist_videos.append({
                                "id": item["snippet"]["resourceId"]["videoId"],
                                "title": item["snippet"]["title"]
                            })
                        except: pass
            except: pass
            
        if vid_id_match and not playlist_videos:
            vid_id = vid_id_match.group(1)
            try:
                from youtube_transcript_api import YouTubeTranscriptApi
                transcript_data = YouTubeTranscriptApi.get_transcript(vid_id)
                full_text = " ".join([t["text"] for t in transcript_data])
                transcript_snippet = full_text[:6000]
            except Exception as ex:
                print(f"Transcript error: {ex}")

    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})

    extra = ""
    if playlist_videos:
        v_list = "\n".join([f"- {v['title']}" for v in playlist_videos])
        extra = f" Base the roadmap strictly and exclusively on this exact YouTube Playlist. You MUST create exactly one chronological module per video in the exact order listed below to construct a curriculum. Do not hallucinate external topics. Playlist Videos:\n{v_list}"
    elif transcript_snippet:
        extra = f" Base the roadmap strictly and exclusively on this YouTube video transcript. Mirror its chapters and sections exactly without hallucinating external topics: {transcript_snippet}"
    
    prompt = (
        f"Create a highly detailed, comprehensive learning roadmap for '{req.goal}'. The timeframe is '{req.timeframe}'. "
        f"YOU MUST ORGANIZE THIS INTO A STRICT TIMETABLE (e.g. prefix module titles with 'Week 1:', 'Day 1:', etc., evenly distributed). "
        f"{extra}\n"
        "FOR LARGE PLAYLISTS: You MUST generate exactly ONE module for EVERY video listed. Do not skip any. "
        "Output ONLY a raw JSON array of sequential module objects. "
        "Format exactly as: [{\"id\":\"1\",\"title\":\"Week 1: Module Name\",\"description\":\"...\"}]"
    )

    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        text = text.replace("```json", "").replace("```", "").strip()
        s, e = text.find("["), text.rfind("]")
        if s != -1 and e != -1:
            modules = json.loads(text[s:e+1])
            nodes, edges, y = [], [], 0
            for i, m in enumerate(modules):
                nid = str(m.get("id", i + 1))
                node_vid = playlist_videos[i]["id"] if (playlist_videos and i < len(playlist_videos)) else vid_id
                
                # Straight vertical center-aligned modern path (like Duolingo)
                nodes.append({"id": nid, "type": "custom", "title": m.get("title", f"Module {nid}"), "description": m.get("description", ""), "status": "active" if i == 0 else "locked", "position": {"x": 400, "y": i * 160}, "transcript": transcript_snippet, "video_id": node_vid})
                if i > 0:
                    # Sequential edges mapping straight down
                    prev_id = str(modules[i-1].get("id", i))
                    edges.append({"id": f"e{prev_id}-{nid}", "source": prev_id, "target": nid, "animated": True})
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
        context = f"You are a strict academic evaluator. Based STRICTLY on this specific video transcript and nothing else: {req.transcript[:5500]}. "
    else:
        context = f"You are a strict academic evaluator. Based on the concept of '{req.subject}'. "
    
    prompt = f"{context}Generate exactly 4 extremely specific multiple choice questions. The questions must test unique facts explicitly mentioned in the text provided. Output ONLY a raw JSON array. Format: [{{\"id\":1,\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":\"A\",\"explanation\":\"...\"}}]"

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

# ─────────── ≡ AI Mentor (Interactive Coach) ───────────

@app.post("/mentor/intro")
def mentor_intro(user=Depends(get_current_user)):
    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})
    # Find latest mission to set context
    latest = subject_collection.find_one({"user_id": user["id"]}, sort=[("created_at", -1)])
    goal = latest["title"] if latest else "their learning journey"
    
    prompt = f"You are a world-class AI Mentor and Coach. A student named {user['name']} has just entered your office. They are currently working on mastering '{goal}'. Greet them warmly as their mentor in this field. Ask if they have any specific language preferences for your guidance, and ask what's on their mind today regarding their studies. keep it concise and encouraging."
    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        return {"reply": text.strip()}
    except Exception:
        return {"reply": f"Hello {user['name']}! I am your AI Mentor. I see you are working on '{goal}'. How can I help you excel today?"}

@app.post("/mentor/chat")
def mentor_chat(req: ChatRequest, user=Depends(get_current_user)):
    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})
    
    yt_instruction = "If appropriate and helpful, you may suggest one high-quality YouTube search query or a specific tutorial topic they should look up. Format it as 'Recommended search: [Topic]'." if req.enable_yt else "Do not suggest any external video links."
    
    prompt = f"""You are an expert AI Mentor and specialized Coach in the field of '{req.context}'. 
The student ({user['name']}) says: '{req.message}'.
Your guidelines:
1. Provide a professional, encouraging, and highly educational response.
2. Use {req.language_pref} for your primary explanation.
3. Act as a senior mentor who truly wants the student to succeed.
4. {yt_instruction}
5. Keep the response clear, structured, and focused on the student's growth."""

    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        return {"reply": text.strip()}
    except HTTPException:
        raise
    except Exception as ex:
        print(f"Chat error: {ex}")
        raise HTTPException(status_code=500, detail="Mentor is temporarily unavailable.")

# ─────────── ≡ Career & Certification Engine ───────────

@app.get("/careers/matching")
def career_matching(user=Depends(get_current_user)):
    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})
    subjects = list(subject_collection.find({"user_id": user["id"]}))
    
    context = ""
    for s in subjects:
        comp = len([n for n in s.get("nodes", []) if n.get("status") == "completed"])
        context += f"Subject: {s['title']}, Modules Completed: {comp}/{len(s.get('nodes',[]))}, Progress: {s.get('progress_percentage')}%.\n"
    
    prompt = f"Based on the following learning progress for user {user['name']}, suggest exactly 3 real-world job roles they are becoming ready for. For each, provide a 'readiness' percentage, 'missing_skills' list, and a 'growth_roadmap' advice string. Output ONLY raw JSON array: [{{ \"id\": 1, \"role\": \"...\", \"readiness\": 85, \"missing_skills\": [\"...\"], \"growth_roadmap\": \"...\" }}]. User Data:\n{context}"
    
    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        text = text.replace("```json", "").replace("```", "").strip()
        s, e = text.find("["), text.rfind("]")
        if s != -1 and e != -1:
            return json.loads(text[s:e+1])
    except: pass
    return []

@app.get("/certifications")
def certifications_matching(user=Depends(get_current_user)):
    db_user = user_collection.find_one({"_id": ObjectId(user["id"])})
    subjects = list(subject_collection.find({"user_id": user["id"]}))
    
    context = ", ".join([s['title'] for s in subjects])
    prompt = f"Based on these subjects the user is mastering: {context}. Suggest 3 relevant industry certifications (AWS, Google, Microsoft, etc.). For each include: 'provider', 'name', 'timeline' estimation, and 'match' percentage. Output ONLY raw JSON: [{{ \"id\": 1, \"provider\": \"...\", \"name\": \"...\", \"timeline\": \"...\", \"match\": 80 }}]"
    
    try:
        text = generate_gemini_content(prompt, db_user.get("gemini_api_key", ""), "gemini-pro")
        text = text.replace("```json", "").replace("```", "").strip()
        s, e = text.find("["), text.rfind("]")
        if s != -1 and e != -1:
            return json.loads(text[s:e+1])
    except: pass
    return []

