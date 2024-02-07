const express = require('express')
const { MongoClient, ObjectId } = require('mongodb');

const app = express()
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json())

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const port = 8000;

const mongodb_uri ='mongodb://localhost:27017/';
const client = new MongoClient(mongodb_uri);

// load environment variables
require('dotenv').config();

client.connect().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

const db = client.db('newdatabase');
const collection = db.collection('users');

// handle signup
app.post('/signup', async (req, res) => {
    user = req.query;
    if (!user.name){
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!user.email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    // check if email is valid
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(user.email)) {
        return res.status(400).json({ message: 'Email is invalid' });
    }

    const existingUser = await collection.findOne({ email: user.email });

    if (existingUser) {
        return res.status(400).json({ message: 'User already exists! Please login' });
    }

    if (!user.password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    // if (user.password.length < 8 || user.password.specialCharacter<1 || user.password.digit<1 || user.password.uppercase<1 || user.password.lowercase<1) {
    //     return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one special character, one digit, one uppercase letter, and one lowercase letter' });    
    // }

    encryptedUserPassword = await bcrypt.hash(user.password, 10);
    user.password = encryptedUserPassword;

    res.json({ message: 'Signup successful' });

    collection.insertOne(user).then(result => {
        console.log(result);
    }).catch(err => {
        console.error('Error inserting user', err);
    });
});

// handle login
app.post('/login', async (req, res) => {
    console.log(req.body.params);
    user = req.body.params;
    console.log(user);
    if (!user.email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    if (!user.password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    const existingUser = await collection.findOne({ email: user.email });
    console.log(existingUser);
    if (existingUser && await (bcrypt.compare(user.password, existingUser.password))) {
        const token = jwt.sign({ email: user.email, name: existingUser.name }, process.env.TOKEN_KEY, { expiresIn: '12h' });
        // user.token = token;
        console.log(token);
        collection.updateOne({ email: user.email }, { $set: { session_token: token } }).then(result => {
            console.log(result);
        }).catch(err => {
            console.error('Error setting token', err);
        });
        
        return res.json({ message: 'Login successful' , session_token: token});
    } 
    else {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
});

app.post('/logout', async (req, res) => {
    token = req.headers.token;
    if (!token) {
        return res.status(400).json({ message: 'User is not logged in' });
    }

    const existingUser = await collection.findOne({ session_token: token });
    console.log(existingUser);
    
    if (existingUser) {
        collection.updateOne({ session_token: token }, { $set: { session_token: '' } }).then(result => {
            console.log(result);
        }).catch(err => {
            console.error('Error logging out user!', err);
        });
        console.log('Logout successful');
        return res.json({ message: 'Logout successful' });
    }
});

app.post('/addtask', async (req, res) => {
    token = req.body.headers.token;
    console.log(req);
    if (!token) {
        return res.status(400).json({ message: 'User is not logged in' });
    }

    const existingUser = await collection.findOne({ session_token: token });
    console.log(existingUser);
    
    if (existingUser) {
        task = req.body.params;
        if (!task.task) {
            return res.status(400).json({ message: 'Task is required' });
        }

        if (existingUser.tasks) {
            tasks = existingUser.tasks;
            console.log("Existing Tasks: ", tasks);
            if (tasks[task.task]) {
                return res.status(400).json({ message: 'Task already exists' });
            }
        }
        else {
            tasks = {};
        }
        tasks[task.task] = [task.status, task.deadline];
        console.log("Updated Tasks: ", tasks);
        if (!task.deadline) {
            task.deadline = "-";
        }
        collection.updateOne({ session_token: token }, { $set: { tasks: tasks } }).then(result => {
            console.log(result);
        }).catch(err => {
            console.error('Error adding task', err);
        });
        console.log('Task added successfully');
        return res.json({ message: 'Task added successfully' });
    }
});

app.get('/tokenexpiry', async (req, res) => {
    token = req.headers.token;
    if (!token) {
        return res.status(400).json({ message: 'User is not logged in' });
    }

    const existingUser = await collection.findOne({ session_token: token });
    console.log(existingUser);
    if (existingUser) {
        return res.json({ message: 'Token is valid' , expiration_time: existingUser.expiration_time});
    }
    else {
        return res.status(400).json({ message: 'Token has expired' });
    }
});

app.get('/gettasks', async (req, res) => {
    token = req.headers.token;
    if (!token) {
        return res.status(400).json({ message: 'User is not logged in' });
    }

    const existingUser = await collection.findOne({ session_token: token });
    console.log(existingUser);
    tasks = existingUser.tasks;
    console.log("Tasks: ", tasks);
    return res.json(tasks);
});

app.delete('/deletetask', async (req, res) => {
    token = req.headers.token;
    dtask = req.query.task;
    if (!token) {
        return res.status(400).json({ message: 'User is not logged in' });
    }

    const existingUser = await collection.findOne({ session_token: token });
    if (existingUser) {
        tasks = existingUser.tasks;
        if (!tasks[dtask]) {
            return res.status(400).json({ message: 'Task does not exist' });
        }
        temptasks = {}
        for (task in tasks){
            console.log(task);
            if (task !== dtask){
                temptasks[task] = tasks[task];
            }
        }
        collection.updateOne({ session_token: token }, { $set: { tasks: temptasks } }).then(result => {
            console.log(result);
        }).catch(err => {
            console.error('Error deleting task', err);
        });
        console.log('Task deleted successfully');
        return res.json({ message: 'Task deleted successfully' });
    }
});

app.put('/updatetask', async (req, res) => {
    token = req.body.headers.token;
    currtask = req.body.params.task;
    ustatus = req.body.params.status;
    deadline = req.body.params.deadline;
    utask = req.body.params.utask || currtask;
    console.log(req.body.params);
    if (!token) {
        return res.status(400).json({ message: 'User is not logged in' });
    }

    const existingUser = await collection.findOne({ session_token: token });
    if (existingUser) {
        tasks = existingUser.tasks;
        if (!tasks[currtask]) {
            return res.status(400).json({ message: 'Task does not exist' });
        }
        else if (utask === currtask) {
            tasks[currtask] = [ustatus, deadline];
            collection.updateOne({ session_token: token }, { $set: { tasks: tasks } }).then(result => {
                console.log(result);
            }).catch(err => {
                console.error('Error updating task', err);
            });
        }
        else{
            temptasks = {}
            for (task in tasks){
                if (task === currtask){
                    temptasks[utask] = [ustatus, deadline];
                }
                else{
                    temptasks[task] = tasks[task];
                }
            }
            collection.updateOne({ session_token: token }, { $set: { tasks: temptasks } }).then(result => {
                console.log(result);
            }).catch(err => {
                console.error('Error updating task', err);
            });
        }
        console.log('Task updated successfully');
        return res.json({ message: 'Task updated successfully' });
    }
});


const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})