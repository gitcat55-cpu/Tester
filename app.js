

const getServerData = () => {
  const ip = document.getElementById("ip").value.trim();
  const port = document.getElementById("port").value.trim();
  const title = document.getElementById("title").value.trim();

  return {
    ip: ip,
    port: port,
    title: title
  };
};



Management
const appState = {
    bots: [],
    servers: [],
    activeBots: 0,
    currentScreen: 'welcome-screen',
    currentSection: 'home'
};

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSavedData();
    updateStats();
});

// Initialize application
function initializeApp() {
    console.log('Robot 24/7 initialized');
    
    // Add sample server for demo
    if (appState.servers.length === 0) {
        addSampleServer();
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
        appState.currentScreen = screenId;

        // Update header based on screen
        updateHeader(screenId);

        // If showing dashboard, show default section
        if (screenId === 'dashboard-screen') {
            showDashboardSection('home');
        }
    }
}

// Dashboard Section Navigation
function showDashboardSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
        appState.currentSection = sectionId;
    }
}

// Update Header
function updateHeader(screenId) {
    const headerSubtitle = document.getElementById('header-subtitle');
    
    if (screenId === 'welcome-screen') {
        headerSubtitle.textContent = 'Minecraft Bot Control Platform';
    } else if (screenId === 'dashboard-screen') {
        headerSubtitle.textContent = 'Control Panel';
    }
}

// Create Bot
function createBot(event) {
    event.preventDefault();
    
    const botName = document.getElementById('bot-name').value;
    const gameVersion = document.getElementById('game-version').value;

    if (!botName || !gameVersion) {
        showToast('Please fill in all fields', 'error');
        return false;
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
    appState.bots.push(bot);
    
    // Save to localStorage
    saveData();

    // Show success message
    showToast(`Bot "${botName}" created successfully!`, 'success');

    // Reset form
    document.getElementById('create-bot-form').reset();

    // Update stats
    updateStats();

    // Navigate to servers section
    setTimeout(() => {
        showDashboardSection('servers');
    }, 1500);

    return false;
}

// Add Server
function addServer(event) {
    event.preventDefault();

    const serverName = document.getElementById('server-name').value;
    const serverIp = document.getElementById('server-ip').value;
    const serverPort = document.getElementById('server-port').value;

    if (!serverName || !serverIp || !serverPort) {
        showToast('Please fill in all fields', 'error');
        return false;
    }

    // Create server object
    const server = {
        id: Date.now(),
        name: serverName,
        ip: serverIp,
        port: serverPort,
        status: 'offline',
        botRunning: false
    };

    // Add to state
    appState.servers.push(server);

    // Save to localStorage
    saveData();

    // Show success message
    showToast(`Server "${serverName}" added successfully!`, 'success');

    // Reset form
    document.getElementById('add-server-form').reset();

    // Update server list
    renderServerList();

    // Update stats
    updateStats();

    return false;
}



// Render Server List
function renderServerList() {
    const serverList = document.getElementById('server-list');
    
    if (!serverList) return;

    if (appState.servers.length === 0) {
        serverList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #b1b2b5;">
                <p>No servers added yet. Add your first server above!</p>
            </div>
        `;
        return;
    }

    serverList.innerHTML = '';

    appState.servers.forEach(server => {
        const serverCard = createServerCard(server);
        serverList.appendChild(serverCard);
    });
}

// Create Server Card Element
function createServerCard(server) {
    const card = document.createElement('div');
    card.className = 'server-card';
    card.style.animationDelay = '0.1s';

    const statusClass = server.status === 'online' ? 'online' : 'offline';
    const botStatusClass = server.botRunning ? 'glow-online' : '';

    card.innerHTML = `
        <div class="server-info">
            <h4>${server.name}</h4>
            <p class="server-details">${server.ip}:${server.port}</p>
            <span class="server-status ${statusClass} ${botStatusClass}">
                ${server.status === 'online' ? '● Online' : '● Offline'}
            </span>
        </div>
        <div class="server-actions">
            ${server.botRunning 
                ? `<button class="button danger" onclick="stopBot(${server.id})">Stop Bot</button>`
                : `<button class="button primary" onclick="startBot(${server.id})">Start Bot</button>`
            }
            <button class="button destructive" onclick="deleteServer(${server.id})">Delete</button>
        </div>
    `;

    return card;
}

// Start Bot
function startBot(serverId) {
    const server = appState.servers.find(s => s.id === serverId);
    
    if (!server) return;

    if (appState.bots.length === 0) {
        showToast('Please create a bot first!', 'error');
        showDashboardSection('create-bot');
        return;
    }

    server.botRunning = true;
    server.status = 'online';
    appState.activeBots++;

    saveData();
    renderServerList();
    updateStats();

    showToast(`Bot started on ${server.name}`, 'success');
}

// Stop Bot
function stopBot(serverId) {
    const server = appState.servers.find(s => s.id === serverId);
    
    if (!server) return;

    server.botRunning = false;
    server.status = 'offline';
    appState.activeBots = Math.max(0, appState.activeBots - 1);

    saveData();
    renderServerList();
    updateStats();

    showToast(`Bot stopped on ${server.name}`, 'success');
}

// Delete Server
function deleteServer(serverId) {
    if (!confirm('Are you sure you want to delete this server?')) {
        return;
    }

    const serverIndex = appState.servers.findIndex(s => s.id === serverId);
    
    if (serverIndex === -1) return;

    const server = appState.servers[serverIndex];
    
    if (server.botRunning) {
        appState.activeBots = Math.max(0, appState.activeBots - 1);
    }

    appState.servers.splice(serverIndex, 1);

    saveData();
    renderServerList();
    updateStats();

    showToast('Server deleted', 'success');
}

// Update Statistics
function updateStats() {
    const activeBotsCount = document.getElementById('active-bots-count');
    const serverCount = document.getElementById('server-count');

    if (activeBotsCount) {
        activeBotsCount.textContent = appState.activeBots;
    }

    if (serverCount) {
        serverCount.textContent = appState.servers.length;
    }
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Save Data to localStorage
function saveData() {
    try {
        localStorage.setItem('robot247-bots', JSON.stringify(appState.bots));
        localStorage.setItem('robot247-servers', JSON.stringify(appState.servers));
        localStorage.setItem('robot247-activeBots', appState.activeBots.toString());
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

// Load Data from localStorage
function loadSavedData() {
    try {
        const savedBots = localStorage.getItem('robot247-bots');
        const savedServers = localStorage.getItem('robot247-servers');
        const savedActiveBots = localStorage.getItem('robot247-activeBots');

        if (savedBots) {
            appState.bots = JSON.parse(savedBots);
        }

        if (savedServers) {
            appState.servers = JSON.parse(savedServers);
            renderServerList();
        }

        if (savedActiveBots) {
            appState.activeBots = parseInt(savedActiveBots, 10);
        }
    } catch (e) {
        console.error('Failed to load saved data:', e);
    }
}

// Clear all data (for testing)
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.clear();
        appState.bots = [];
        appState.servers = [];
        appState.activeBots = 0;
        
        renderServerList();
        updateStats();
        
        showToast('All data cleared', 'success');
    }
}

// Export functions for global access
window.showScreen = showScreen;
window.showDashboardSection = showDashboardSection;
window.createBot = createBot;
window.addServer = addServer;
window.startBot = startBot;
window.stopBot = stopBot;
window.deleteServer = deleteServer;
window.clearAllData = clearAllData;
