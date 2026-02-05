// Robot 24/7 - Interactive JavaScript

// Global state
const state = {
    bots: [],
    servers: [],
    settings: {
        autoReconnect: true,
        notifications: true,
        reconnectDelay: 5,
        maxBots: 10
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDemoData();
    updateStats();
});

function initializeApp() {
    // Set up form listeners
    setupFormListeners();
    
    // Load saved data from localStorage if available
    loadFromStorage();
}

function setupFormListeners() {
    // Bot setup form (standalone page)
    const botSetupForm = document.getElementById('bot-setup-form');
    if (botSetupForm) {
        botSetupForm.addEventListener('submit', handleBotCreation);
    }
    
    // Dashboard bot form
    const dashboardBotForm = document.getElementById('dashboard-bot-form');
    if (dashboardBotForm) {
        dashboardBotForm.addEventListener('submit', handleBotCreation);
    }
    
    // Add server form
    const addServerForm = document.getElementById('add-server-form');
    if (addServerForm) {
        addServerForm.addEventListener('submit', handleAddServer);
    }
}

// Screen Navigation
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        
        // If switching to dashboard, show home view by default
        if (screenId === 'dashboard-screen') {
            switchDashboardView('home');
        }
    }
}

// Dashboard View Switching
function switchDashboardView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.dashboard-view');
    views.forEach(view => {
        view.classList.add('hidden');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.remove('hidden');
    }
    
    // Update stats when switching to home
    if (viewName === 'home') {
        updateStats();
    }
}

// Bot Creation Handler
function handleBotCreation(e) {
    e.preventDefault();
    
    const form = e.target;
    const botNameInput = form.querySelector('input[type="text"]');
    const versionSelect = form.querySelector('select');
    
    const botName = botNameInput.value.trim();
    const gameVersion = versionSelect.value;
    
    if (!botName || !gameVersion) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Create bot object
    const bot = {
        id: Date.now(),
        name: botName,
        version: gameVersion,
        status: 'offline',
        createdAt: new Date().toISOString()
    };
    
    // Add to state
    state.bots.push(bot);
    
    // Save to storage
    saveToStorage();
    
    // Show success message
    showToast(`Bot "${botName}" created successfully!`, 'success');
    
    // Add to activity log
    addActivity(`Bot "${botName}" created (v${gameVersion})`);
    
    // Reset form
    form.reset();
    
    // Update stats
    updateStats();
    
    // Switch to servers view in dashboard
    if (form.id === 'dashboard-bot-form') {
        switchDashboardView('servers');
    } else {
        // From standalone setup page, go to dashboard
        showScreen('dashboard-screen');
        switchDashboardView('home');
    }
}

// Server Management
function showAddServerForm() {
    const formContainer = document.getElementById('add-server-form-container');
    formContainer.classList.remove('hidden');
}

function hideAddServerForm() {
    const formContainer = document.getElementById('add-server-form-container');
    formContainer.classList.add('hidden');
    document.getElementById('add-server-form').reset();
}

function handleAddServer(e) {
    e.preventDefault();
    
    const serverName = document.getElementById('server-name').value.trim();
    const serverIp = document.getElementById('server-ip').value.trim();
    const serverPort = document.getElementById('server-port').value.trim();
    
    if (!serverName || !serverIp || !serverPort) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Create server object
    const server = {
        id: Date.now(),
        name: serverName,
        ip: serverIp,
        port: serverPort,
        status: 'offline',
        bot: null,
        addedAt: new Date().toISOString()
    };
    
    // Add to state
    state.servers.push(server);
    
    // Save to storage
    saveToStorage();
    
    // Render servers
    renderServers();
    
    // Show success message
    showToast(`Server "${serverName}" added successfully!`, 'success');
    
    // Add to activity log
    addActivity(`Server "${serverName}" added`);
    
    // Hide form
    hideAddServerForm();
    
    // Update stats
    updateStats();
}

