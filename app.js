// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
});

function initApp() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const markAllCompleteBtn = document.getElementById('markAllComplete');
    
    // Initialize tasks from storage
    let tasks = Storage.loadTasks();
    let currentFilter = 'all';
    let searchQuery = '';
    
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize theme
    const savedTheme = Storage.loadTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    
    // Initialize the app
    renderTasks();
    updateStats();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTasks();
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    markAllCompleteBtn.addEventListener('click', markAllComplete);
    
    // Functions
    function addTask() {
        const title = taskInput.value.trim();
        const priority = prioritySelect.value;
        
        if (!title) {
            showNotification('Please enter a task description', 'warning');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            title: title,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveAndRender();
        
        // Clear input and focus
        taskInput.value = '';
        taskInput.focus();
        
        showNotification('Task added successfully!', 'success');
    }
    
    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const updatedTask = { 
                    ...task, 
                    completed: !task.completed,
                    updatedAt: new Date().toISOString()
                };
                
                if (updatedTask.completed) {
                    updatedTask.completedAt = new Date().toISOString();
                } else {
                    delete updatedTask.completedAt;
                }
                
                return updatedTask;
            }
            return task;
        });
        
        saveAndRender();
    }
    
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        const newTitle = prompt('Edit your task:', task.title);
        
        if (newTitle !== null && newTitle.trim() !== '') {
            tasks = tasks.map(task => {
                if (task.id === id) {
                    return { 
                        ...task, 
                        title: newTitle.trim(),
                        updatedAt: new Date().toISOString()
                    };
                }
                return task;
            });
            
            saveAndRender();
            showNotification('Task updated successfully!', 'info');
        }
    }
    
    function deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveAndRender();
            showNotification('Task deleted', 'info');
        }
    }
    
    function clearCompletedTasks() {
        const completedCount = tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            showNotification('No completed tasks to clear', 'info');
            return;
        }
        
        if (confirm(`Clear ${completedCount} completed task(s)?`)) {
            tasks = tasks.filter(task => !task.completed);
            saveAndRender();
            showNotification(`Cleared ${completedCount} task(s)`, 'success');
        }
    }
    
    function markAllComplete() {
        const pendingTasks = tasks.filter(task => !task.completed);
        
        if (pendingTasks.length === 0) {
            showNotification('All tasks are already completed', 'info');
            return;
        }
        
        tasks = tasks.map(task => {
            if (!task.completed) {
                return { 
                    ...task, 
                    completed: true,
                    completedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
            return task;
        });
        
        saveAndRender();
        showNotification(`Marked ${pendingTasks.length} task(s) as complete`, 'success');
    }
    
    function getFilteredTasks() {
        let filtered = tasks;
        
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply status filter
        switch(currentFilter) {
            case 'pending':
                return filtered.filter(task => !task.completed);
            case 'completed':
                return filtered.filter(task => task.completed);
            default:
                return filtered;
        }
    }
    
    function renderTasks() {
        const filteredTasks = getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '';
            taskList.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${Utils.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-category priority-${task.priority}">
                            <i class="fas ${getPriorityIcon(task.priority)}"></i>
                            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                        <span class="task-date">
                            <i class="far fa-calendar"></i>
                            ${Utils.formatDate(task.createdAt)}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                toggleTask(taskId);
            });
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                editTask(taskId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                deleteTask(taskId);
            });
        });
    }
    
    function saveAndRender() {
        Storage.saveTasks(tasks);
        renderTasks();
        updateStats();
        updateTaskCounter();
    }
    
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const today = tasks.filter(task => 
            Utils.isToday(new Date(task.createdAt))
        ).length;
        
        // Priority counts
        const highCount = tasks.filter(task => task.priority === 'high').length;
        const mediumCount = tasks.filter(task => task.priority === 'medium').length;
        const lowCount = tasks.filter(task => task.priority === 'low').length;
        
        // Update DOM
        document.getElementById('totalCount').textContent = total;
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('todayCount').textContent = today;
        
        document.getElementById('highCount').textContent = highCount;
        document.getElementById('mediumCount').textContent = mediumCount;
        document.getElementById('lowCount').textContent = lowCount;
        
        // Update progress circle
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
        
        const progressCircle = document.querySelector('.progress-bar');
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (completionRate / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    
    function updateTaskCounter() {
        const totalTasks = tasks.length;
        const counterText = totalTasks === 1 ? '1 task managed' : `${totalTasks} tasks managed`;
        document.getElementById('taskCounter').textContent = counterText;
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.saveTheme(newTheme);
        updateThemeButton(newTheme);
        showNotification(`Switched to ${newTheme} mode`, 'info');
    }
    
    function updateThemeButton(theme) {
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }
    
    function getPriorityIcon(priority) {
        switch(priority) {
            case 'high': return 'fa-exclamation-circle';
            case 'medium': return 'fa-minus-circle';
            case 'low': return 'fa-arrow-down-circle';
            default: return 'fa-circle';
        }
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--card-color);
                color: var(--text-color);
                padding: 16px 24px;
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
                border-left: 4px solid;
                max-width: 400px;
            }
            
            .notification-success { border-left-color: var(--accent-color); }
            .notification-warning { border-left-color: var(--warning-color); }
            .notification-info { border-left-color: var(--primary-color); }
            
            .notification i { font-size: 1.2rem; }
            .notification-success i { color: var(--accent-color); }
            .notification-warning i { color: var(--warning-color); }
            .notification-info i { color: var(--primary-color); }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                margin-left: auto;
                padding: 4px;
                border-radius: var(--radius-sm);
            }
            
            .notification-close:hover {
                background: var(--bg-color);
                color: var(--text-color);
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-bell';
        }
    }
    
    // Initial update of task counter
    updateTaskCounter();
}