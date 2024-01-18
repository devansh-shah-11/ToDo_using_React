from typing import Union
from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, HTTPException
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
import secrets

mongodb_uri ='mongodb://localhost:27017/'
port = 8000
client = MongoClient(mongodb_uri,port)

db = client["newdatabase"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

class SignupForm(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginForm(BaseModel):
    email: EmailStr
    password: str

class UserLogout(BaseModel):
    session_token: str 

class User(BaseModel):
    name: str
    email: EmailStr
    password: str
    tasks: dict


@app.post("/users/signup")
async def signup(form: SignupForm):
    try:
        user_exists = db.users.find_one({"email": form.email})
        if user_exists:
            return {"message": "User already exists"}
        else:
            if len(form.password) < 3:
                return {"message": "Password must be at least 3 characters long"}
            else:
                db.users.insert_one(form.dict(by_alias=True))
                return {"message": "User created successfully"}
    except Exception as e:
        return {"error": str(e)}


# @app.post('/users/signup')
# async def create_user(name: str, email: EmailStr, password: str):
#     user = User(name=name, email=email, password=password, tasks={})
#     for u in db.users.find():
#         if u['email'] == email:
#             return {"message": "User already exists"}
#     db.users.insert_one(user.dict(by_alias=True))
#     return {"message": "User created successfully"}

@app.post('/users/login')
async def login(form: LoginForm):
    user = db.users.find_one({"email": form.email})
    if not user:
        return {"message": "User does not exist"}
    if user['password'] != form.password:
        return {"message": "Incorrect password"}
    session_token = secrets.token_hex(16)
    db.users.update_one({'email': form.email}, {'$set': {'session_token': session_token}})
    return {"message": "Login successful", "session_token": session_token}

@app.post('/users/logout')
async def logout(user_logout: UserLogout):
    user = db.users.find_one({"session_token": user_logout.session_token})
    if not user:
        return {"message": "User does not exist"}
    db.users.update_one({'session_token': user_logout.session_token}, {'$set': {'session_token': ''}})
    return {"message": "Logout successful"}

# @app.post('/users/login')
# async def login(email: EmailStr, password: str):
#     for u in db.users.find():
#         if u['email'] == email:
#             if u['password'] == password:
#                 return {"message": "Login successful"}
#             else:
#                 return {"message": "Incorrect password"}
#     return {"message": "User does not exist"}

class Task(BaseModel):
    user_id: str
    task: str
    status: bool

@app.post('/tasks')
async def create_task(user_id: str, task: str, status: bool):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    print(tasks)
    if task in tasks:
        return {"message": f"task {task} already exists"}
    tasks[task] = status
    print(tasks)
    db.users.update_one({'session_token': user_id}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} created successfully"}

def fetch_tasks(user_id: str):
    user = db.users.find_one({'session_token': user_id})
    if user:
        return user
    raise HTTPException(status_code=404, detail="User not found")

@app.get('/tasks')
async def get_tasks(user_id: str):
    return fetch_tasks(user_id)

@app.put('/tasks/{task}')
async def update_task(user_id: str, task: str, status: bool):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    tasks[task] = status
    db.users.update_one({'session_token': user_id}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} updated successfully"}

@app.put('/tasks')
async def update_task(user_id: str, task: str, status: bool, newtask: str):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    updated_tasks = {}
    for key in tasks.keys():
        if key == task:
            updated_tasks[newtask] = status
        else:
            updated_tasks[key] = tasks[key]
    db.users.update_one({'session_token': user_id}, {'$set': {'tasks': updated_tasks}})
    return {"message": f"task {task} updated successfully"}

@app.delete('/tasks/{task}')
async def delete_task(user_id: str, task: str):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    del tasks[task]
    db.users.update_one({'session_token': user_id}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} deleted successfully"}