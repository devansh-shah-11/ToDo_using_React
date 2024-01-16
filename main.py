from typing import Union
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware

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


class User(BaseModel):
    name: str
    tasks: dict

@app.post('/users')
async def create_user(name: str):
    db.users.insert_one({'name': name, 'tasks': {}})
    return {"message": f"user {name} created successfully"}

class Task(BaseModel):
    user_id: str
    task: str
    status: bool

@app.post('/tasks')
async def create_task(user_id: str, task: str, status: bool):
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    print(tasks)
    if task in tasks:
        return {"message": f"task {task} already exists"}
    tasks[task] = status
    print(tasks)
    db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} created successfully"}

def fetch_tasks(user_id: str):
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if user:
        user['_id'] = str(user['_id'])
        return user
    raise HTTPException(status_code=404, detail="User not found")

@app.get('/tasks')
async def get_tasks(user_id: str):
    return fetch_tasks(user_id)

@app.put('/tasks/{task}')
async def update_task(user_id: str, task: str, status: bool):
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    tasks[task] = status
    db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} updated successfully"}

@app.delete('/tasks/{task}')
async def delete_task(user_id: str, task: str):
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return {"message": f"user does not exist"}
    tasks = user.get('tasks', {})
    if task not in tasks:
        return {"message": f"task {task} does not exist"}
    del tasks[task]
    db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'tasks': tasks}})
    return {"message": f"task {task} deleted successfully"}