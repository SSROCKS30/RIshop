import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import AppContext from '../Context/Context';

const ProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigationType = useNavigationType(); // POP for back/forward navigation, PUSH for normal navigation
  const { setPageLoading } = useContext(AppContext);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Check if this is a new location (not just a re-render)
    if (prevPathRef.current === location.pathname) {
      return;
    }
    
    // Update the previous path reference
    prevPathRef.current = location.pathname;
    
    // Show progress bar and reset progress when location changes
    setIsVisible(true);
    setProgress(0);
    
    // Only show loading overlay for forward navigation (not when going back)
    const isBackNavigation = navigationType === 'POP';
    if (!isBackNavigation) {
      setPageLoading(true); // Set loading state to true
    }
    
    // Simulate progress with slightly longer times
    const timer1 = setTimeout(() => setProgress(30), 150);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(80), 500);
    const timer4 = setTimeout(() => setProgress(100), 800);
    
    // Hide progress bar after completion
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
    
    // Delay showing the page content
    const contentTimer = setTimeout(() => {
      setPageLoading(false); // Set loading state to false after delay
    }, 900);
    
    // Clean up timers
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(hideTimer);
      clearTimeout(contentTimer);
    };
  }, [location]);

  if (!isVisible) return null;

  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
