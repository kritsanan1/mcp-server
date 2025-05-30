# MCP (Model Context Protocol) Server

A simple MCP server implementation with WebSocket and REST API support.

## Features

- WebSocket server for real-time communication
- REST API endpoints
- Static file serving
- CORS support

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Server

Start the server with the following command:

```bash
node server.js
```

The server will start on port 3000 by default. You can change the port by setting the `PORT` environment variable.

## API Endpoints

- `GET /` - Server status
- `POST /api/echo` - Echo the provided message
  - Request body: `{ "message": "Hello" }`
  - Response: `{ "echo": "Hello" }`

## WebSocket

The WebSocket server runs on the same port as the HTTP server. Connect using:

```
ws://localhost:3000
```

## Testing

Open your browser and navigate to:

```
http://localhost:3000
```

You'll find a test page where you can:
- Test WebSocket connections
- Send and receive messages
- Test the REST API

## License

This project is open source and available under the [MIT License](LICENSE).
