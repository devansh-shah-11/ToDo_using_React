import { useState, useRef } from 'react';
import axios from 'axios';

function ToDoApp() {

  const AddTodo = ({ addTodo }) => {
    
    const [task, setTodo] = useState(''); 
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("Task: ", task);
      if (task === ''){
        alert("Task cannot be empty");
      }
      else{
        const newTodo = {
          user_id: '659ce5e520c703338f797c08',
          task: task,
          status: false,
          isUpdating: false,
        };
        try {
          // const url = 'http://localhost:8000/tasks?user_id=' + newTodo.user_id + '&task=' + newTodo.task + '&status=' + newTodo.status;
          // const response = axios.post(url);
          const url = 'http://localhost:8000/tasks';
          const response = axios.post(
            url,
            {},
            {
              params: {
                user_id: newTodo.user_id,
                task: newTodo.task,
                status: newTodo.status,
              }
            }
          )
          console.log("Response: ", response);
          addTodo({
            text: newTodo.task,
            status: newTodo.status,
            isUpdating: newTodo.isUpdating,
          });
          console.log("Added New Todo: ", newTodo);
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
        <button type="submit">Add Todo</button>
      </form>
    )
  }
  
  const Todo = ({ todo, toggleComplete, updateTodo, deleteTodo }) => {
  
    const [newTodo, setNewTodo] = useState(todo.text);
    const [isUpdating, setIsUpdating] = useState(false);
    const updateRef = useRef(null);

    const handleUpdate = () => {
      const originalTodo = updateRef.current;
      console.log("Original: ", originalTodo);
      updateTodo({
        originalTodo,
        text: newTodo,
        status: todo.status,
      });
    };  
  
    const handleDelete = async () => {
      const toDelete = todo.text;
      console.log("Deleting: ", toDelete);
      const url = `http://localhost:8000/tasks/${toDelete}`;
      try{
        const response = await axios.delete(
          url,
          {
            params: {
              user_id: '659ce5e520c703338f797c08',
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
            <span>{todo.text}</span>
            <input
              type='checkbox'
              checked={todo.status}
              onChange={() => {
                toggleComplete(todo);
              }}
            />
            <button onClick={() => {
              setIsUpdating(true);
              updateRef.current = todo.text;
              }}
            >Edit</button>

            <button onClick={handleDelete}>Delete</button>
          </>
        ) : (
          <>
            <input
              type='text'
              value={newTodo}
              onChange={(e) => setNewTodo (e.target.value)}
            />
            <button onClick={handleUpdate}>Save Changes</button>
          </>
        )}
      </div>
    )
  }
  
  const [todos, setTodos] = useState([])
  
  const addTodo = (newTodo) => {
    setTodos([...todos, newTodo]);
  }
  
  const toggleComplete = (todo) => {
    console.log("Toggling: ", todo);
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
        t.text === updatedTodo.originalTodo ? { ...t, text: updatedTodo.text} : t
      )
    );
  }
  
  const deleteTodo = (todoToDelete) => {
    setTodos(todos.filter(todo => todo !== todoToDelete));
    console.log("Deleted: ", todoToDelete);
  }
  
  return (
    <>
      <h1>ToDo App</h1>
      <AddTodo addTodo={addTodo} />
      {todos.map((todo, index) => (
        <Todo
          key={index}
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