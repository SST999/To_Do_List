let tasks = JSON.parse(localStorage.getItem('tasks')) || []; // Holds the task data
// Filter state: 'all', 'pending', or 'completed'
let currentFilter = 'all';
// Get saved theme preference
let currentTheme = localStorage.getItem('theme') || 'light';
let searchQuery = '';

// Get DOM elements
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const taskDueDate = document.getElementById('task-dueDate');
const addTaskBtn = document.getElementById('add-task-btn');
const pendingList = document.getElementById('pending-tasks');
const completedList = document.getElementById('completed-tasks');
const toast = document.getElementById('toast');
const themeToggleBtn = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    renderTasks();
    setupThemeToggle();
    setupSearch();
    console.log('Initial tasks:', tasks); // Debug: Log tasks on load
});

// Apply theme
function applyTheme() {
    document.body.className = currentTheme === 'dark' ? 'dark-mode' : '';
    themeToggleBtn.textContent = currentTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
}

// Theme Toggle
function setupThemeToggle() {
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
        showToast(`Switched to ${currentTheme} mode`);
    });
}

// Search Functionality
function setupSearch() {
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        console.log('Search query:', searchQuery); // Debug: Log search query
        renderTasks(); // Re-render tasks on every input change
    });
}

// Load tasks from localStorage
function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Show Toast Notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Render tasks
function renderTasks() {
    loadTasks(); // Load tasks from localStorage before rendering

    // Clear existing lists, preserving headers
    pendingList.innerHTML = '<h2>📋 Pending Tasks</h2>';
    completedList.innerHTML = '<h2>✅ Completed Tasks</h2>';

    // Filter tasks based on search query and current filter
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery) || (task.description || '').toLowerCase().includes(searchQuery);
        return matchesSearch && (currentFilter === 'all' || currentFilter === task.status);
    });

    console.log('Filtered tasks:', filteredTasks); // Debug: Log filtered tasks

    // Track if any tasks are displayed in each list
    let hasPending = false;
    let hasCompleted = false;

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = true;
        li.dataset.index = tasks.indexOf(task);

        li.innerHTML = `
            <div class="task-content">
                <strong>${task.title}</strong><br/>
                ${task.description ? `<p>${task.description}</p>` : ''}
                ${task.dueDate ? `🗓️ ${formatDate(task.dueDate)}</p>` : ''}
            </div>
            <div class="task-actions">
                <button onclick="editTask(${tasks.indexOf(task)})">✏️</button>
                <button onclick="deleteTask(${tasks.indexOf(task)})">🗑️</button>
                <button onclick="toggleComplete(${tasks.indexOf(task)})">${task.status === 'pending' ? '✅' : '↩️'}</button>
            </div>
        `;

        // Drag and Drop functionality
        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            saveTasks();
        });

        li.addEventListener('dragover', (e) => e.preventDefault());
        li.addEventListener('drop', (e) => handleDrop(e, task.status));

        // Append to appropriate list based on status and filter
        if (task.status === 'pending' && (currentFilter === 'all' || currentFilter === 'pending')) {
            pendingList.appendChild(li);
            hasPending = true;
        } else if (task.status === 'completed' && (currentFilter === 'all' || currentFilter === 'completed')) {
            completedList.appendChild(li);
            hasCompleted = true;
        }
    });

    // Add placeholder text if no tasks are displayed in each list
    if (!hasPending && (currentFilter === 'all' || currentFilter === 'pending')) {
        pendingList.innerHTML += '<li class="task-item">No pending tasks</li>';
    }
    if (!hasCompleted && (currentFilter === 'all' || currentFilter === 'completed')) {
        completedList.innerHTML += '<li class="task-item">No completed tasks</li>';
    }
}

// Handle Drag and Drop
function handleDrop(e, targetStatus) {
    e.preventDefault();
    const dragged = document.querySelector('.dragging');
    const fromIndex = +dragged.dataset.index;
    const targetList = targetStatus === 'pending' ? pendingList : completedList;
    const allItems = targetList.querySelectorAll('.task-item');
    let toIndex = Array.from(allItems).indexOf(e.target.closest('.task-item'));

    if (toIndex === -1) toIndex = tasks.filter(t => t.status === targetStatus).length;

    const task = tasks[fromIndex];
    tasks.splice(fromIndex, 1);
    task.status = targetStatus;
    const targetTasks = tasks.filter(t => t.status === targetStatus);
    tasks.splice(tasks.indexOf(targetTasks[toIndex]) || tasks.length, 0, task);

    showToast('🔃 Task Moved');
    saveTasks();
    renderTasks();
}

// Add task
function addTask() {
    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const dueDate = taskDueDate.value;

    if (!title) {
        alert('Title is required');
        return;
    }

    const newTask = {
        title,
        description,
        dueDate,
        status: 'pending'
    };

    tasks.push(newTask);
    showToast('✅ Task Created');
    saveTasks();
    renderTasks();

    // Clear input fields
    taskTitle.value = '';
    taskDescription.value = '';
    taskDueDate.value = '';
}

// Edit task
function editTask(index) {
    const task = tasks[index];
    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskDueDate.value = task.dueDate;

    // Remove the task and allow the user to edit it
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    showToast('✏️ Task Updated');
}

// Delete task
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    showToast('🗑️ Task Deleted');
}

// Toggle task completion status
function toggleComplete(index) {
    const task = tasks[index];
    task.status = task.status === 'pending' ? 'completed' : 'pending';
    saveTasks();
    renderTasks();
    showToast(task.status === 'completed' ? '🔄 Task Moved to Completed' : '🔄 Task Moved to Incomplete');
}

// Set filter
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.task-filter button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
    });
    renderTasks();
}

// Add event listeners
addTaskBtn.addEventListener('click', addTask);
taskTitle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
pendingList.addEventListener('dragover', (e) => e.preventDefault());
completedList.addEventListener('dragover', (e) => e.preventDefault());
pendingList.addEventListener('drop', (e) => handleDrop(e, 'pending'));
completedList.addEventListener('drop', (e) => handleDrop(e, 'completed'));

// Filter buttons
document.querySelectorAll('.task-filter button').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.textContent.toLowerCase()));
});