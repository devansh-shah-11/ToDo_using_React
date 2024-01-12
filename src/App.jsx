import { useState } from 'react'

const AddTodo = ({ addTodo }) => {

  const [task, setTodo] = useState('')

  const handleSubmit = (e) => {
    console.log("Task: ", task)
    e.preventDefault()
    addTodo({
      text: task,
      status: false,
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

const Todo = ({ todo, toggleComplete, updateTodo }) => {

  const [newTodo, setNewTodo] = useState(todo.text)

  const handleUpdate = () => {
    updateTodo({
      text: newTodo,
      status: todo.status,
    })
  }

  return (
    <div>
      <span>{todo.text}</span>
      <input
        type='checkbox'
        checked={todo.status}
        onChange={() => {
            toggleComplete(todo)
            console.log(`Todo ${todo.text} is now ${!todo.status}`)
          }
        }
      />
      <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
      <button onClick={handleUpdate}>Update</button>
      {todo.status}
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
        />
      ))}
    </>
  )
}

export default App