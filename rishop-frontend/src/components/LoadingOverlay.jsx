import React, { useContext } from 'react';
import AppContext from '../Context/Context';

const LoadingOverlay = () => {
  const { pageLoading } = useContext(AppContext);
  
  if (!pageLoading) return null;
  
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
