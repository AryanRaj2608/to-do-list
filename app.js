// Task Management Class
class TodoList {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.setupEventListeners();
        this.loadTasks();
        this.updateProgress();
        this.setupThemeToggle();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter and sort changes
        document.getElementById('filterSelect').addEventListener('change', () => this.loadTasks());
        document.getElementById('sortSelect').addEventListener('change', () => this.loadTasks());

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTasks(e.target.value);
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Set initial theme
        if (localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && prefersDarkScheme.matches)) {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('.material-icons').textContent = 'light_mode';
        }

        // Theme toggle click handler
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.querySelector('.material-icons').textContent = 
                isDark ? 'light_mode' : 'dark_mode';
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const dueDate = document.getElementById('dueDate');
        const priority = document.getElementById('taskPriority');
        const tags = document.getElementById('taskTags');

        const task = {
            id: Date.now(),
            text: taskInput.value,
            completed: false,
            dueDate: dueDate.value,
            priority: priority.value,
            tags: tags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.loadTasks();
        this.updateProgress();

        // Reset form
        taskInput.value = '';
        dueDate.value = '';
        priority.value = 'low';
        tags.value = '';
        taskInput.focus();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.loadTasks();
        this.updateProgress();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.loadTasks();
            this.updateProgress();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        const taskText = taskElement.querySelector('.task-text');
        
        // Create edit form
        const editForm = document.createElement('form');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
            <input type="text" class="edit-input" value="${task.text}">
            <button type="submit" class="edit-save">
                <span class="material-icons">save</span>
            </button>
        `;

        // Replace text with edit form
        taskText.replaceWith(editForm);

        // Focus input
        const editInput = editForm.querySelector('.edit-input');
        editInput.focus();
        editInput.select();

        // Handle form submission
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            task.text = editInput.value;
            this.saveTasks();
            this.loadTasks();
        });

        // Handle click outside
        const handleClickOutside = (e) => {
            if (!editForm.contains(e.target)) {
                task.text = editInput.value;
                this.saveTasks();
                this.loadTasks();
                document.removeEventListener('click', handleClickOutside);
            }
        };

        // Delay adding click listener to prevent immediate trigger
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    }

    searchTasks(query) {
        const tasks = this.tasks.filter(task => {
            const searchString = `${task.text} ${task.tags.join(' ')}`.toLowerCase();
            return searchString.includes(query.toLowerCase());
        });
        this.renderTasks(tasks);
    }

    loadTasks() {
        const filterValue = document.getElementById('filterSelect').value;
        const sortValue = document.getElementById('sortSelect').value;
        
        let filteredTasks = [...this.tasks];

        // Apply filters
        switch (filterValue) {
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'active':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'overdue':
                filteredTasks = filteredTasks.filter(task => {
                    if (!task.dueDate || task.completed) return false;
                    return new Date(task.dueDate) < new Date();
                });
                break;
        }

        // Apply sorting
        switch (sortValue) {
            case 'date':
                filteredTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'name':
                filteredTasks.sort((a, b) => a.text.localeCompare(b.text));
                break;
        }

        this.renderTasks(filteredTasks);
    }

    renderTasks(tasks) {
        const taskList = document.getElementById('taskList');
        const taskTemplate = document.getElementById('taskTemplate');
        
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = taskTemplate.content.cloneNode(true);
            const taskItem = taskElement.querySelector('.task-item');
            
            // Set task data and classes
            taskItem.dataset.id = task.id;
            taskItem.dataset.priority = task.priority;
            if (task.completed) taskItem.classList.add('completed');
            if (task.dueDate && new Date(task.dueDate) < new Date() && !task.completed) {
                taskItem.classList.add('overdue');
            }

            // Set task content
            taskItem.querySelector('.task-text').textContent = task.text;
            taskItem.querySelector('.task-checkbox').checked = task.completed;
            
            // Set due date
            const dueDate = taskItem.querySelector('.due-date');
            if (task.dueDate) {
                const date = new Date(task.dueDate);
                dueDate.textContent = date.toLocaleString();
            }

            // Set tags
            const tagsContainer = taskItem.querySelector('.tags');
            task.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });

            // Add event listeners
            taskItem.querySelector('.task-checkbox').addEventListener('change', () => {
                this.toggleTask(task.id);
            });

            taskItem.querySelector('.edit-btn').addEventListener('click', () => {
                this.editTask(task.id);
            });

            taskItem.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteTask(task.id);
            });

            taskList.appendChild(taskElement);
        });
    }

    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('progress').style.width = `${percentage}%`;
        document.querySelector('.progress-text').textContent = `${percentage}% Complete`;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoList();
}); 