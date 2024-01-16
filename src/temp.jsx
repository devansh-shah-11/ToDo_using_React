const newTodo = {
    text: task,
    status: false,
    isUpdating: false,
  };
  try {
    const response = axios.post('http://localhost:8000/todos', newTodo);
    console.log("Response: ", response);
    addTodo({
      text: task,
      status: false,
      isUpdating: false,
    });
    console.log("Added New Todo: ", newTodo);
  }
  catch (error) {
    console.log("Error: ", error);
  }