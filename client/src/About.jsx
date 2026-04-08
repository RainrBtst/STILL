import React, { useState, useEffect, useRef } from 'react';
import './Profile.css'; // Reusing your existing styles for consistency

function About() {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const userProfilePic = localStorage.getItem("profilePic");

    // Handle clicks outside the profile dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    // --- COPIED HANDLERS FROM HOME.JSX ---
    const handleProfile = () => {
        window.location.href = '/profile';
    };

    const handleAbout = () => {
        window.location.href = '/about';
    };

    const handleSendSong = () => {
        window.location.href = '/send-song';
    };

    return (
        <div className="nt-container">
            {/* Consistent Navbar */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/home'}>STILL</h1>
                
                {/* UPDATED: Exactly like Home.jsx with pointerEvents added to ensure clickability */}
                <div 
                    className="nt-nav-note" 
                    style={{cursor: 'pointer', pointerEvents: 'auto'}} 
                    onClick={handleSendSong}
                >
                    <span>Send a Song</span>
                </div>

                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle" style={{cursor: 'pointer'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {userProfilePic ? <img src={userProfilePic} alt="P" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px'}}>
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/home'} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Content Section */}
            <main className="profile-main">
                <div className="profile-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <h1 className="profile-title">ABOUT</h1>
                    <div className="profile-divider"></div>
                    
                    <div style={{ marginTop: '40px' }}>
                        <h2 style={{ color: '#f1d302', fontSize: '2.5rem', letterSpacing: '2px' }}>HELLO</h2>
                        <p style={{ color: '#a7a7a7', marginTop: '20px', maxWidth: '400px', lineHeight: '1.6' }}>
                            Welcome to <strong>STILL</strong>. This is where your rhythm meets its home.
                        </p>
                    </div>

                    <button 
                        className="profile-save-btn" 
                        style={{ marginTop: '50px' }} 
                        onClick={() => window.location.href = '/home'}
                    >
                        Back to Home
                    </button>
                </div>
            </main>
        </div>
    );
}

export default About;