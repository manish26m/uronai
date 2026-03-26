from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from bson.objectid import ObjectId
import os
import requests
import re
import json
from dotenv import load_dotenv

load_dotenv()

from database import subject_collection, video_collection

# API Keys
HF_API_KEY = os.getenv("HF_API_KEY")
YT_API_KEY = os.getenv("YT_API_KEY")

app = FastAPI(title="AI Learning OS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Helper Functions ---------
def parse_subject(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "description": doc.get("description"),
        "progress_percentage": doc.get("progress_percentage", 0),
        "nodes": doc.get("nodes", []),
        "edges": doc.get("edges", []),
        "xp": doc.get("xp", 0),
        "level": doc.get("level", 1)
    }

def parse_video(doc):
    return {
        "id": str(doc["_id"]),
        "subject_id": str(doc["subject_id"]),
        "title": doc.get("title", ""),
        "url": doc.get("url", ""),
        "completed": doc.get("completed", False)
    }

# --------- Pydantic Models ---------
class VideoBase(BaseModel):
    title: str
    url: str
    completed: bool = False

class Video(VideoBase):
    id: str
    subject_id: str

class RoadmapNode(BaseModel):
    id: str
    type: str = "learning"
    title: str
    status: str = "locked"
    score: Optional[int] = None
    url: Optional[str] = None
    
class RoadmapEdge(BaseModel):
    id: str
    source: str
    target: str

class SubjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    progress_percentage: int = 0
    nodes: List[RoadmapNode] = []
    edges: List[RoadmapEdge] = []
    xp: int = 0
    level: int = 1

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: str

class PlaylistImport(BaseModel):
    title: str
    playlist_url: str

class FlowRequest(BaseModel):
    topic: str
    
class QuizRequest(BaseModel):
    subject: str

class ChatRequest(BaseModel):
    message: str
    context: str

# --------- Routes ---------
@app.get("/")
def read_root():
    return {"message": "Welcome to AI Learning OS API (MongoDB Powered)"}

@app.post("/subjects/", response_model=Subject)
def create_subject(subject: SubjectCreate):
    new_doc = subject.model_dump()
    result = subject_collection.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id
    return parse_subject(new_doc)

@app.get("/subjects/", response_model=List[Subject])
def read_subjects(skip: int = 0, limit: int = 100):
    cursor = subject_collection.find().skip(skip).limit(limit)
    return [parse_subject(doc) for doc in cursor]

@app.get("/subjects/{subject_id}", response_model=Subject)
def read_subject(subject_id: str):
    doc = subject_collection.find_one({"_id": ObjectId(subject_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Subject not found")
    return parse_subject(doc)

@app.post("/subjects/import-playlist", response_model=Subject)
def import_playlist(data: PlaylistImport):
    match = re.search(r'list=([\w-]+)', data.playlist_url)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid YouTube playlist URL")
    
    playlist_id = match.group(1)
    
    yt_res = requests.get(f"https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId={playlist_id}&key={YT_API_KEY}")
    if yt_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch playlist from YouTube")
        
    yt_data = yt_res.json()
    items = yt_data.get("items", [])
    
    if not items:
        raise HTTPException(status_code=400, detail="Playlist is empty or private")
    
    new_sub = {"title": data.title, "description": "Imported from YouTube Playlist", "progress_percentage": 0}
    result = subject_collection.insert_one(new_sub)
    subject_id_str = str(result.inserted_id)
    new_sub["_id"] = result.inserted_id
    
    videos_to_insert = []
    for item in items:
        snippet = item.get("snippet", {})
        vid_title = snippet.get("title", "Unknown Title")
        vid_id = snippet.get("resourceId", {}).get("videoId", "")
        
        if vid_id and vid_title != "Private video":
            videos_to_insert.append({
                "subject_id": subject_id_str, # Store as string constraint for PyMongo relational match
                "title": vid_title,
                "url": f"https://youtube.com/watch?v={vid_id}",
                "completed": False
            })
            
    if videos_to_insert:
        video_collection.insert_many(videos_to_insert)
        
    return parse_subject(new_sub)

@app.post("/subjects/{subject_id}/videos/", response_model=Video)
def add_video_to_subject(subject_id: str, video: VideoBase):
    doc = subject_collection.find_one({"_id": ObjectId(subject_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    new_vid = video.model_dump()
    new_vid["subject_id"] = subject_id
    result = video_collection.insert_one(new_vid)
    new_vid["_id"] = result.inserted_id
    return parse_video(new_vid)

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: str):
    res = subject_collection.delete_one({"_id": ObjectId(subject_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404)
    return {"message": "Deleted"}

@app.get("/subjects/{subject_id}/videos/", response_model=List[Video])
def get_subject_videos(subject_id: str):
    cursor = video_collection.find({"subject_id": subject_id})
    return [parse_video(doc) for doc in cursor]

@app.put("/videos/{video_id}/complete", response_model=Video)
def mark_video_complete(video_id: str, completed: bool):
    doc = video_collection.find_one({"_id": ObjectId(video_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
        
    video_collection.update_one({"_id": ObjectId(video_id)}, {"$set": {"completed": completed}})
    doc["completed"] = completed
    
    # Recalculate progress using count_documents
    sub_id = doc["subject_id"]
    total = video_collection.count_documents({"subject_id": sub_id})
    completed_count = video_collection.count_documents({"subject_id": sub_id, "completed": True})
    
    if total > 0:
        new_prog = int((completed_count / total) * 100)
        subject_collection.update_one({"_id": ObjectId(sub_id)}, {"$set": {"progress_percentage": new_prog}})
        
    return parse_video(doc)

@app.post("/subjects/generate-flow")
def generate_flow(request: FlowRequest):
    headers = {"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"}
    prompt = f"[INST] You are an expert AI Curriculum architect. Create a 4-step learning roadmap for {request.topic}. Strictly output raw JSON with a 'modules' array. Each module must have 'id' (string '1', '2', etc), 'title', and 'depends_on' (array of parent string ids). No other text. [/INST]"
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 800, "return_full_text": False, "temperature": 0.4}
    }
    
    try:
        res = requests.post("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", headers=headers, json=payload, timeout=20)
        if res.status_code == 200:
            text = res.json()[0]['generated_text'].strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            
            match = re.search(r'\{.*\}', text.strip(), re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                modules = data.get("modules", [])
                
                nodes = []
                edges = []
                y_pos = 0
                for idx, m in enumerate(modules):
                    node_id = str(m.get("id", idx+1))
                    nodes.append({
                        "id": node_id,
                        "type": "custom",
                        "position": {"x": 350 + (idx % 2 * 100), "y": y_pos},
                        "data": {"label": m.get("title", f"Module {node_id}"), "isRoot": idx == 0}
                    })
                    y_pos += 150
                    
                    for dep in m.get("depends_on", []):
                        edges.append({
                            "id": f"e{dep}-{node_id}",
                            "source": str(dep),
                            "target": node_id,
                            "animated": True
                        })
                return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"HF Flow Error: {e}")
        pass

    # Fallback mock
    return {
        "nodes": [
            {"id": "1", "type": "custom", "position": {"x": 350, "y": 0}, "data": {"label": f"Introduction to {request.topic}", "isRoot": True}},
            {"id": "2", "type": "custom", "position": {"x": 250, "y": 150}, "data": {"label": "Core Fundamentals", "isRoot": False}},
            {"id": "3", "type": "custom", "position": {"x": 450, "y": 150}, "data": {"label": "Advanced Techniques", "isRoot": False}}
        ],
        "edges": [
            {"id": "e1-2", "source": "1", "target": "2", "animated": True},
            {"id": "e1-3", "source": "1", "target": "3", "animated": True}
        ]
    }

@app.post("/subjects/evaluate-node/{subject_id}/{node_id}")
def evaluate_node(subject_id: str, node_id: str, score: int):
    doc = subject_collection.find_one({"_id": ObjectId(subject_id)})
    if not doc: raise HTTPException(status_code=404)
    
    nodes = doc.get("nodes", [])
    edges = doc.get("edges", [])
    
    current_node = next((n for n in nodes if n["id"] == node_id), None)
    if not current_node: raise HTTPException(status_code=404)
    
    current_node["score"] = score
    doc["xp"] = doc.get("xp", 0) + score
    
    if score < 50:
        current_node["status"] = "failed"
        
        # Graph Restructuring: Intelligent AI Sub-Topic Injection
        import uuid
        new_node_1_id = str(uuid.uuid4())[:8]
        new_node_2_id = str(uuid.uuid4())[:8]
        
        nodes.append({
            "id": new_node_1_id,
            "type": "assessment",
            "title": f"Review: {current_node['title']} Fundamentals",
            "status": "active"
        })
        nodes.append({
            "id": new_node_2_id,
            "type": "learning",
            "title": f"Practice Drill: {current_node['title']}",
            "status": "locked"
        })
        
        # Connect current node -> review -> drill -> continue
        edges.append({"id": f"e-{node_id}-{new_node_1_id}", "source": node_id, "target": new_node_1_id})
        edges.append({"id": f"e-{new_node_1_id}-{new_node_2_id}", "source": new_node_1_id, "target": new_node_2_id})
        
        doc["xp"] -= 10 # small penalty
    elif score >= 80:
        current_node["status"] = "completed"
        doc["xp"] += 50 
        
        children_ids = [e["target"] for e in edges if e["source"] == node_id]
        for n in nodes:
            if n["id"] in children_ids:
                n["status"] = "active"
    else:
        current_node["status"] = "completed"
        children_ids = [e["target"] for e in edges if e["source"] == node_id]
        for n in nodes:
            if n["id"] in children_ids:
                n["status"] = "active"
                
    total = len(nodes)
    comp = len([n for n in nodes if n["status"] == "completed"])
    doc["progress_percentage"] = int((comp / total) * 100) if total > 0 else 0
    
    subject_collection.update_one(
        {"_id": ObjectId(subject_id)}, 
        {"$set": {
            "nodes": nodes, 
            "edges": edges, 
            "xp": max(0, doc["xp"]), 
            "progress_percentage": doc["progress_percentage"]
        }}
    )
    
    return parse_subject(doc)

@app.post("/quizzes/generate")
def generate_quiz(request: QuizRequest):
    headers = {"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"}
    prompt = f"[INST] Generate exactly 2 multiple choice educational questions about {request.subject}. You MUST output strictly a JSON Array of exactly 2 objects. Do NOT use markdown. Do NOT use code blocks. Just output the raw array starting with [ and ending with ]. Example: [{{\"id\": 1, \"question\": \"What?\", \"options\": [\"opt1\", \"opt2\", \"opt3\", \"opt4\"], \"answer\": \"opt1\", \"explanation\": \"Because\"}}] [/INST]"
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 800, "return_full_text": False, "temperature": 0.3}
    }
    
    try:
        res = requests.post("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", headers=headers, json=payload, timeout=15)
        if res.status_code == 200:
            text = res.json()[0]['generated_text'].strip()
            
            # Extract array from Mistral's unpredictable output
            start_idx = text.find('[')
            end_idx = text.rfind(']')
            if start_idx != -1 and end_idx != -1:
                clean_json = text[start_idx:end_idx+1]
                parsed = json.loads(clean_json)
                return {"subject": request.subject, "questions": parsed}
    except Exception as e:
        print(f"HF Quiz Error: {e}")
        pass

    return {
        "subject": request.subject,
        "questions": [
            {
                "id": 1,
                "question": f"What is the main advantage of using {request.subject}?",
                "options": ["Speed", "Flexibility", "Security", "All of the above"],
                "answer": "All of the above",
                "explanation": f"{request.subject} is known for providing an encompassing set of features."
            },
            {
                "id": 2,
                "question": "Which concept represents the core foundation of this topic?",
                "options": ["Modularity", "Coupling", "Hardcoding", "Repetition"],
                "answer": "Modularity",
                "explanation": "Modularity allows code to be reusable and cleaner."
            }
        ]
    }

@app.get("/mentor/advice")
def get_mentor_advice(user_id: int = 1):
    return {
        "daily_plan": ["Review Python OOP (45 mins)", "Complete React Hooks (60 mins)", "SQL Joins Quiz (15 mins)"],
        "weakness_detection": "You are weak in Object-Oriented Programming (OOP). Practice classes and inheritance before moving ahead.",
        "next_step": "Take the OOP fundamentals quiz."
    }

@app.get("/careers/matching")
def get_career_matches(user_id: int = 1):
    return [
        { "id": 1, "role": "Python Developer", "readiness": 85, "missing_skills": ["FastAPI", "Docker"], "growth_roadmap": "Focus on backend fundamentals and containerization." },
        { "id": 2, "role": "AI Engineer", "readiness": 40, "missing_skills": ["Machine Learning", "PyTorch"], "growth_roadmap": "Complete the ML and Deep Learning modules." },
        { "id": 3, "role": "ML Engineer", "readiness": 20, "missing_skills": ["PyTorch", "Calculus", "ML Ops"], "growth_roadmap": "Start with mathematical foundations before approaching Deep Learning." }
    ]

@app.get("/youtube/search")
def search_youtube(q: str):
    try:
        res = requests.get(f"https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q={q}&type=video&key={YT_API_KEY}", timeout=5)
        if res.status_code == 200 and res.json().get("items"):
            return {"video_id": res.json()["items"][0]["id"]["videoId"]}
    except Exception:
        pass
    return {"video_id": "kqtD5dpn9C8"} # Fallback

@app.post("/mentor/chat")
def mentor_chat(req: ChatRequest):
    headers = {"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"}
    prompt = f"[INST] You are an expert AI tutor helping a student deeply understand a specific topic. The student is currently studying the module: '{req.context}'. The student asks: '{req.message}'. Explain it simply, directly, and concisely in 1 to 2 short paragraphs without any external links or markdown formatting. [/INST]"
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 300, "temperature": 0.4}}
    try:
        res = requests.post("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            text = res.json()[0]['generated_text'].strip()
            if "[/INST]" in text:
                text = text.split("[/INST]")[-1].strip()
            return {"reply": text}
    except Exception:
        pass
    return {"reply": "I'm currently experiencing high API latency with Hugging Face. Please consult the embedded video content above, or try asking your question again shortly!"}

@app.get("/certifications")
def get_certifications(user_id: int = 1):
    return [
        { "id": 1, "provider": "AWS", "name": "AWS Certified Cloud Practitioner", "timeline": "3 weeks", "match": 75 },
        { "id": 2, "provider": "Google", "name": "Google Data Analytics Professional Certificate", "timeline": "2 months", "match": 90 },
        { "id": 3, "provider": "Microsoft", "name": "Azure Fundamentals (AZ-900)", "timeline": "4 weeks", "match": 60 }
    ]
