import React, { useState, useEffect, useRef } from 'react';
import './About.css'; // Make sure to update the CSS file as well

function About() {
    // --- NAVBAR STATE & LOGIC ---
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleHome = () => {
        window.location.href = '/home';
    };

    const handleProfile = () => {
        window.location.href = '/profile';
    };

    const handleAbout = () => {
        window.location.href = '/about';
    };

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
                
                <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => window.location.href = '/send-song'} >
                    <span>Send a Song</span>
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
            {/* --- MATCHING NAVBAR END --- */}

            <main className="nt-main">
                {/* Your About Page Content goes here */}
            </main>
        </div>
    );
}

export default About;