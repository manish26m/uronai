import os
from pymongo import MongoClient
import google.generativeai as genai

client = MongoClient("mongodb+srv://manish26m2004:Wearebro%40123learning@learning-os.lq8b2.mongodb.net/?retryWrites=true&w=majority&appName=Learning-os")
db = client["uronai"]
users = db["users"]

for u in users.find():
    if u.get("gemini_api_key"):
        print("Testing key for:", u["email"])
        key = u["gemini_api_key"]
        
        try:
            genai.configure(api_key=key)
            print("Available Models:")
            for m in genai.list_models():
                if "generateContent" in m.supported_generation_methods:
                    print(m.name)
            
            print("\nAttempting 1.5 flash:")
            model = genai.GenerativeModel("gemini-1.5-flash")
            print(model.generate_content("Hello!").text)
        except Exception as e:
            print("ERROR", e)
