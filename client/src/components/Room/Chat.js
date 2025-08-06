import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Image, Paperclip, Smile } from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    typingUsers, 
    startTyping, 
    stopTyping 
  } = useSocket();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    sendMessage(inputMessage.trim());
    setInputMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        sendMessage(event.target.result, 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="chat-messages">
        {Object.keys(messageGroups).length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}>💬</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No messages yet</div>
            <div style={{ fontSize: '14px' }}>Start a conversation with your team</div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <div style={{ padding: '0 16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                  {date}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.userId === user.id ? 'own' : 'other'}`}
                >
                  {message.userId !== user.id && (
                    <div className="username">{message.username}</div>
                  )}
                  
                  {message.type === 'image' ? (
                    <div>
                      <img
                        src={message.message}
                        alt="Shared image"
                        style={{
                          maxWidth: '300px',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(message.message, '_blank')}
                      />
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.message}</div>
                  )}
                  
                  <div className="timestamp">{formatTime(message.timestamp)}</div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div style={{
            padding: '8px 12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            {typingUsers.length === 1 
              ? `${typingUsers[0].username} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div style={{ position: 'relative', flex: 1 }}>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              rows={1}
              style={{
                resize: 'none',
                paddingRight: '100px'
              }}
            />
            
            {/* Input Actions */}
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '8px'
            }}>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Image 
                  size={18} 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                />
              </label>
              
              <Paperclip 
                size={18} 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                onClick={() => toast('File attachments coming soon!', { icon: '📎' })}
              />
              
              <Smile 
                size={18} 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                onClick={() => toast('Emoji picker coming soon!', { icon: '😊' })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputMessage.trim()}
          >
            <Send size={18} />
          </button>
        </form>

        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setInputMessage('👍')}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            👍
          </button>
          <button
            onClick={() => setInputMessage('Thanks!')}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            Thanks!
          </button>
          <button
            onClick={() => setInputMessage('Got it!')}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            Got it!
          </button>
          <button
            onClick={() => setInputMessage('On my way!')}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            On my way!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
