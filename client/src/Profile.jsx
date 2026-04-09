import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Profile.css';

const API_BASE_URL = "https://unwinning-unscourging-johnie.ngrok-free.dev";

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
    
    // --- ADDED: DROPDOWN STATE ---
    const [showDevInfo, setShowDevInfo] = useState(false);

    // --- ADDED: MODAL STATE ---
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
        window.location.href = '/login';
    };

    const handleAbout = () => {
        window.location.href = '/about';
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

    // --- RENDER ---
    return (
        <div className="nt-container">
            {/* --- ADDED: THEMED MODAL JSX --- */}
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

            {/* Navbar Section */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/home'}>STILL</h1>
                <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => window.location.href = '/send-song'} >
                    <span>Send a Song</span>
                </div>
                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle" style={{cursor: 'pointer'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {user.profilePic ? <img src={user.profilePic} alt="P" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}>
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/home'} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/profile'} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Profile Section */}
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
                                    style={{fontWeight: 'normal'}} 
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                />
                                <input 
                                    type={showPasswords ? "text" : "password"} 
                                    placeholder="New Password" 
                                    className="profile-input-edit password-input" 
                                    style={{fontWeight: 'normal'}} 
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                />
                                <div style={{display: 'flex', alignItems: 'center', marginTop: '10px', marginLeft: '5px', gap: '8px', cursor: 'pointer'}} onClick={() => setShowPasswords(!showPasswords)}>
                                    <input 
                                        type="checkbox" 
                                        checked={showPasswords} 
                                        onChange={() => {}} 
                                        style={{cursor: 'pointer'}}
                                    />
                                    <span style={{color: '#a7a7a7', fontSize: '0.8rem'}}>Show Password</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="profile-save-btn" onClick={handleSave}>Save Changes</button>
                    
                    {/* DROPDOWN ARROW FOR ABOUT SECTION */}
                    <div className="dev-dropdown-trigger" onClick={() => setShowDevInfo(!showDevInfo)}>
                        <span className={`arrow-icon ${showDevInfo ? 'open' : ''}`}>▼</span>
                    </div>
                </div>
            </main>

            {/* DEVELOPER DROPDOWN CONTENT */}
            {showDevInfo && (
                <div className="dev-section-container">
                    <div className="dev-layout">
                        <div className="dev-photo-col">
                            <div className="dev-large-circle">
                                {/* PUT YOUR PHOTO FILENAME HERE */}
                                <img src="/your-photo.png" alt="Rainier Bautista" />
                            </div>
                        </div>

                        <div className="dev-content-col">
                            <div className="speech-bubble">
                                <p>
                                    <strong>STILL</strong> was designed and developed by me (Rainier Bautista). 
                                    This project started with a simple idea: that music is the best way to say what words can't. 
                                    Every line of code was written to ensure that the moment you share a song, 
                                    the technology gets out of the way of the message.
                                </p>
                                <p>
                                    This platform is a tribute to those backseat secrets we keep—the ones that are too heavy for words but fit perfectly within a melody. 
                                    I built this for the times when you feel super far from where you want to be, using music as the bridge to close that distance. 
                                    Whether it’s an connection to the prettiest thing you’ve ever seen or a way to navigate through the tears, it is for those who truly mean it.
                                </p>
                                <p>
                                    I created this because I like me better when I’m connected to the sounds that define my world. 
                                    In a life that’s always moving, I built this so we can finally stay <strong>STILL</strong>.
                                </p>
                                <div className="bubble-pointer"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;