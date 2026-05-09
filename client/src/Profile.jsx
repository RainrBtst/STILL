import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

// Use Environment Variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Profile() {
    const navigate = useNavigate();

    // --- STATE ---
    const [user, setUser] = useState({
        username: localStorage.getItem("currentUsername") || "User",
        email: localStorage.getItem("currentUserEmail") || "user@example.com",
        profilePic: localStorage.getItem("profilePic") || null
    });

    const [passwords, setPasswords] = useState({ current: "", new: "" });
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState(false); 
    const [isEditingUsername, setIsEditingUsername] = useState(false); 
    const [showPasswords, setShowPasswords] = useState(false);
    
    // --- MODAL STATE ---
    const [modalConfig, setModalConfig] = useState({ show: false, title: "", message: "", type: "info" });

    // --- REFS ---
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- EFFECTS ---
    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            axios.get(`${API_BASE_URL}/api/user/${userId}`)
                .then(res => {
                    if (res.data) {
                        setUser({
                            username: res.data.name,
                            email: res.data.email,
                            profilePic: res.data.profilePic
                        });
                        localStorage.setItem("currentUsername", res.data.name);
                        localStorage.setItem("currentUserEmail", res.data.email);
                        localStorage.setItem("profilePic", res.data.profilePic || "");
                    }
                }).catch(err => console.log("Error fetching user:", err));
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HANDLERS ---
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
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

    const handleSave = async () => {
        const userId = localStorage.getItem("userId");
        try {
            if(!userId) throw new Error("User session expired.");

            const response = await axios.put(`${API_BASE_URL}/api/user/update/${userId}`, {
                username: user.username,
                profilePic: user.profilePic,
                currentPassword: passwords.current,
                newPassword: passwords.new
            });

            if (response.data.status === "Success") {
                localStorage.setItem("currentUsername", user.username);
                localStorage.setItem("profilePic", user.profilePic || "");
                
                setModalConfig({
                    show: true,
                    title: "SUCCESS",
                    message: "Profile saved successfully!",
                    type: "success"
                });
                
                setIsEditingUsername(false);
                setShowPasswordFields(false);
                setPasswords({ current: "", new: "" });
            }
        } catch (err) {
            setModalConfig({
                show: true,
                title: "SAVE ERROR",
                message: err.response?.data?.error || "Error saving changes.",
                type: "error"
            });
        }
    };

    return (
        <div className="nt-container">
            {/* ALERT MODAL */}
            {modalConfig.show && (
                <div className="still-modal-overlay">
                    <div className="still-modal-card">
                        <h2 className="modal-title">{modalConfig.title}</h2>
                        <p className="modal-message">{modalConfig.message}</p>
                        <div className="modal-actions">
                            <button className="modal-btn-primary" onClick={() => setModalConfig({ ...modalConfig, show: false })}>
                                OKAY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NAVIGATION BAR */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" onClick={() => navigate('/home')}>STILL</h1>
                
                <div className="nt-nav-note" onClick={() => navigate('/send-song')} >
                    <span>Send a Song</span>
                </div>

                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef}>
                        <div className="nt-profile-circle" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {user.profilePic ? <img src={user.profilePic} alt="P" /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown">
                                <button onClick={() => navigate('/home')}>HOME</button>
                                <button onClick={() => setShowProfileDropdown(false)}>PROFILE</button>
                                <button onClick={() => navigate('/about')}>ABOUT</button>
                                <button className="logout-item" onClick={handleLogout}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="profile-main">
                <div className="profile-card">
                    <h1 className="profile-title">PROFILE</h1>
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
                        <div className="label-row">
                            <label className="profile-label">Username</label>
                            <button className="edit-link-btn" onClick={() => setIsEditingUsername(!isEditingUsername)}>
                                {isEditingUsername ? "Cancel" : "Edit"}
                            </button>
                        </div>
                        
                        {isEditingUsername ? (
                            <input 
                                type="text" 
                                className="profile-input-edit" 
                                value={user.username} 
                                onChange={(e) => setUser({...user, username: e.target.value})}
                                autoFocus
                            />
                        ) : (
                            <div className="profile-value-box">{user.username.toUpperCase()}</div>
                        )}

                        <label className="profile-label">Email Address</label>
                        <div className="profile-value-box" style={{fontWeight: 'normal', color: '#a7a7a7'}}>{user.email}</div>

                        <button className="change-pass-btn" onClick={() => setShowPasswordFields(!showPasswordFields)}>
                            Change Password {showPasswordFields ? "▲" : "▼"}
                        </button>
                        
                        {showPasswordFields && (
                            <div className="password-dropdown-section">
                                <input 
                                    type={showPasswords ? "text" : "password"} 
                                    placeholder="Current Password" 
                                    className="profile-input-edit password-input" 
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                />
                                <input 
                                    type={showPasswords ? "text" : "password"} 
                                    placeholder="New Password" 
                                    className="profile-input-edit password-input" 
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                />
                                <div className="show-pass-toggle" onClick={() => setShowPasswords(!showPasswords)}>
                                    <input type="checkbox" checked={showPasswords} readOnly />
                                    <span>Show Password</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button className="profile-save-btn" onClick={handleSave}>Save Changes</button>
                </div>
            </main>
        </div>
    );
}

export default Profile;