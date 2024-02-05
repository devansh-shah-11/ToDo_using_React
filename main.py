from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, HTTPException, Depends, status
from passlib.context import CryptContext
import numpy as np
from pymongo import MongoClient
import json
import jwt
from fastapi.middleware.cors import CORSMiddleware
import secrets
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

mongodb_uri ='mongodb://localhost:27017/'
port = 8000
client = MongoClient(mongodb_uri,port)

db = client["newdatabase"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'https://included-vastly-mite.ngrok-free.app'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# Loading the secret key from .env file
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

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

class FBLogin(BaseModel):
    accessToken: str
    email: str
    name: str


def create_access_token(data:dict):
    to_encode = data.copy()
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str):
    try:
        print("hello")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(payload)
        # user = db.users.find_one({"email": payload.get("email")})
        email: str = payload.get("email")
        print(email)
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.users.find_one({"email": email})
        return user
    except:
        return None

# for signing up the user
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
                hashed_password = CryptContext(schemes=["bcrypt"]).hash(form.password)
                form.password = hashed_password
                db.users.insert_one(form.dict(by_alias=True))
                return {"message": "User created successfully"}
    except Exception as e:
        return {"error": str(e)}

# for logging in the user using Account Credentials
@app.post('/users/login')
async def login(form: LoginForm):
    user = db.users.find_one({"email": form.email})
    if not user:
        return {"message": "User does not exist"}
    password_context = CryptContext(schemes=["bcrypt"])
    if not password_context.verify(form.password, user['password']):
        return {"message": "Incorrect password"}
    # session_token = secrets.token_hex(16) # for generating random session token
    session_token = create_access_token(form.dict(by_alias=True))
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=20)
    db.users.update_one({'email': form.email}, {'$set': {'session_token': session_token, 'expiration_time': expiration_time}})
    return {"message": "Login successful", "session_token": session_token, "expiration_time": expiration_time}

# for logging in user via facebook
@app.post('/users/facebooklogin')
async def facebooklogin(form: FBLogin):
    print(form)
    user = db.users.find_one({"email": form.email})
    print(user)
    # session_token = secrets.token_hex(16)
    session_token = create_access_token(form.dict(by_alias=True))
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=60)
    if user:
        db.users.update_one({'email': form.email}, {'$set': {'session_token': session_token, 'expiration_time': expiration_time}})
    else:
        db.users.insert_one({"name": form.name, "email": form.email, "session_token": session_token, "expiration_time": expiration_time})
    return {"message": "Login successful", "session_token": session_token, "expiration_time": expiration_time}

@app.get("/users/me/")
async def read_users_me(current_user: str = Depends(get_current_user)):
    return current_user

# for logging out user
@app.post('/users/logout')
async def logout(current_user: str = Depends(get_current_user)):
    db.users.update_one({'email': current_user['email']}, {'$set': {'session_token': '', 'expiration_time': ''}})
    return {"message": "Logout successful"}

class Task(BaseModel):
    task: str
    newTask: Optional[str] = None
    status: bool
    deadline: str

# retrieving expiry time
def retrieve_expiration_time(current_user: str = Depends(get_current_user)):
    user = db.users.find_one({"email": current_user['email']})
    if not user:
        return {"message": "User does not exist"}
    return {"message": "User exists", "expiration_time": user['expiration_time']}

@app.get('/token')
async def get_token(current_user: str = Depends(get_current_user)):
    return retrieve_expiration_time(current_user)

# for creating new task
@app.post('/tasks')
async def create_task(task: Task, current_user: str = Depends(get_current_user)):
    user = db.users.find_one({'email': current_user['email']})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    for existing_task in tasks:
        if existing_task == task.task:
            raise HTTPException(status_code=400, detail="Task already exists")
    tasks[task.task] = [task.status, task.deadline]
    db.users.update_one({'email': current_user['email']}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task.task} created successfully"}

# fetching the existing tasks
def fetch_tasks(current_user: str = Depends(get_current_user)):
    user = db.users.find_one({'email': current_user['email']})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    return tasks

@app.get('/tasks')
async def get_tasks(current_user: str = Depends(get_current_user)):
    return fetch_tasks(current_user)

@app.put('/tasks')
async def update_task(task: Task, current_user: str = Depends(get_current_user)):
    user = db.users.find_one({'email': current_user['email']})
    print(user, current_user['email'])
    if not user:
        return {"message": f"user does not exist"}
    print("Now fetching tasks")
    tasks = user.get('tasks', {})
    if task.task in tasks:
        if task.newTask:
            tasks[task.newTask] = tasks.pop(task.task)
        else:
            tasks[task.task] = [task.status, task.deadline]
        db.users.update_one({'email': current_user['email']}, {'$set': {'tasks': tasks}})
        return {"message": f"task {task.task} updated successfully"}
    return {"message": f"task {task.task} not found"}

# To change the name or deadline of the task
# @app.put('/tasks')
# async def update_task(task: str, newtask: str, deadline: datetime, current_user: str = Depends(get_current_user)):
#     user = db.users.find_one({'email': current_user['email']})
#     if not user:
#         return {"message": f"user does not exist"}
#     tasks = user.get('tasks', [])
#     updated_tasks = {}
#     if task not in tasks:
#         return {"message": f"task {task} does not exist"}
#     for key in tasks.keys():
#         if key == task:
#             updated_tasks[newtask] = tasks[key]
#         else:
#             updated_tasks[key] = tasks[key]
#     db.users.update_one({'email': current_user['email']}, {'$set': {'tasks': updated_tasks}})
#     return {"message": f"task {task} updated successfully"}

#Deleting a task
@app.delete('/tasks/{task}')
async def delete_task(task: str, current_user: str = Depends(get_current_user)):
    user = db.users.find_one({'email': current_user['email']})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    del tasks[task]
    db.users.update_one({'email': current_user['email']}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} deleted successfully"}

# Fetching tasks by date
def find_task_date(user_id: str, date: datetime):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    tasks_by_date = {}
    for task in tasks:
        if tasks[task][1].strftime("%d-%m-%Y") == date:
            tasks_by_date[task] = tasks[task][0]
    return tasks_by_date

@app.get('/tasks/{date}')
async def get_tasks_by_date(user_id: str, date: str):
    return find_task_date(user_id, date)