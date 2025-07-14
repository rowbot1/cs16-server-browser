let autoRefreshInterval;
let servers = [];

async function fetchServers() {
    try {
        const response = await fetch('/api/servers');
        servers = await response.json();
        updateUI();
    } catch (error) {
        console.error('Error fetching servers:', error);
        document.getElementById('serverList').innerHTML = 
            '<div class="error">Failed to fetch servers. Please try again.</div>';
    }
}

function updateUI() {
    const serverList = document.getElementById('serverList');
    const totalServers = document.getElementById('totalServers');
    const totalPlayers = document.getElementById('totalPlayers');
    const lastUpdate = document.getElementById('lastUpdate');

    totalServers.textContent = servers.length;
    totalPlayers.textContent = servers.reduce((sum, server) => sum + server.players, 0);
    lastUpdate.textContent = new Date().toLocaleTimeString();

    if (servers.length === 0) {
        serverList.innerHTML = '<div class="no-servers">No servers found</div>';
        return;
    }

    serverList.innerHTML = servers.map(server => `
        <div class="server-card">
            <div class="server-header">
                <h3 class="server-name">${escapeHtml(server.name)}</h3>
                <span class="server-status ${server.vac ? 'vac-enabled' : ''}">${server.vac ? 'VAC' : ''}</span>
            </div>
            <div class="server-info">
                <div class="info-row">
                    <span class="label">Map:</span>
                    <span class="value">${escapeHtml(server.map)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Players:</span>
                    <span class="value">${server.players}/${server.maxPlayers}</span>
                    <div class="player-bar">
                        <div class="player-fill" style="width: ${(server.players / server.maxPlayers) * 100}%"></div>
                    </div>
                </div>
                <div class="info-row">
                    <span class="label">IP:</span>
                    <span class="value">${server.ip}:${server.port}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleAutoRefresh() {
    const checkbox = document.getElementById('autoRefresh');
    
    if (checkbox.checked) {
        autoRefreshInterval = setInterval(fetchServers, 60000);
    } else {
        clearInterval(autoRefreshInterval);
    }
}

document.getElementById('refreshBtn').addEventListener('click', fetchServers);
document.getElementById('autoRefresh').addEventListener('change', toggleAutoRefresh);

fetchServers();
toggleAutoRefresh();