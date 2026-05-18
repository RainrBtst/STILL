import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Daily.css';

function Daily() {
  // --- REQUIRED HOOKS & STATE VARIABLES ---
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

  // --- HANDLER FUNCTIONS ---
  const handleLogout = () => { 
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const trueWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    const weekKey = `seenRewind_Year${now.getFullYear()}_Week${trueWeekNumber}`;
    const seenValue = localStorage.getItem(weekKey);
    
    localStorage.clear(); 
    
    if (seenValue) {
        localStorage.setItem(weekKey, seenValue);
    }
    window.location.href = '/login'; 
  };

  const handleHome = () => navigate('/home');
  const handleProfile = () => navigate('/profile');
  const handleRewind = () => navigate('/rewind');
  const handleAbout = () => navigate('/about');

  // --- CLICK OUTSIDE DROPDOWN LOGIC ---
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowProfileDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="nt-container">
      {/* --- NAVBAR --- */}
      <nav className="nt-navbar">
        <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
        
        <div className="nt-nav-links-wrapper">
            <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewind} >
                <span>Rhythm Rewind</span>
            </div>
            <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => navigate('/send-song')} >
                <span>Send a Song</span>
            </div>
        </div>

        <div className="nt-nav-actions">
            <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                    {profilePic ? <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : "👤"}
                </div>
                {showProfileDropdown && (
                    <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px'}}>
                        <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>HOME</button>
                        <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>PROFILE</button>
                        <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>ABOUT</button>
                        <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>LOGOUT</button>
                    </div>
                )}
            </div>
        </div>
      </nav>

      {/* --- ADD SUBSEQUENT BODY CONTENT HERE --- */}
    </div>
  );
}

export default Daily;