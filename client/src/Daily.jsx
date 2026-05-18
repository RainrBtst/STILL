import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Daily.css';

function Daily() {
    // --- NAVBAR STATE & LOGIC ---
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));
    const navigate = useNavigate();

    // --- DEVELOPER SECTION STATE ---
    const [showDevInfo, setShowDevInfo] = useState(false);

    const handleLogout = () => {
        // IDENTIFY THE CURRENT WEEK KEY FOR REWIND PERSISTENCE
        const now = new Date();
        const weekKey = `seenRewind_${now.getFullYear()}_${Math.ceil(now.getDate() / 7)}`;
        const seenFlag = localStorage.getItem(weekKey);

        localStorage.clear();

        // RE-SET THE SEEN FLAG IF IT EXISTED SO REWIND DOESN'T RE-TRIGGER ON RE-LOGIN
        if (seenFlag) {
            localStorage.setItem(weekKey, seenFlag);
        }
        window.location.href = '/login';
    };

    const handleHome = () => navigate('/home');
    const handleProfile = () => navigate('/profile');
    const handleAbout = () => navigate('/about');
    const handleRewindNav = () => navigate('/rewind');

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
            {/* --- MATCHING NAVBAR START --- */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
                
                <div className="nt-nav-links-wrapper">
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewindNav} >
                        <span>Rhythm Rewind</span>
                    </div>
                    <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => navigate('/send-song')} >
                        <span>Send a Song</span>
                    </div>
                </div>

                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? (
                                <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                "👤"
                            )}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}>
                                <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- BODY CONTENT CONTENT HERE --- */}
            <div className="daily-content-main" style={{ padding: '40px 0', textAlign: 'center' }}>
                <h2>The Daily Aux</h2>
                <p style={{ color: '#b3b3b3' }}>Your collaborative layout space.</p>
            </div>
        </div>
    );
}

export default Daily;