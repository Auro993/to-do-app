// Utility Functions
const Utils = {
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Today
        if (this.isToday(date)) {
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            return `${diffHours}h ago`;
        }
        
        // Yesterday
        if (this.isYesterday(date)) {
            return 'Yesterday';
        }
        
        // This week
        if (diffDays < 7) {
            return `${diffDays}d ago`;
        }
        
        // Older
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    },
    
    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },
    
    // Check if date is yesterday
    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        return date.getDate() === yesterday.getDate() &&
               date.getMonth() === yesterday.getMonth() &&
               date.getFullYear() === yesterday.getFullYear();
    },
    
    // Generate a unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function for performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Sort tasks by various criteria
    sortTasks(tasks, criteria = 'date') {
        const sorted = [...tasks];
        
        switch(criteria) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                sorted.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                });
                break;
                
            case 'date':
            default:
                sorted.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                break;
        }
        
        return sorted;
    },
    
    // Filter tasks by date range
    filterByDateRange(tasks, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= start && taskDate <= end;
        });
    },
    
    // Calculate productivity metrics
    calculateProductivity(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        
        // Calculate average completion time for completed tasks
        const completedTasks = tasks.filter(task => task.completed && task.completedAt);
        let avgCompletionTime = 0;
        
        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                const created = new Date(task.createdAt);
                const completed = new Date(task.completedAt);
                return sum + (completed - created);
            }, 0);
            
            avgCompletionTime = totalTime / completedTasks.length;
        }
        
        return {
            total,
            completed,
            pending: total - completed,
            completionRate: Math.round(completionRate * 100) / 100,
            avgCompletionTime: this.formatDuration(avgCompletionTime)
        };
    },
    
    // Format duration in milliseconds to readable format
    formatDuration(ms) {
        if (!ms) return 'N/A';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    },
    
    // Validate task object
    validateTask(task) {
        const errors = [];
        
        if (!task.title || task.title.trim().length === 0) {
            errors.push('Task title is required');
        }
        
        if (task.title && task.title.length > 500) {
            errors.push('Task title is too long (max 500 characters)');
        }
        
        if (!task.priority || !['high', 'medium', 'low'].includes(task.priority)) {
            errors.push('Invalid priority level');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    // Create a deep clone of an object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};