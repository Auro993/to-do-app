// LocalStorage Management
const Storage = {
    // Save tasks to localStorage
    saveTasks(tasks) {
        try {
            localStorage.setItem('taskmaster_tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    },
    
    // Load tasks from localStorage
    loadTasks() {
        try {
            const tasks = localStorage.getItem('taskmaster_tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    },
    
    // Save theme preference
    saveTheme(theme) {
        try {
            localStorage.setItem('taskmaster_theme', theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    },
    
    // Load theme preference
    loadTheme() {
        try {
            const theme = localStorage.getItem('taskmaster_theme');
            return theme || 'light';
        } catch (error) {
            console.error('Error loading theme:', error);
            return 'light';
        }
    },
    
    // Export tasks as JSON file
    exportTasks() {
        const tasks = this.loadTasks();
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Import tasks from JSON file
    importTasks(file, callback) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                // Validate the imported data
                if (!Array.isArray(importedTasks)) {
                    throw new Error('Invalid data format');
                }
                
                // Merge with existing tasks (avoid duplicates)
                const existingTasks = Storage.loadTasks();
                const existingIds = new Set(existingTasks.map(task => task.id));
                const newTasks = importedTasks.filter(task => !existingIds.has(task.id));
                
                const mergedTasks = [...existingTasks, ...newTasks];
                Storage.saveTasks(mergedTasks);
                
                if (callback) callback({
                    success: true,
                    imported: newTasks.length,
                    skipped: importedTasks.length - newTasks.length
                });
                
            } catch (error) {
                console.error('Error importing tasks:', error);
                if (callback) callback({
                    success: false,
                    error: 'Invalid file format'
                });
            }
        };
        
        reader.readAsText(file);
    },
    
    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
            localStorage.removeItem('taskmaster_tasks');
            localStorage.removeItem('taskmaster_theme');
            return true;
        }
        return false;
    },
    
    // Get storage statistics
    getStorageStats() {
        const tasks = this.loadTasks();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const storageSize = JSON.stringify(tasks).length;
        
        return {
            totalTasks,
            completedTasks,
            pendingTasks: totalTasks - completedTasks,
            storageSize: this.formatBytes(storageSize)
        };
    },
    
    // Format bytes to human readable format
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};