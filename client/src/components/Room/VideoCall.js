import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Phone,
  PhoneOff,
  Camera,
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';
import toast from 'react-hot-toast';

const VideoCall = ({ isActive, onToggle, isScreenSharing, onScreenShareToggle }) => {
  const { user } = useAuth();
  const { roomParticipants, startVideoCall, respondToVideoCall } = useSocket();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize media stream
  useEffect(() => {
    if (isActive && !localStream) {
      initializeMedia();
    }
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setCallStatus('connected');
      toast.success('Camera and microphone ready');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const initializeScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track with screen share
      if (localStream && peerConnectionRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      // Update local stream
      const newStream = new MediaStream([
        stream.getVideoTracks()[0],
        localStream.getAudioTracks()[0]
      ]);
      
      setLocalStream(newStream);
      onScreenShareToggle(true);
      toast.success('Screen sharing started');
      
      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast.error('Failed to start screen sharing');
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get camera stream back
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Replace screen share with camera
      if (peerConnectionRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      setLocalStream(stream);
      onScreenShareToggle(false);
      toast.success('Screen sharing stopped');
    } catch (error) {
      console.error('Error stopping screen share:', error);
      toast.error('Failed to stop screen sharing');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      initializeScreenShare();
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    onToggle(false);
    toast.success('Call ended');
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const otherParticipants = roomParticipants.filter(p => p.userId !== user.id);

  if (!isActive) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center'
      }}>
        <Video size={64} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '24px' }} />
        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>
          Video & Screen Sharing
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', marginBottom: '32px', maxWidth: '400px' }}>
          Start a video call or share your screen with other participants in the room.
        </p>
        
        {otherParticipants.length === 0 ? (
          <div style={{ 
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            color: '#ff6b6b'
          }}>
            Need at least 2 participants to start a video call
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => onToggle(true)}
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              <Video size={20} />
              Start Video Call
            </button>
            
            <button
              onClick={handleScreenShare}
              className="btn btn-secondary"
              style={{ padding: '12px 24px' }}
            >
              <Monitor size={20} />
              Share Screen
            </button>
          </div>
        )}

        {/* Participants List */}
        {otherParticipants.length > 0 && (
          <div style={{ marginTop: '32px', width: '100%', maxWidth: '400px' }}>
            <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              Available Participants
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {otherParticipants.map(participant => (
                <div
                  key={participant.userId}
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
                    {participant.username?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                      {participant.username}
                    </div>
                    <div style={{ color: '#51cf66', fontSize: '12px' }}>
                      Ready for call
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      startVideoCall(participant.userId);
                      onToggle(true);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Call
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#000',
        position: 'relative'
      }}
    >
      {/* Video Container */}
      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        {/* Remote Video (Main) */}
        <div style={{ flex: 1, position: 'relative' }}>
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-element"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '18px'
            }}>
              {callStatus === 'calling' ? 'Calling...' : 'Waiting for participant to join'}
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '200px',
          height: '150px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          background: '#000'
        }}>
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-element"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror local video
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px'
            }}>
              No video
            </div>
          )}
        </div>

        {/* Call Status */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: callStatus === 'connected' ? '#51cf66' : '#ff6b6b'
          }}></div>
          {callStatus === 'connected' ? 'Connected' : 'Connecting...'}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      {/* Controls */}
      <div className="video-controls">
        <button
          onClick={toggleAudio}
          className={`video-control-btn ${isAudioEnabled ? '' : 'danger'}`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`video-control-btn ${isVideoEnabled ? '' : 'danger'}`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={handleScreenShare}
          className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>

        <button
          onClick={() => toast('Settings coming soon!', { icon: '⚙️' })}
          className="video-control-btn"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        <button
          onClick={handleEndCall}
          className="video-control-btn danger"
          title="End call"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Screen Share Indicator */}
      {isScreenSharing && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(102, 126, 234, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Monitor size={16} />
          You are sharing your screen
        </div>
      )}
    </div>
  );
};

export default VideoCall;
