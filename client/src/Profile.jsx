import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Profile.css';

const API_BASE_URL = "https://unwinning-unscourging-johnie.ngrok-free.dev";

function Profile() {
    const [user, setUser] = useState({
        username: localStorage.getItem("currentUsername") || "User",
        email: localStorage.getItem("currentUserEmail") || "user@example.com",
        profilePic: null
    });
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUser(prev => ({ ...prev, profilePic: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="nt-container">
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/home'}>STILL</h1>
                <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/send-song'}>
                    <span>Send a Song</span>
                </div>
                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle-nav" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {user.profilePic ? <img src={user.profilePic} alt="P" /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown">
                                <button className="nt-dropdown-btn" onClick={() => window.location.href = '/home'}>HOME</button>
                                <button className="nt-dropdown-btn" onClick={handleLogout}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="profile-main">
                <div className="profile-card">
                    <h1 className="profile-title">Account Settings</h1>
                    <div className="profile-divider"></div>

                    <div className="profile-image-section">
                        <div className="profile-image-circle" onClick={() => fileInputRef.current.click()}>
                            {user.profilePic ? <img src={user.profilePic} alt="Profile" /> : <span style={{fontSize: '3rem'}}>👤</span>}
                        </div>
                        
                        <div className="profile-action-group">
                            <button className="btn-yellow" onClick={() => fileInputRef.current.click()}>Change Photo</button>
                            {user.profilePic && (
                                <button className="btn-remove" onClick={() => setUser(prev => ({ ...prev, profilePic: null }))}>Remove</button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="profile-info-section">
                        <label className="profile-label">Username</label>
                        <div className="profile-value-box">{user.username.toUpperCase()}</div>

                        <label className="profile-label">Email Address</label>
                        <div className="profile-value-box" style={{fontWeight: 'normal', color: '#a7a7a7'}}>{user.email}</div>
                    </div>

                    <button className="profile-save-btn" onClick={() => window.location.href = '/home'}>Save Changes</button>
                </div>
            </main>
        </div>
    );
}

export default Profile;