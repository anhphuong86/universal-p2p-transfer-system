import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import FileTransfer from './FileTransfer';
import Chat from './Chat';
import VideoCall from './VideoCall';
import { 
  ArrowLeft, 
  Users, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Clipboard,
  Phone,
  PhoneOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    joinRoom, 
    currentRoom, 
    roomParticipants, 
    connected,
    startVideoCall,
    startScreenShare,
    stopScreenShare,
    syncClipboard
  } = useSocket();

  const [activeTab, setActiveTab] = useState('chat');
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const clipboardRef = useRef('');

  useEffect(() => {
    if (connected && roomId) {
      joinRoom(roomId);
    }
  }, [connected, roomId, joinRoom]);

  useEffect(() => {
    // Monitor clipboard changes
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text !== clipboardRef.current && text.trim()) {
          clipboardRef.current = text;
        }
      } catch (err) {
        // Clipboard access denied or not available
      }
    };

    const interval = setInterval(checkClipboard, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  const handleVideoCall = () => {
    if (roomParticipants.length < 2) {
      toast.error('Need at least 2 participants for video call');
      return;
    }

    const otherParticipant = roomParticipants.find(p => p.userId !== user.id);
    if (otherParticipant) {
      startVideoCall(otherParticipant.userId);
      setIsVideoCallActive(true);
    }
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
      toast.success('Screen sharing stopped');
    } else {
      startScreenShare();
      setIsScreenSharing(true);
      toast.success('Screen sharing started');
    }
  };

  const handleSyncClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        syncClipboard(text);
        toast.success('Clipboard synced with room');
      } else {
        toast.error('Clipboard is empty');
      }
    } catch (err) {
      toast.error('Failed to access clipboard');
    }
  };

  if (!connected) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Connecting to room...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      {/* Header */}
      <header className="room-header">
        <div className="container">
          <nav className="room-nav">
            <div className="room-info">
              <button
                onClick={handleLeaveRoom}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                <ArrowLeft size={16} />
                Leave Room
              </button>
              
              <div>
                <h1 className="room-title">Room {roomId}</h1>
                <div className="room-participants">
                  <Users size={14} />
                  {roomParticipants.length} participant{roomParticipants.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="room-controls">
              <button
                onClick={handleVideoCall}
                className={`btn ${isVideoCallActive ? 'btn-danger' : 'btn-primary'}`}
                disabled={roomParticipants.length < 2}
                title={roomParticipants.length < 2 ? 'Need at least 2 participants' : 'Start video call'}
              >
                {isVideoCallActive ? <PhoneOff size={16} /> : <Phone size={16} />}
                {isVideoCallActive ? 'End Call' : 'Video Call'}
              </button>

              <button
                onClick={handleScreenShare}
                className={`btn ${isScreenSharing ? 'btn-danger' : 'btn-secondary'}`}
              >
                {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
                {isScreenSharing ? 'Stop Share' : 'Share Screen'}
              </button>

              <button
                onClick={handleSyncClipboard}
                className="btn btn-secondary"
                title="Sync clipboard with room"
              >
                <Clipboard size={16} />
                Sync Clipboard
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn btn-secondary"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 0'
        }}>
          <div className="container">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ color: 'white', fontWeight: '500' }}>Room Settings:</div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <input type="checkbox" defaultChecked />
                Auto-sync clipboard
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <input type="checkbox" defaultChecked />
                Show notifications
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <input type="checkbox" />
                Auto-accept file transfers
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="room-main">
        <div className="room-content">
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: '0',
                border: 'none',
                borderBottom: activeTab === 'chat' ? '2px solid #667eea' : '2px solid transparent'
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`btn ${activeTab === 'files' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: '0',
                border: 'none',
                borderBottom: activeTab === 'files' ? '2px solid #667eea' : '2px solid transparent'
              }}
            >
              File Transfer
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: '0',
                border: 'none',
                borderBottom: activeTab === 'video' ? '2px solid #667eea' : '2px solid transparent'
              }}
            >
              Video & Screen
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'chat' && <Chat />}
            {activeTab === 'files' && <FileTransfer />}
            {activeTab === 'video' && (
              <VideoCall 
                isActive={isVideoCallActive}
                onToggle={setIsVideoCallActive}
                isScreenSharing={isScreenSharing}
                onScreenShareToggle={setIsScreenSharing}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Participants */}
        <div className="room-sidebar">
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={18} />
              Participants ({roomParticipants.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomParticipants.map((participant) => (
                <div
                  key={participant.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    background: participant.userId === user.id 
                      ? 'rgba(102, 126, 234, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                    {participant.username?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: 'white', 
                      fontWeight: '500', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {participant.username}
                      {participant.userId === user.id && (
                        <span style={{ 
                          fontSize: '10px', 
                          background: 'rgba(102, 126, 234, 0.3)',
                          color: '#667eea',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          YOU
                        </span>
                      )}
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
              ))}
            </div>
          </div>

          {/* Room Info */}
          <div style={{ padding: '20px' }}>
            <h4 style={{ 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '12px' 
            }}>
              Room Information
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  Room ID:
                </span>
                <span style={{ color: 'white', fontSize: '12px', fontFamily: 'monospace' }}>
                  {roomId}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  Status:
                </span>
                <span style={{ color: '#51cf66', fontSize: '12px' }}>
                  Active
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  Encryption:
                </span>
                <span style={{ color: '#51cf66', fontSize: '12px' }}>
                  AES-256
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
