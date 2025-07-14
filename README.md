# CS 1.6 Server Browser

A web application that displays live Counter-Strike 1.6 game servers with real-time updates.

## Features

- Live server list with player counts
- Auto-refresh every 60 seconds
- Server information (name, map, players, IP)
- VAC status indicator
- Responsive design

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Add your Steam API key in `server.js` to get more servers

3. Start the server:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## How it works

The application uses the Source Server Query Protocol (A2S_INFO) to query CS 1.6 servers directly via UDP. Server information is cached for 60 seconds to improve performance.