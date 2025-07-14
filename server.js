const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const dgram = require('dgram');
const path = require('path');

const app = express();
const PORT = 5002;
const cache = new NodeCache({ stdTTL: 60 });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const A2S_INFO = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x54, 0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00]);

function queryServer(ip, port) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        const timeout = setTimeout(() => {
            client.close();
            reject(new Error('Timeout'));
        }, 2000);

        client.on('message', (msg) => {
            clearTimeout(timeout);
            client.close();
            
            if (msg.length < 5) {
                reject(new Error('Invalid response'));
                return;
            }

            try {
                let offset = 4;
                if (msg[offset] !== 0x49) {
                    reject(new Error('Invalid response type'));
                    return;
                }
                offset++;

                const protocol = msg[offset];
                offset++;

                const nameEnd = msg.indexOf(0, offset);
                const name = msg.toString('utf8', offset, nameEnd);
                offset = nameEnd + 1;

                const mapEnd = msg.indexOf(0, offset);
                const map = msg.toString('utf8', offset, mapEnd);
                offset = mapEnd + 1;

                const folderEnd = msg.indexOf(0, offset);
                const folder = msg.toString('utf8', offset, folderEnd);
                offset = folderEnd + 1;

                const gameEnd = msg.indexOf(0, offset);
                const game = msg.toString('utf8', offset, gameEnd);
                offset = gameEnd + 1;

                const appId = msg.readUInt16LE(offset);
                offset += 2;

                const players = msg[offset];
                offset++;

                const maxPlayers = msg[offset];
                offset++;

                const bots = msg[offset];
                offset++;

                const serverType = String.fromCharCode(msg[offset]);
                offset++;

                const environment = String.fromCharCode(msg[offset]);
                offset++;

                const visibility = msg[offset];
                offset++;

                const vac = msg[offset];

                resolve({
                    ip,
                    port,
                    name,
                    map,
                    game,
                    players,
                    maxPlayers,
                    bots,
                    serverType,
                    vac: vac === 1,
                    online: true
                });
            } catch (err) {
                reject(err);
            }
        });

        client.on('error', (err) => {
            clearTimeout(timeout);
            client.close();
            reject(err);
        });

        client.send(A2S_INFO, port, ip);
    });
}

async function fetchServerList() {
    try {
        const response = await axios.get('https://api.steampowered.com/IGameServersService/GetServerList/v1/', {
            params: {
                key: 'YOUR_STEAM_API_KEY',
                filter: 'appid\\10',
                limit: 100
            }
        });
        
        if (response.data && response.data.response && response.data.response.servers) {
            return response.data.response.servers.map(server => {
                const [ip, port] = server.addr.split(':');
                return { ip, port: parseInt(port) };
            });
        }
    } catch (error) {
        console.error('Error fetching from Steam API:', error.message);
    }

    return [
        { ip: '185.44.253.5', port: 27015 },
        { ip: '193.26.217.201', port: 27015 },
        { ip: '45.235.98.76', port: 27015 },
        { ip: '94.242.56.173', port: 27015 },
        { ip: '185.107.96.107', port: 27015 },
        { ip: '176.57.168.14', port: 27015 },
        { ip: '193.26.217.213', port: 27015 },
        { ip: '46.174.53.245', port: 27015 },
        { ip: '185.158.211.144', port: 27015 },
        { ip: '176.57.168.71', port: 27015 }
    ];
}

app.get('/api/servers', async (req, res) => {
    const cachedServers = cache.get('servers');
    if (cachedServers) {
        return res.json(cachedServers);
    }

    try {
        const serverList = await fetchServerList();
        const serverPromises = serverList.map(server => 
            queryServer(server.ip, server.port).catch(err => ({
                ip: server.ip,
                port: server.port,
                online: false,
                error: err.message
            }))
        );

        const servers = await Promise.all(serverPromises);
        const onlineServers = servers.filter(s => s.online);
        
        cache.set('servers', onlineServers);
        res.json(onlineServers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});