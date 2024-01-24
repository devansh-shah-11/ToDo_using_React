import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import './TasksDue.css';
import 'react-calendar/dist/Calendar.css';

function TasksCalendar({ todos: filteredTodos }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasksDue, setTasksDue] = useState([]);

    useEffect(() => {
        console.log('Selected date: ', selectedDate);
        console.log('Todos: ', filteredTodos);
        const tasksDueOnSelectedDate = filteredTodos.filter(todo => {
            const todoDate = new Date(todo.deadline);
            return todoDate.getDate() === selectedDate.getDate() &&
                todoDate.getMonth() === selectedDate.getMonth() &&
                todoDate.getFullYear() === selectedDate.getFullYear();
        });

        setTasksDue(tasksDueOnSelectedDate);
    }, [selectedDate, filteredTodos]);

    const handleMouseEnter = (date) => {
        console.log('Mouse entered on date: ', date);
        setSelectedDate(date);
    };

    return (
        <div className='container'>
            <Calendar
                tileContent={({ date, view }) => view === 'month' && <div onMouseEnter={() => handleMouseEnter(date)} style={{ height: '100%', width: '100%' }}></div>}
            />
            <ul>
                {tasksDue.map(task => (
                    <li key={task.index} className='task-item'>{task.task}</li>
                ))}
            </ul>
        </div>
    );
}

export default TasksCalendar;