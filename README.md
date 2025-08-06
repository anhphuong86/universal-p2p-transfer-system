# Universal P2P Transfer System

A comprehensive peer-to-peer file transfer and communication system that works over the internet, built with modern web technologies.

## 🚀 Features

### Core Features
- **Real-time Chat**: Instant messaging with typing indicators and message history
- **File Transfer**: Direct P2P file sharing with drag & drop support
- **Video Calling**: WebRTC-based video calls with screen sharing
- **Cross-platform**: Works on desktop and mobile browsers
- **Internet-ready**: NAT traversal support for connections over the internet

### Advanced Features
- **Screen Sharing**: Share your screen during video calls
- **Clipboard Sync**: Synchronize clipboard content between devices
- **Multiple File Support**: Send multiple files simultaneously
- **Transfer Resume**: Continue interrupted file transfers
- **End-to-End Encryption**: Secure communication with multiple encryption options
- **User Management**: Multi-user support with authentication
- **Room-based Communication**: Create and join rooms for group collaboration

### Security Features
- **JWT Authentication**: Secure user authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against abuse
- **CORS Protection**: Secure cross-origin requests
- **Helmet Security**: Additional security headers

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **Socket.IO Client**: Real-time communication
- **React Router**: Client-side routing
- **React Dropzone**: File drag & drop functionality
- **React Hot Toast**: Beautiful notifications
- **Lucide React**: Modern icon library
- **Axios**: HTTP client for API requests

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Compression**: Response compression

### Communication
- **WebRTC**: Peer-to-peer communication
- **WebSocket**: Real-time messaging
- **STUN/TURN**: NAT traversal (planned)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd universal-p2p-transfer
```

2. **Install dependencies**
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
PORT=8000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

4. **Start the application**
```bash
# Development mode (runs both server and client)
npm run dev

# Or start separately
npm run server  # Start server only
npm run client  # Start client only (in another terminal)
```

5. **Access the application**
Open your browser and navigate to `http://localhost:3000`

## 🎯 Usage

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Dashboard**: View online users and available rooms
3. **Create Room**: Start a new room for collaboration
4. **Join Room**: Enter an existing room to start communicating

### File Transfer
1. Navigate to the "File Transfer" tab in a room
2. Drag & drop files or click to browse
3. Select recipient from the dropdown
4. Click "Send Files" to initiate transfer
5. Recipients can accept or reject incoming transfers

### Video Calling
1. Go to the "Video & Screen" tab
2. Click "Start Video Call" (requires 2+ participants)
3. Use controls to toggle camera, microphone, and screen sharing
4. Click "End Call" to terminate the session

### Chat
1. Use the "Chat" tab for real-time messaging
2. Type messages and press Enter to send
3. Upload images using the image icon
4. Use quick action buttons for common responses

## 🏗️ Architecture

### Client-Server Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Express Server │◄──►│   React Client  │
│   (Browser)     │    │   (Node.js)     │    │   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │   Memory Store  │    │  Local Storage  │
│   (Browser)     │    │   (Server)      │    │   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Communication Flow
1. **Authentication**: JWT-based user authentication
2. **Socket Connection**: WebSocket connection for real-time communication
3. **Room Management**: Server manages rooms and participants
4. **P2P Signaling**: Server facilitates WebRTC connection setup
5. **Direct Transfer**: Files transferred directly between peers

## 🔧 Development

### Project Structure
```
├── server/
│   └── index.js              # Express server and Socket.IO setup
├── client/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Auth/         # Authentication components
│   │   │   ├── Dashboard/    # Dashboard components
│   │   │   ├── Room/         # Room-related components
│   │   │   └── UI/           # Reusable UI components
│   │   ├── contexts/         # React contexts
│   │   └── App.js            # Main App component
├── package.json              # Server dependencies
└── README.md
```

### Available Scripts

**Server Scripts:**
- `npm run server` - Start development server with nodemon
- `npm start` - Start production server

**Client Scripts:**
- `npm run client` - Start React development server
- `npm run build` - Build React app for production

**Combined Scripts:**
- `npm run dev` - Start both server and client concurrently

### Adding New Features

1. **Backend**: Add new Socket.IO events in `server/index.js`
2. **Frontend**: Create components in appropriate directories
3. **Context**: Update contexts for state management
4. **Styling**: Use the existing CSS classes and design system

## 🚀 Deployment

### Production Build
```bash
# Build the client
cd client
npm run build
cd ..

# Start production server
npm start
```

### Environment Variables
Set the following environment variables for production:
- `PORT`: Server port (default: 8000)
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Set to 'production'

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN cd client && npm ci && npm run build
EXPOSE 8000
CMD ["npm", "start"]
```

## 🔒 Security Considerations

- JWT tokens for authentication
- Password hashing with bcrypt
- CORS protection enabled
- Rate limiting implemented
- Input validation and sanitization
- Secure headers with Helmet
- Environment variables for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the original P2Lan Transfer project
- Built with modern web technologies
- Thanks to the open-source community for the amazing libraries

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Provide steps to reproduce the problem

---

**Universal P2P Transfer** - Making file sharing and communication seamless across the internet! 🌐
