import { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import Home from './pages/Home.page.jsx';
import { UserContext } from "./contexts/user.context.jsx";
import './TodoApp.css';


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
            const url = `http://localhost:8000/tasks?user_id=${user}`;
            const response = await axios.get(url);
            console.log("Response: ", response);
            let newTodos = [];
            for (let [task, status] of Object.entries(response.data)) {
                console.log("Task: ", task);
                const newTodo = {
                    task: task,
                    status: status[0],
                    deadline: status[1]['$date'],
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
                    user_id: user,
                    task: task,
                    status: false,
                    isUpdating: false,
                };
                try {
                    const isoDeadline = new Date(deadline).toISOString();
                    console.log(newTodo);
                    const url = 'http://localhost:8000/tasks';
                    const response = await axios.post(url, {
                        user_id: newTodo.user_id,
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
                <input
                    type="text"
                    value={task}
                    onChange={(e) => setTodo(e.target.value)}
                />
                <input type='date' id='date' value={deadline} onChange={e => setDeadline(e.target.value) }/>
                <button class="add-task-button" type="submit">Add Todo</button>
            </form>
        )
    }
    
    const Todo = ({ index, todo, toggleComplete, updateTodo, deleteTodo }) => {
    
        const [newTodo, setNewTodo] = useState(todo.task);
        const [isUpdating, setIsUpdating] = useState(false);
        const updateRef = useRef(null);

        const handleUpdate = () => {
            
            const originalTodo = updateRef.current;
            console.log("Original: ", originalTodo);
            const url = `http://localhost:8000/tasks/`;
            axios.put(
                url,
                {},
                {
                params: {
                    user_id: user,
                    task: originalTodo,
                    status: todo.status,
                    newtask: newTodo,
                }
                }
            )
            updateTodo({
                originalTodo,
                task: newTodo,
                status: todo.status,
            });
        };  
    
        const handleDelete = async () => {
            const toDelete = todo.task;
            console.log("Deleting: ", toDelete);
            const url = `http://localhost:8000/tasks/${toDelete}`;
            try{
                const response = await axios.delete(
                url,
                {
                    params: {
                    user_id: user,
                    }
                }
                )
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
                        checked={todo.status}
                        onChange={() => {
                            toggleComplete(todo);
                        }}
                    />
                    <div id="task">{todo.task}</div>
                    <div id="actions-container">
                        <button className="edit-button" onClick={() => {
                            setIsUpdating(true);
                            updateRef.current = todo.task;
                        }}
                        >Edit</button>

                        <button className="delete-button" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            </>
            ) : (
            <>
                <input
                type='text'
                value={newTodo}
                onChange={(e) => setNewTodo (e.target.value)}
                />
                <button className = "task-button" onClick={handleUpdate}>Save Changes</button>
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
        const url = `http://localhost:8000/tasks/${todo.task}`;
        axios.put(
        url,
        {},
        {
            params: {
            user_id: user,
            task: todo.task,
            status: !todo.status,
            }
        }
        )
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
            t.task === updatedTodo.originalTodo ? { ...t, task: updatedTodo.task} : t
        )
        );
    }
    
    const deleteTodo = (todoToDelete) => {
        setTodos(todos.filter(todo => todo !== todoToDelete));
        console.log("Deleted: ", todoToDelete);
    }
    
    const handleFilterChange = (filter) => {
        setFilter(filter);
    }


    return (
        <>
            <Home />
            <div className='header'> Welcome to your To-Do List! </div>
            
            <div className='add-todo'>
                <AddTodo addTodo={addTodo} />
            </div>
            
            <div className='button-container'>
                <button className="all-category-button" onClick={() => handleFilterChange("All")}>All</button>
                <button className="all-category-button" onClick={() => handleFilterChange("Completed")}>Completed</button>
                <button className="all-category-button" onClick={() => handleFilterChange("Pending")}>Pending</button>
            </div>

            <br></br>
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
        </>
    )
}  

export default ToDoApp