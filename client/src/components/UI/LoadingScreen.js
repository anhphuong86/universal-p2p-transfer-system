import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
