import { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import Home from './pages/Home.page.jsx';
import { UserContext } from "./contexts/user.context.jsx";
import './TodoApp.css';
import { Button } from '@mui/material'
import TasksCalendar from './TasksDue.jsx'

function ToDoApp() {

    const [task, setTodo] = useState([]); 
    const { user } = useContext(UserContext);
    const { logOutUser } = useContext(UserContext);
    const [filter, setFilter] = useState("All");
    const [todos, setTodos] = useState([]);
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        const intervalId = setInterval(() => {
            checkTokenExpiration();
        }, 600000); // checks every minute
    
        // cleanup function
        return () => clearInterval(intervalId);
    }, []);
    
    async function checkTokenExpiration() {
        const url = `http://localhost:8000/token/`;
        const response = await axios.get(url, {
            params: {
                session_token: user,
            }
        });
        console.log("Response: ", response);
        const currentTime = new Date().getTime();
        console.log("Response Data: ", response)
        const expirationTime = new Date(response.data.expiration_time).getTime();
        console.log("Current Time: ", currentTime);
        console.log("Expiration Time: ", expirationTime);
        if (currentTime > expirationTime) {
            try {
                console.log("Token expired. Logging out user: ", user);
                const loggedOut = await logOutUser(user);
                if (loggedOut) {
                    window.location.reload(true);
                    return true;
                }
            } catch (error) {
                alert(error)
                return false;
            }
        }
        else {  
            return false;
        }
    }

    useEffect(() => {
    const fetchTasks = async () => {
        try {
            console.log("Fetching tasks for user: ", user);
            const url = `http://localhost:8000/tasks?token=${user}`;
            const response = await axios.get(url);
            console.log("Response: ", response);
            let newTodos = [];
            for (let [task, status] of Object.entries(response.data)) {
                console.log("Task: ", task);
                const newTodo = {
                    task: task,
                    status: status[0],
                    deadline: status[1]['$date'] ? status[1]['$date'].split("T")[0] : "-",
                    isUpdating: false,
                };
                newTodos.push(newTodo);
            }
            console.log("Existing Todos: ", newTodos);
            setTodos(newTodos);
        } catch (error) {
        console.error("Error fetching tasks: ", error);
        }
    };
    fetchTasks();
    }, [user]);

    const filteredTodos = todos.filter((todo) => {
        console.log("Filter: ", filter);
        console.log("Todo: ", todos);
        if (filter === "All") {
            return true;
        }
        if (filter === "Completed") {
            return todo.status;
        }
        if (filter === "Pending") {
            return !todo.status;
        }
    });

    const AddTodo = ({ addTodo }) => {
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            console.log("Task: ", task);
            if (task === ''){
                alert("Task cannot be empty");
            }
            else{
                const newTodo = {
                    task: task,
                    status: false,
                    isUpdating: false,
                };
                try {
                    const isoDeadline = deadline ? new Date(deadline).toISOString().split("T")[0] : "-";
                    console.log(newTodo);
                    const url = `http://localhost:8000/tasks?token=${user}`;
                    const response = await axios.post(url, {
                        task: newTodo.task,
                        status: newTodo.status,
                        deadline: isoDeadline,
                    });

                    addTodo({
                        task: newTodo.task,
                        status: newTodo.status,
                        deadline: isoDeadline,
                        isUpdating: newTodo.isUpdating,
                    });
                    console.log("Added New Todo: ", newTodo);
                    setTodo('');
                    setDeadline('');
                }
                catch (error) {
                    if (error.response) {
                        console.error("Error Response Data: ", error.response.data);
                    } else if (error.request) {
                        console.error("No response received");
                    } else {
                        console.error("Error Setting Up Request: ", error.message);
                    }
                }
            }
        }

        return (
            <form onSubmit={handleSubmit}>
                
                <div id='add-task-display'>
                    <input
                        className='input-field'
                        type="text"
                        value={task}
                        placeholder='Enter Task'
                        onChange={(e) => setTodo(e.target.value)}
                    />
                    <input className='input-field' type='date' id='date' value={deadline} onChange={e => setDeadline(e.target.value) }/>
                    <button class="add-task-button" type="submit">Add Todo</button>
                </div>
                
            </form>
        )
    }
    
    const Todo = ({ index, todo, toggleComplete, updateTodo, deleteTodo }) => {
    
        const [newTodo, setNewTodo] = useState(todo.task);
        const [isUpdating, setIsUpdating] = useState(false);
        const updateRef = useRef(null);

        const handleUpdate = () => {
            
            const Newdeadline = deadline ? new Date(deadline).toISOString().split("T")[0] : "-";
            console.log("New Deadline: ", Newdeadline);
            const originalTodo = updateRef.current;
            console.log("Original: ", originalTodo);

            const url = `http://127.0.0.1:8000/tasks?session_token=${user}`;
            const response = axios.put( url, {
                task: todo.task,
                newTask: newTodo,
                status: !todo.status,
                deadline: todo.deadline,
            });

            updateTodo({
                originalTodo,
                task: newTodo,
                status: todo.status,
                deadline: Newdeadline,
            });
        };  
    
        const handleDelete = async () => {
            const toDelete = todo.task;
            console.log("Deleting: ", toDelete);
            const url = `http://localhost:8000/tasks/${toDelete}?token=${user}`;
            try{
                const response = await axios.delete(url);
                console.log("Response: ", response);
                deleteTodo(todo);
            }
            catch (error) {
                console.error("Error deleting todo: ", error);
            }
        }
    
        return (
        <div>
            {!isUpdating ? (
            <>
                <div id="todo-container">
                    <div id="index">{index}</div>
                    <input
                        type='checkbox'
                        id='statusbox'
                        checked={todo.status}
                        onChange={() => {
                            toggleComplete(todo);
                        }}
                    />
                    <div id="task">{todo.task}</div>
                    <div id="deadline">{todo.deadline}</div>
                    <div id="actions-container">
                        <button className="edit-button" onClick={() => {
                            setIsUpdating(true);
                            updateRef.current = todo.task;
                            setDeadline(deadline);
                        }}
                        >Edit</button>

                        <button className="delete-button" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            </>
            ) : (
            <>
                <div id="todo-container">
                    <div id="index1">{index}</div>
                    <input
                        id='statusbox1'
                        type='checkbox'
                        checked={todo.status}
                        onChange={() => {
                            toggleComplete(todo);
                        }}
                    />
                    <input
                        type='text'
                        id='task1'
                        value={newTodo}
                        onChange={(e) => setNewTodo (e.target.value)}
                    />
                    
                    <input type='date' id='deadline1' value={deadline} onChange={e => setDeadline(e.target.value) }/>

                    <button className = "task-button" onClick={() => {
                        handleUpdate();
                        setIsUpdating(false);
                    }
                    }>Save Changes</button>
                    <button className="delete-button1" onClick={handleDelete}>Delete</button>
                </div>
            </>
            )}
        </div>
        )
    }
    
    const addTodo = (newTodo) => {
        setTodos([...todos, newTodo]);
    }
    
    const toggleComplete = (todo) => {

        console.log("Toggling: ", todo);
        const url = `http://127.0.0.1:8000/tasks?token=${user}`;
        const response = axios.put( url, {
            task: todo.task,
            status: !todo.status,
            deadline: todo.deadline,
        });
        setTodos(
        todos.map((t) =>
            t === todo ? { ...t, status: !t.status} : t
        )
        );
    }
    
    const updateTodo = (updatedTodo) => {
        console.log("Updating: ", updatedTodo);
        setTodos(
            todos.map((t) =>
                t.task === updatedTodo.originalTodo ? { ...t, task: updatedTodo.task, deadline: updatedTodo.deadline } : t
            )
        );
    }
    
    const deleteTodo = (todoToDelete) => {
        setTodos(todos.filter(todo => todo !== todoToDelete));
        console.log("Deleted: ", todoToDelete);
    }

    const logOut = async () => {
        try {
            console.log("Logging out user: ", user);
            const loggedOut = await logOutUser(user);
            if (loggedOut) {
            window.location.reload(true);
            }
        } catch (error) {
            alert(error)
        }
    }
    

    return (
        <>
            <Home />
            <div className='header'> 
            <div className="title-container">
                <h2>Welcome to your To-Do list!</h2>
            </div>
                <Button variant="contained" onClick={logOut} className='logout-btn'>Logout</Button>
            </div>
            
            <div className='add-todo'>
                <AddTodo addTodo={addTodo} />
            </div>
            <div className="container1">
                <div className="space-between"></div>
                <div className="tasks-and-buttons">
                <div className='button-container'>
                    <button 
                        className={`all-category-button ${filter === "All" ? "selected" : ""}`} 
                        onClick={() => setFilter("All")}
                    >
                        All
                    </button>
                    <button 
                        className={`all-category-button ${filter === "Completed" ? "selected" : ""}`} 
                        onClick={() => setFilter("Completed")}
                    >
                        Completed
                    </button>
                    <button 
                        className={`all-category-button ${filter === "Pending" ? "selected" : ""}`} 
                        onClick={() => setFilter("Pending")}
                    >
                        Pending
                    </button>
                </div>
                    <br></br>
                    <br></br>
                    {filteredTodos.map((todo, index) => (
                        <Todo
                        key={index}
                        index={index+1}
                        todo={todo} 
                        toggleComplete={toggleComplete}
                        updateTodo={updateTodo}
                        deleteTodo={deleteTodo}
                        />
                    ))}
                </div>
                <div className="space-between"></div>
                <div className="space-between"></div>
                <div id='task-calendar'><TasksCalendar todos={filteredTodos}/></div>
                <div className="space-between"></div>
            </div>
        </>
    )
}  

export default ToDoApp