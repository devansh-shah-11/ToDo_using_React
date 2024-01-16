import { useState, useRef } from 'react';

function ToDoApp() {

  const AddTodo = ({ addTodo }) => {

    const [task, setTodo] = useState(''); 
  
    const handleSubmit = (e) => {
      console.log("Task: ", task);
      if (task === ''){
        alert("Task cannot be empty");
      }
      else{
        addTodo({
          text: task,
          status: false,
          isUpdating: false,
        });
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
  
    const handleDelete = () => {
      console.log("Deleting: ", todo);
      deleteTodo(todo);
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