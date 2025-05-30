const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Map(); // Store clients with additional metadata
    this.rooms = new Map(); // Store rooms and their clients
    
    this.setupEventHandlers();
    logger.info('WebSocket Service initialized');
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientId = req.headers['sec-websocket-key'] || Date.now().toString();
      const ip = req.socket.remoteAddress;
      
      // Add client to clients map
      const clientData = {
        id: clientId,
        ip,
        ws,
        rooms: new Set(),
        lastActivity: Date.now()
      };
      
      this.clients.set(ws, clientData);
      
      logger.info(`Client connected: ${clientId} (${ip})`);
      
      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to MCP Server',
        version: '1.0.0'
      });
      
      // Handle messages
      ws.on('message', (message) => this.handleMessage(ws, message));
      
      // Handle close
      ws.on('close', () => this.handleClose(ws));
      
      // Handle errors
      ws.on('error', (error) => this.handleError(ws, error));
    });
  }
  
  handleMessage(ws, message) {
    const client = this.clients.get(ws);
    if (!client) return;
    
    client.lastActivity = Date.now();
    
    try {
      const data = JSON.parse(message);
      logger.info(`Message from ${client.id}: ${JSON.stringify(data)}`);
      
      // Handle different message types
      switch (data.type) {
        case 'join':
          this.handleJoinRoom(ws, data.room);
          break;
        case 'leave':
          this.handleLeaveRoom(ws, data.room);
          break;
        case 'broadcast':
          this.broadcastToRoom(data.room, {
            type: 'message',
            from: client.id,
            room: data.room,
            content: data.content,
            timestamp: new Date().toISOString()
          });
          break;
        default:
          // Echo back the message
          this.sendToClient(ws, {
            type: 'echo',
            received: data,
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      logger.error(`Error processing message: ${error.message}`);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format',
        error: error.message
      });
    }
  }
  
  handleClose(ws) {
    const client = this.clients.get(ws);
    if (!client) return;
    
    // Remove client from all rooms
    client.rooms.forEach(room => this.handleLeaveRoom(ws, room, false));
    
    // Remove client from clients map
    this.clients.delete(ws);
    
    logger.info(`Client disconnected: ${client.id}`);
  }
  
  handleError(ws, error) {
    const client = this.clients.get(ws);
    const clientId = client ? client.id : 'unknown';
    logger.error(`WebSocket error for client ${clientId}: ${error.message}`);
  }
  
  handleJoinRoom(ws, roomName) {
    const client = this.clients.get(ws);
    if (!client || !roomName) return false;
    
    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    
    const room = this.rooms.get(roomName);
    
    // Add client to room
    room.add(ws);
    client.rooms.add(roomName);
    
    // Notify client
    this.sendToClient(ws, {
      type: 'room_joined',
      room: roomName,
      timestamp: new Date().toISOString()
    });
    
    // Notify others in the room
    this.broadcastToRoom(roomName, {
      type: 'room_notification',
      message: `User ${client.id} joined the room`,
      room: roomName,
      timestamp: new Date().toISOString()
    }, ws);
    
    logger.info(`Client ${client.id} joined room: ${roomName}`);
    return true;
  }
  
  handleLeaveRoom(ws, roomName, notify = true) {
    const client = this.clients.get(ws);
    if (!client || !roomName || !this.rooms.has(roomName)) return false;
    
    const room = this.rooms.get(roomName);
    
    // Remove client from room
    room.delete(ws);
    client.rooms.delete(roomName);
    
    // Clean up empty rooms
    if (room.size === 0) {
      this.rooms.delete(roomName);
    }
    
    if (notify) {
      // Notify client
      this.sendToClient(ws, {
        type: 'room_left',
        room: roomName,
        timestamp: new Date().toISOString()
      });
      
      // Notify others in the room
      this.broadcastToRoom(roomName, {
        type: 'room_notification',
        message: `User ${client.id} left the room`,
        room: roomName,
        timestamp: new Date().toISOString()
      }, ws);
    }
    
    logger.info(`Client ${client.id} left room: ${roomName}`);
    return true;
  }
  
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
  
  broadcastToRoom(roomName, data, excludeWs = null) {
    if (!this.rooms.has(roomName)) return;
    
    const room = this.rooms.get(roomName);
    const message = JSON.stringify(data);
    
    room.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  broadcastToAll(data, excludeWs = null) {
    const message = JSON.stringify(data);
    
    this.clients.forEach((clientData, client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.keys())
    };
  }
}

module.exports = WebSocketService;
