import React, { useState, useEffect, useRef } from 'react';
import './About.css';

function About() {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profilePic] = useState(localStorage.getItem("profilePic"));
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleProfile = () => {
        window.location.href = '/profile';
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
            {/* Navbar matches your SendSong and Profile pages */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/home'}>STILL</h1>
                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}>
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/home'} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="about-wrapper">
                <div className="about-content">
                    <h2 className="about-header">ABOUT STILL</h2>
                    <div className="about-divider"></div>
                    
                    <p className="about-description">
                        Music has the power to capture what words alone cannot. 
                        <strong> STILL</strong> is an immersive music-journaling platform where your personal stories meet their perfect soundtrack. 
                        Whether you are navigating a quiet moment of peace or a loud burst of joy, STILL allows you to anchor your journal entries 
                        to the music that matches your soul.
                    </p>

                    <p className="about-description">
                        We believe that <strong>"Everyday has a rhythm,"</strong> and our mission is to help you preserve the melody of your life 
                        in a safe, private environment. Here, your moods are translated into playlists, and your memories are kept STILL—forever 
                        synchronized with the songs that moved you.
                    </p>

                    <div className="about-sections">
                        <div className="section-item">
                            <h3>🎵 Music Journaling</h3>
                            <p>Write your thoughts and pair them with the exact song that defines your mood.</p>
                        </div>
                        <div className="section-item">
                            <h3>✉️ Send a Song</h3>
                            <p>Share a message and a melody anonymously with someone special.</p>
                        </div>
                        <div className="section-item">
                            <h3>🔒 Privacy</h3>
                            <p>Your journals are your own. We provide a secure sanctuary for your personal reflections.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default About;