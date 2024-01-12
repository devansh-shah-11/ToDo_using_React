import { useState } from 'react'

const AddTodo = ({ addTodo }) => {

  const [task, setTodo] = useState('')

  const handleSubmit = (e) => {
    console.log("Task: ", task)
    e.preventDefault()
    addTodo({
      text: task,
      status: false,
      isUpdating: false,
    })
  
    setTodo('')
  
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

  const [newTodo, setNewTodo] = useState(todo.text)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = () => {
    updateTodo({
      ...todo,
      text: newTodo,
      isUpdating: false,
      status: todo.status,
    });
    setIsUpdating(false);
  };  

  const handleDelete = () => {
    console.log("Deleting: ", todo)
    deleteTodo(todo)
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
          <button onClick={() => setIsUpdating(true)}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </>
      ) : (
        <>
          <input
            type='text'
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button onClick={handleUpdate}>Save Changes</button>
        </>
      )}
    </div>
  )
}

function App() {
  const [todos, setTodos] = useState([])

  const addTodo = (newTodo) => {
    setTodos([...todos, newTodo])
  }

  const toggleComplete = (todo) => {
    setTodos(
      todos.map((t) =>
        t === todo ? { ...t, status: !t.status} : t
      )
    )
  }

  const updateTodo = (todo) => {
    setTodos(
      todos.map((t) =>
        t === todo ? t :{ ...t, text: todo.text}
      )
    )
  }

  const deleteTodo = (todoToDelete) => {
    setTodos(todos.filter(todo => todo !== todoToDelete))
    console.log("Deleted: ", todoToDelete)
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

export default App