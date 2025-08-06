import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Upload, 
  Download, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  Check,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const FileTransfer = () => {
  const { user } = useAuth();
  const { 
    roomParticipants, 
    fileTransfers, 
    sendFileTransferRequest, 
    respondToFileTransfer 
  } = useSocket();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [transferProgress, setTransferProgress] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB limit
  });

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image size={20} />;
    if (fileType.startsWith('video/')) return <Video size={20} />;
    if (fileType.startsWith('audio/')) return <Music size={20} />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive size={20} />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileText size={20} />;
    return <File size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSendFiles = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to send');
      return;
    }

    if (!selectedRecipient) {
      toast.error('Please select a recipient');
      return;
    }

    selectedFiles.forEach(fileData => {
      sendFileTransferRequest(
        selectedRecipient,
        fileData.name,
        fileData.size,
        fileData.type
      );
    });

    toast.success(`Sending ${selectedFiles.length} file(s) to recipient`);
    setSelectedFiles([]);
  };

  const handleAcceptTransfer = (transferId) => {
    respondToFileTransfer(transferId, true);
  };

  const handleRejectTransfer = (transferId) => {
    respondToFileTransfer(transferId, false);
  };

  const getTransferStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="status-busy" />;
      case 'accepted':
        return <Check size={16} className="status-online" />;
      case 'rejected':
        return <X size={16} className="status-offline" />;
      case 'completed':
        return <Check size={16} className="status-online" />;
      case 'failed':
        return <AlertCircle size={16} className="status-offline" />;
      default:
        return <Clock size={16} className="status-busy" />;
    }
  };

  const otherParticipants = roomParticipants.filter(p => p.userId !== user.id);
  const incomingTransfers = fileTransfers.filter(t => t.targetUserId === user.id);
  const outgoingTransfers = fileTransfers.filter(t => t.senderId === user.id);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px',
      gap: '24px'
    }}>
      {/* File Drop Zone */}
      <div className="card">
        <h3 style={{ 
          color: 'white', 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Upload size={20} />
          Send Files
        </h3>

        <div
          {...getRootProps()}
          className={`file-drop-zone ${isDragActive ? 'drag-over' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload size={32} style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }} />
          <div className="file-drop-text">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
          </div>
          <div className="file-drop-hint">
            or click to browse (max 100MB per file)
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              Selected Files ({selectedFiles.length})
            </h4>
            
            <div className="file-list">
              {selectedFiles.map((fileData) => (
                <div key={fileData.id} className="file-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {fileData.preview ? (
                      <img
                        src={fileData.preview}
                        alt={fileData.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                      />
                    ) : (
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {getFileIcon(fileData.type)}
                      </div>
                    )}
                    
                    <div className="file-info">
                      <div className="file-name">{fileData.name}</div>
                      <div className="file-size">{formatFileSize(fileData.size)}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 8px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Recipient Selection */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              >
                <option value="">Select recipient...</option>
                {otherParticipants.map(participant => (
                  <option key={participant.userId} value={participant.userId}>
                    {participant.username}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleSendFiles}
                className="btn btn-primary"
                disabled={!selectedRecipient}
              >
                Send Files
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1 }}>
        {/* Incoming Transfers */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Download size={18} />
            Incoming ({incomingTransfers.length})
          </h3>

          {incomingTransfers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '20px 0'
            }}>
              No incoming transfers
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incomingTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                        {transfer.fileName}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                        From {transfer.senderUsername} • {formatFileSize(transfer.fileSize)}
                      </div>
                    </div>
                    {getTransferStatusIcon(transfer.status)}
                  </div>

                  {transfer.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAcceptTransfer(transfer.id)}
                        className="btn btn-success"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {transfer.status === 'accepted' && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${transferProgress[transfer.id] || 0}%` }}
                        ></div>
                      </div>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        fontSize: '12px', 
                        marginTop: '4px' 
                      }}>
                        {transferProgress[transfer.id] || 0}% complete
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing Transfers */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Upload size={18} />
            Outgoing ({outgoingTransfers.length})
          </h3>

          {outgoingTransfers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '20px 0'
            }}>
              No outgoing transfers
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {outgoingTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                        {transfer.fileName}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                        To recipient • {formatFileSize(transfer.fileSize)}
                      </div>
                    </div>
                    {getTransferStatusIcon(transfer.status)}
                  </div>

                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}>
                    Status: {transfer.status}
                  </div>

                  {transfer.status === 'accepted' && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${transferProgress[transfer.id] || 0}%` }}
                        ></div>
                      </div>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        fontSize: '12px', 
                        marginTop: '4px' 
                      }}>
                        {transferProgress[transfer.id] || 0}% complete
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTransfer;
