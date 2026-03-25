from pymongo import MongoClient
import os

MONGO_URI = "mongodb+srv://manishm26:12308512@uron.kk2bcr8.mongodb.net/?appName=uron&tls=true"
client = MongoClient(MONGO_URI)
db = client.uron_db

subject_collection = db["subjects"]
video_collection = db["videos"]
