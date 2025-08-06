import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Settings, 
  LogOut, 
  Plus,
  Wifi,
  WifiOff,
  Video,
  Share2,
  Download,
  Upload
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected, onlineUsers, joinRoom } = useSocket();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, roomsResponse] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/rooms')
      ]);
      
      setUsers(usersResponse.data);
      setRooms(roomsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    const roomId = `room-${Date.now()}`;
    joinRoom(roomId);
    navigate(`/room/${roomId}`);
    setNewRoomName('');
    setShowCreateRoom(false);
  };

  const handleJoinRoom = (roomId) => {
    joinRoom(roomId);
    navigate(`/room/${roomId}`);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <nav className="dashboard-nav">
            <div className="dashboard-logo">
              <Share2 size={28} />
              Universal P2P Transfer
            </div>
            
            <div className="dashboard-user">
              <div className="user-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {connected ? (
                    <Wifi size={16} className="status-online" />
                  ) : (
                    <WifiOff size={16} className="status-offline" />
                  )}
                  <span style={{ fontSize: '14px' }}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                
                <div className="user-avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <div style={{ fontWeight: '600' }}>{user?.username}</div>
                  <div style={{ fontSize: '12px', opacity: '0.8' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-grid">
            {/* Left Sidebar - Online Users */}
            <div className="dashboard-sidebar">
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Users size={20} />
                    Online Users ({onlineUsers.length})
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {onlineUsers.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.6)',
                      padding: '20px 0'
                    }}>
                      No users online
                    </div>
                  ) : (
                    onlineUsers.map((onlineUser) => (
                      <div
                        key={onlineUser.userId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                          {onlineUser.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                            {onlineUser.username}
                          </div>
                          <div style={{ 
                            color: '#51cf66', 
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#51cf66'
                            }}></div>
                            Online
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Quick Stats</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Total Users</span>
                    <span style={{ color: 'white', fontWeight: '600' }}>{users.length}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Active Rooms</span>
                    <span style={{ color: 'white', fontWeight: '600' }}>{rooms.length}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Online Now</span>
                    <span style={{ color: '#51cf66', fontWeight: '600' }}>{onlineUsers.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content - Rooms */}
            <div className="dashboard-content">
              <div className="dashboard-panel" style={{ flex: 1 }}>
                <div className="panel-header">
                  <h3 className="panel-title">
                    <MessageCircle size={20} />
                    Available Rooms
                  </h3>
                  <button
                    onClick={() => setShowCreateRoom(!showCreateRoom)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px' }}
                  >
                    <Plus size={16} />
                    Create Room
                  </button>
                </div>

                {/* Create Room Form */}
                {showCreateRoom && (
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="input"
                        style={{ flex: 1 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                      />
                      <button
                        onClick={handleCreateRoom}
                        className="btn btn-success"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowCreateRoom(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Rooms List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rooms.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.6)',
                      padding: '40px 0'
                    }}>
                      <MessageCircle size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                      <div style={{ fontSize: '18px', marginBottom: '8px' }}>No rooms available</div>
                      <div style={{ fontSize: '14px' }}>Create a room to start sharing files and chatting</div>
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <div
                        key={room.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      >
                        <div>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                            {room.name}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                            Created by {room.createdBy} • {room.participants} participants
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          className="btn btn-primary"
                        >
                          Join Room
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Features */}
            <div className="dashboard-sidebar">
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Features</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Upload size={16} style={{ color: '#51cf66' }} />
                      <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                        File Transfer
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: 0 }}>
                      Send files directly to other users with P2P technology
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Video size={16} style={{ color: '#667eea' }} />
                      <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                        Video Chat
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: 0 }}>
                      Make video calls and share your screen in real-time
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <MessageCircle size={16} style={{ color: '#ff6b6b' }} />
                      <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                        Real-time Chat
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: 0 }}>
                      Chat with multiple users and sync clipboard content
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Settings size={16} style={{ color: '#ffd43b' }} />
                      <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                        Advanced Security
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: 0 }}>
                      End-to-end encryption with multiple security options
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Connection Status</h3>
                </div>
                
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  {connected ? (
                    <>
                      <Wifi size={32} className="status-online" style={{ marginBottom: '12px' }} />
                      <div style={{ color: '#51cf66', fontWeight: '600', marginBottom: '4px' }}>
                        Connected
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                        Ready to transfer files and chat
                      </div>
                    </>
                  ) : (
                    <>
                      <WifiOff size={32} className="status-offline" style={{ marginBottom: '12px' }} />
                      <div style={{ color: '#868e96', fontWeight: '600', marginBottom: '4px' }}>
                        Disconnected
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                        Trying to reconnect...
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
