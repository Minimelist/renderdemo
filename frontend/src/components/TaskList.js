import React from 'react';
import TaskItem from './TaskItem';

function TaskList({ tasks, onUpdate, onDelete, onToggle }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list empty">
        <p>No tasks yet. Create your first task above!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <h2>Your Tasks ({tasks.length})</h2>
      <div className="tasks-container">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default TaskList;