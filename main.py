from typing import Union
from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, HTTPException
import numpy as np
from pymongo import MongoClient
from bson import json_util
import json
from fastapi.middleware.cors import CORSMiddleware
import secrets
from datetime import datetime, timedelta, timezone

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

@app.post('/users/login')
async def login(form: LoginForm):
    user = db.users.find_one({"email": form.email})
    if not user:
        return {"message": "User does not exist"}
    if user['password'] != form.password:
        return {"message": "Incorrect password"}
    session_token = secrets.token_hex(16)
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=20)
    db.users.update_one({'email': form.email}, {'$set': {'session_token': session_token, 'expiration_time': expiration_time}})
    return {"message": "Login successful", "session_token": session_token, "expiration_time": expiration_time}

@app.post('/users/logout')
async def logout(user_logout: UserLogout):
    user = db.users.find_one({"session_token": user_logout.session_token})
    if not user:
        return {"message": "User does not exist"}
    db.users.update_one({'session_token': user_logout.session_token}, {'$set': {'session_token': '', 'expiration_time': ''}})
    return {"message": "Logout successful"}

class Task(BaseModel):
    user_id: str
    task: str
    status: bool
    deadline: datetime

def retrieve_expiration_time(session_token: str):
    user = db.users.find_one({"session_token": session_token})
    if not user:
        return {"message": "User does not exist"}
    return {"message": "User exists", "expiration_time": user['expiration_time']}

@app.get('/token')
def expiration_time(session_token: str):
    return retrieve_expiration_time(session_token)

@app.post('/tasks')
async def create_task(task: Task):
    user = db.users.find_one({'session_token': task.user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    for existing_task in tasks:
        if existing_task == task.task:
            raise HTTPException(status_code=400, detail="Task already exists")
    tasks[task.task] = [task.status, task.deadline]
    db.users.update_one({'session_token': task.user_id}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task.task} created successfully"}

def fetch_tasks(user_id: str):
    user = db.users.find_one({'session_token': user_id})
    if user:
        user_dict = json.loads(json_util.dumps(user))
        return user_dict['tasks']
    raise HTTPException(status_code=404, detail="User not found")

@app.get('/tasks')
async def get_tasks(user_id: str):
    return fetch_tasks(user_id)

# @app.get('/tasks')
# async def get_tasks(user_id: str):
#     return fetch_tasks(user_id)

# To change the status or deadline of a task
@app.put('/tasks/{task}')
async def update_task(user_id: str, task: str, status: bool, deadline: datetime):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', [])
    for t in tasks:
        if t == task:
            tasks[t] = [status, deadline]
            db.users.update_one({'session_token': user_id}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} updated successfully"}

# To change the name or deadline of the task
@app.put('/tasks')
async def update_task(user_id: str, task: str, status: bool, newtask: str, deadline: datetime):
    user = db.users.find_one({'session_token': user_id})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', [])
    updated_tasks = {}
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    for key in tasks.keys():
        if key == task:
            updated_tasks[newtask] = [status, deadline]
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