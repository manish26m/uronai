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
    allow_origins=["http://localhost:3000"],
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
        "progress_percentage": doc.get("progress_percentage", 0)
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

class SubjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    progress_percentage: int = 0

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: str

class PlaylistImport(BaseModel):
    title: str
    playlist_url: str

class QuizRequest(BaseModel):
    subject: str

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

@app.post("/quizzes/generate")
def generate_quiz(request: QuizRequest):
    headers = {"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"}
    prompt = f"[INST] Generate exactly 2 multiple choice educational questions about {request.subject}. Return ONLY a raw JSON string (no markdown, no markdown backticks, no comments) matching this exact format: {{\"questions\": [{{\"id\": 1, \"question\": \"string\", \"options\": [\"opt1\", \"opt2\", \"opt3\", \"opt4\"], \"answer\": \"correct_opt\", \"explanation\": \"string\"}}]}} [/INST]"
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 800, "return_full_text": False, "temperature": 0.5}
    }
    
    try:
        res = requests.post("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", headers=headers, json=payload, timeout=15)
        if res.status_code == 200:
            text = res.json()[0]['generated_text'].strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            
            match = re.search(r'\{.*\}', text.strip(), re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                return {"subject": request.subject, "questions": parsed.get("questions", [])}
    except Exception as e:
        print(f"HF Error: {e}")
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
        { "id": 2, "role": "Data Analyst", "readiness": 60, "missing_skills": ["Pandas", "SQL Joins", "Tableau"], "growth_roadmap": "Complete the 'Introduction to Pandas' subject playlist." },
        { "id": 3, "role": "ML Engineer", "readiness": 20, "missing_skills": ["PyTorch", "Calculus", "ML Ops"], "growth_roadmap": "Start with mathematical foundations before approaching Deep Learning." }
    ]

@app.get("/certifications")
def get_certifications(user_id: int = 1):
    return [
        { "id": 1, "provider": "AWS", "name": "AWS Certified Cloud Practitioner", "timeline": "3 weeks", "match": 75 },
        { "id": 2, "provider": "Google", "name": "Google Data Analytics Professional Certificate", "timeline": "2 months", "match": 90 },
        { "id": 3, "provider": "Microsoft", "name": "Azure Fundamentals (AZ-900)", "timeline": "4 weeks", "match": 60 }
    ]
