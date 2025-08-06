import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fileTransfers, setFileTransfers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const { user, token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || window.location.origin, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        toast.success('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
        toast.error('Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
        toast.error('Connection failed');
      });

      // User status events
      newSocket.on('user-online', (data) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
        toast.success(`${data.username} is now online`);
      });

      newSocket.on('user-offline', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        toast(`${data.username} went offline`, { icon: '👋' });
      });

      // Room events
      newSocket.on('room-joined', (data) => {
        setCurrentRoom(data.roomId);
        setRoomParticipants(data.participants);
        setMessages([]);
        toast.success(`Joined room ${data.roomId}`);
      });

      newSocket.on('user-joined', (data) => {
        setRoomParticipants(prev => {
          const exists = prev.find(p => p.userId === data.userId);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
        toast.success(`${data.username} joined the room`);
      });

      newSocket.on('user-left', (data) => {
        setRoomParticipants(prev => prev.filter(p => p.userId !== data.userId));
        toast(`${data.username} left the room`, { icon: '👋' });
      });

      // Chat events
      newSocket.on('chat-message', (message) => {
        setMessages(prev => [...prev, message]);
        
        // Show notification if message is from another user
        if (message.userId !== user.id) {
          toast(`${message.username}: ${message.message}`, {
            icon: '💬',
            duration: 3000
          });
        }
      });

      // Typing events
      newSocket.on('typing-start', (data) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => {
            const exists = prev.find(u => u.userId === data.userId);
            if (!exists) {
              return [...prev, data];
            }
            return prev;
          });
        }
      });

      newSocket.on('typing-stop', (data) => {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      // File transfer events
      newSocket.on('file-transfer-request', (transfer) => {
        setFileTransfers(prev => [...prev, transfer]);
        toast(`${transfer.senderUsername} wants to send you a file: ${transfer.fileName}`, {
          icon: '📁',
          duration: 10000
        });
      });

      newSocket.on('file-transfer-response', (data) => {
        setFileTransfers(prev => 
          prev.map(t => 
            t.id === data.transferId 
              ? { ...t, status: data.accepted ? 'accepted' : 'rejected' }
              : t
          )
        );
        
        if (data.accepted) {
          toast.success(`${data.targetUsername} accepted your file transfer`);
        } else {
          toast.error(`${data.targetUsername} rejected your file transfer`);
        }
      });

      // Video call events
      newSocket.on('video-call-request', (data) => {
        toast(`${data.callerUsername} is calling you`, {
          icon: '📹',
          duration: 10000
        });
      });

      newSocket.on('video-call-response', (data) => {
        if (data.accepted) {
          toast.success(`${data.targetUsername} accepted your call`);
        } else {
          toast.error(`${data.targetUsername} declined your call`);
        }
      });

      // Screen sharing events
      newSocket.on('screen-share-start', (data) => {
        toast(`${data.username} started screen sharing`, {
          icon: '🖥️'
        });
      });

      newSocket.on('screen-share-stop', (data) => {
        toast(`${data.username} stopped screen sharing`, {
          icon: '🖥️'
        });
      });

      // Clipboard sync events
      newSocket.on('clipboard-sync', (data) => {
        if (data.userId !== user.id) {
          // Copy to clipboard
          navigator.clipboard.writeText(data.content).then(() => {
            toast(`Clipboard synced from ${data.username}`, {
              icon: '📋'
            });
          }).catch(err => {
            console.error('Failed to sync clipboard:', err);
          });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
        setCurrentRoom(null);
        setRoomParticipants([]);
        setMessages([]);
        setFileTransfers([]);
        setTypingUsers([]);
      };
    }
  }, [user, token]);

  // Socket methods
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const sendMessage = (message, type = 'text') => {
    if (socket && currentRoom) {
      const messageData = {
        roomId: currentRoom,
        message,
        type
      };
      socket.emit('chat-message', messageData);
    }
  };

  const sendFileTransferRequest = (targetUserId, fileName, fileSize, fileType) => {
    if (socket && currentRoom) {
      socket.emit('file-transfer-request', {
        targetUserId,
        fileName,
        fileSize,
        fileType,
        roomId: currentRoom
      });
    }
  };

  const respondToFileTransfer = (transferId, accepted) => {
    if (socket) {
      socket.emit('file-transfer-response', {
        transferId,
        accepted
      });
    }
  };

  const startVideoCall = (targetUserId) => {
    if (socket && currentRoom) {
      socket.emit('video-call-request', {
        targetUserId,
        roomId: currentRoom
      });
    }
  };

  const respondToVideoCall = (callerId, accepted) => {
    if (socket) {
      socket.emit('video-call-response', {
        callerId,
        accepted
      });
    }
  };

  const startScreenShare = () => {
    if (socket && currentRoom) {
      socket.emit('screen-share-start', {
        roomId: currentRoom
      });
    }
  };

  const stopScreenShare = () => {
    if (socket && currentRoom) {
      socket.emit('screen-share-stop', {
        roomId: currentRoom
      });
    }
  };

  const syncClipboard = (content, type = 'text') => {
    if (socket && currentRoom) {
      socket.emit('clipboard-sync', {
        roomId: currentRoom,
        content,
        type
      });
    }
  };

  const startTyping = () => {
    if (socket && currentRoom) {
      socket.emit('typing-start', {
        roomId: currentRoom
      });
    }
  };

  const stopTyping = () => {
    if (socket && currentRoom) {
      socket.emit('typing-stop', {
        roomId: currentRoom
      });
    }
  };

  // WebRTC signaling methods
  const sendWebRTCOffer = (targetUserId, offer, transferId) => {
    if (socket) {
      socket.emit('webrtc-offer', {
        targetUserId,
        offer,
        transferId
      });
    }
  };

  const sendWebRTCAnswer = (targetUserId, answer, transferId) => {
    if (socket) {
      socket.emit('webrtc-answer', {
        targetUserId,
        answer,
        transferId
      });
    }
  };

  const sendWebRTCIceCandidate = (targetUserId, candidate, transferId) => {
    if (socket) {
      socket.emit('webrtc-ice-candidate', {
        targetUserId,
        candidate,
        transferId
      });
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    currentRoom,
    roomParticipants,
    messages,
    fileTransfers,
    typingUsers,
    joinRoom,
    sendMessage,
    sendFileTransferRequest,
    respondToFileTransfer,
    startVideoCall,
    respondToVideoCall,
    startScreenShare,
    stopScreenShare,
    syncClipboard,
    startTyping,
    stopTyping,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
