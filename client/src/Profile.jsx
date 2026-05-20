import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Profile.css';

// --- API CONFIG FROM HOME ---
const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

function Profile() {
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
    
    // --- NAV SEARCH STATE FROM HOME ---
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);

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

    // --- SEARCH LOGIC FROM HOME ---
    useEffect(() => {
        const fetchSongs = async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/music-search?query=${searchQuery}`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    });
                    setResults(res.data);
                } catch (err) { console.error("Search failed", err); }
            } else { setResults([]); }
        };
        const debounce = setTimeout(fetchSongs, 500); 
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // --- HANDLERS ---
    const handleLogout = () => {
        const now = new Date();
        const weekKey = `seenRewind_${now.getFullYear()}_${Math.ceil(now.getDate() / 7)}`;
        const seenFlag = localStorage.getItem(weekKey);

        localStorage.clear();

        if (seenFlag) {
            localStorage.setItem(weekKey, seenFlag);
        }
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

    const handleRewindNav = () => {
        window.location.href = '/rewind';
    };

    const handleSelectSong = (track) => {
        setSearchQuery(''); 
        setResults([]); 
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
            let errorMsg = "Error saving changes.";
            if (err.response && err.response.data.error) {
                errorMsg = err.response.data.error;
            }
            setModalConfig({
                show: true,
                title: "SAVE ERROR",
                message: errorMsg,
                type: "error"
            });
        }
    };

    const closeAndRedirect = () => {
        const isSuccess = modalConfig.type === "success";
        setModalConfig({ ...modalConfig, show: false });
        if (isSuccess) window.location.href = '/home';
    };

    return (
        <div className="nt-container">
            {modalConfig.show && (
                <div className="still-modal-overlay">
                    <div className="still-modal-card">
                        <h2 className="modal-title">{modalConfig.title}</h2>
                        <p className="modal-message">{modalConfig.message}</p>
                        <div className="modal-actions">
                            <button className="modal-btn-primary" onClick={closeAndRedirect}>
                                OKAY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- COMPLETE NAV BAR WITH ALL THREE BUTTONS --- */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
                
                <div className="nt-nav-links-wrapper">
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewindNav} >
                        <span>Rhythm Rewind</span>
                    </div>
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/send-song'} >
                        <span>Send a Song</span>
                    </div>
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/daily-aux'} >
                        <span>Daily Aux</span>
                    </div>
                </div>

                <div className="nt-nav-actions">
                    <div className="nt-search-container">
                        <div className="nt-search-bar">
                            <span className="search-icon">🔍</span>
                            <input type="text" placeholder="Search Songs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        {results.length > 0 && (
                            <div className="nt-search-dropdown">
                                {results.map((track) => (
                                    <div key={track.id} className="nt-search-item" onClick={() => handleSelectSong(track)}>
                                        <img src={track.albumArt} alt="art" />
                                        <div className="nt-search-info">
                                            <p className="nt-search-name">{track.name}</p>
                                            <p className="nt-search-artist">{track.artist}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {user.profilePic ? (
                                <img src={user.profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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