function renderServers() {
    const serverList = document.getElementById('server-list');
    
    if (state.servers.length === 0) {
        serverList.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #b1b2b5;">
                <p style="font-size: 1.2rem;">No servers added yet</p>
                <p style="margin-top: 10px;">Click "Add Server" to get started</p>
            </div>
        `;
        return;
    }
    
    serverList.innerHTML = state.servers.map(server => `
        <div class="server-card" id="server-${server.id}">
            <div class="server-header">
                <div class="server-info">
                    <h3>${escapeHtml(server.name)}</h3>
                    <p>${escapeHtml(server.ip)}:${escapeHtml(server.port)}</p>
                </div>
                <span class="server-status ${server.status}">${server.status}</span>
            </div>
            
            <div class="server-details">
                <div class="server-detail">
                    <label>Bot:</label>
                    <span>${server.bot ? escapeHtml(server.bot) : 'None'}</span>
                </div>
                <div class="server-detail">
                    <label>Version:</label>
                    <span>${server.version || 'N/A'}</span>
                </div>
            </div>
            
            <div class="server-actions">
                <button class="button ${server.status === 'online' ? 'danger' : 'primary'}" 
                        onclick="toggleServerStatus(${server.id})">
                    ${server.status === 'online' ? 'Stop' : 'Start'}
                </button>
                <button class="button secondary" onclick="assignBotToServer(${server.id})">
                    Assign Bot
                </button>
                <button class="button danger" onclick="deleteServer(${server.id})">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function toggleServerStatus(serverId) {
    const server = state.servers.find(s => s.id === serverId);
    if (!server) return;
    
    if (server.status === 'online') {
        server.status = 'offline';
        showToast(`Server "${server.name}" stopped`, 'success');
        addActivity(`Server "${server.name}" stopped`);
    } else {
        if (!server.bot) {
            showToast('Please assign a bot to this server first', 'error');
            return;
        }
        server.status = 'online';
        showToast(`Server "${server.name}" started`, 'success');
        addActivity(`Server "${server.name}" started`);
    }
    
    saveToStorage();
    renderServers();
    updateStats();
}

function assignBotToServer(serverId) {
    const server = state.servers.find(s => s.id === serverId);
    if (!server) return;
    
    if (state.bots.length === 0) {
        showToast('Please create a bot first', 'error');
        switchDashboardView('create-bot');
        return;
    }
    
    // For demo, assign the first available bot
    const availableBot = state.bots.find(b => !state.servers.some(s => s.bot === b.name));
    if (availableBot) {
        server.bot = availableBot.name;
        server.version = availableBot.version;
        showToast(`Bot "${availableBot.name}" assigned to "${server.name}"`, 'success');
        addActivity(`Bot "${availableBot.name}" assigned to server "${server.name}"`);
    } else {
        showToast('All bots are already assigned', 'error');
    }
    
    saveToStorage();
    renderServers();
    updateStats();
}

function deleteServer(serverId) {
    const server = state.servers.find(s => s.id === serverId);
    if (!server) return;
    
    if (confirm(`Are you sure you want to delete server "${server.name}"?`)) {
        state.servers = state.servers.filter(s => s.id !== serverId);
        saveToStorage();
        renderServers();
        updateStats();
        showToast(`Server "${server.name}" deleted`, 'success');
        addActivity(`Server "${server.name}" deleted`);
    }
}

// Stats Update
function updateStats() {
    document.getElementById('total-bots').textContent = state.bots.length;
    document.getElementById('active-bots').textContent = state.servers.filter(s => s.status === 'online').length;
    document.getElementById('connected-servers').textContent = state.servers.length;
}

// Activity Log
function addActivity(text) {
    const activityList = document.getElementById('activity-list');
    const now = new Date();
    const timeStr = formatTime(now);
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <span class="activity-time">${timeStr}</span>
        <span class="activity-text">${escapeHtml(text)}</span>
    `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only last 10 activities
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
}

// Settings
function saveSettings() {
    state.settings.autoReconnect = document.getElementById('auto-reconnect').checked;
    state.settings.notifications = document.getElementById('notifications').checked;
    state.settings.reconnectDelay = parseInt(document.getElementById('reconnect-delay').value);
    state.settings.maxBots = parseInt(document.getElementById('max-bots').value);
    
    saveToStorage();
    showToast('Settings saved successfully!', 'success');
    addActivity('Settings updated');
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Storage Functions
function saveToStorage() {
    localStorage.setItem('robot247_state', JSON.stringify(state));
}

function loadFromStorage() {
    const saved = localStorage.getItem('robot247_state');
    if (saved) {
        const loadedState = JSON.parse(saved);
        Object.assign(state, loadedState);
        renderServers();
        updateStats();
    }
}

// Load Demo Data
function loadDemoData() {
    // Only load demo data if there's nothing in storage
    if (state.servers.length === 0 && state.bots.length === 0) {
        // Add demo bot
        state.bots.push({
            id: Date.now(),
            name: 'DemoBot',
            version: '1.21.1',
            status: 'offline',
            createdAt: new Date().toISOString()
        });
        
        // Add demo server
        state.servers.push({
            id: Date.now() + 1,
            name: 'Hypixel',
            ip: 'mc.hypixel.net',
            port: '25565',
            status: 'offline',
            bot: null,
            addedAt: new Date().toISOString()
        });
        
        renderServers();
        updateStats();
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Make functions globally accessible
window.showScreen = showScreen;
window.switchDashboardView = switchDashboardView;
window.showAddServerForm = showAddServerForm;
window.hideAddServerForm = hideAddServerForm;
window.toggleServerStatus = toggleServerStatus;
window.assignBotToServer = assignBotToServer;
window.deleteServer = deleteServer;
window.saveSettings = saveSettings;
