import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TimeCapsule.css';

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

function TimeCapsule() {
    // --- STATE ---
    const [capsuleNote, setCapsuleNote] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [selectedSong, setSelectedSong] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profilePic] = useState(localStorage.getItem("profilePic"));
    
    const dropdownRef = useRef(null);

    // --- DEBOUNCED SEARCH LOGIC ---
    useEffect(() => {
        const fetchSongs = async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/music-search?query=${searchQuery}`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    });
                    setResults(res.data);
                } catch (err) { 
                    console.error("Search failed", err); 
                }
            } else { 
                setResults([]); 
            }
        };
        const debounce = setTimeout(fetchSongs, 500); 
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // --- OUTSIDE CLICK DROPDOWN CLOSE ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HANDLERS ---
    const handleSelectSong = (track) => {
        setSelectedSong(track);
        setSearchQuery('');
        setResults([]);
    };

    const handleSealCapsule = async () => {
        if (!selectedSong || !capsuleNote || !unlockDate) {
            alert("Please complete all sections to seal your time capsule.");
            return;
        }

        const payload = {
            userId: localStorage.getItem("userId"),
            song: selectedSong,
            note: capsuleNote,
            unlockDate: unlockDate
        };

        try {
            // Adjust this API endpoint to match your backend model setup
            const response = await axios.post(`${API_BASE_URL}/api/time-capsule/seal`, payload);
            if (response.status === 200 || response.data.status === "Success") {
                alert(`✨ Your capsule has been sealed! It will reappear on ${new Date(unlockDate).toLocaleDateString()}.`);
                window.location.href = '/home';
            }
        } catch (err) {
            console.error("Sealing failed", err);
            alert("Failed to seal your capsule. Please try again.");
        }
    };

    return (
        <div className="nt-container">
            {/* --- SYSTEM NAVBAR --- */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" onClick={() => window.location.href = '/home'}>STILL</h1>
                <div className="nt-nav-links-wrapper">
                    <div className="nt-nav-note" onClick={() => window.location.href = '/rewind'}>
                        <span>Rhythm Rewind</span>
                    </div>
                    <div className="nt-nav-note" onClick={() => window.location.href = '/send-song'}>
                        <span>Send a Song</span>
                    </div>
                    <div className="nt-nav-note" onClick={() => window.location.href = '/daily-aux'}>
                        <span>Daily Aux</span>
                    </div>
                    <div className="nt-nav-note active" onClick={() => window.location.href = '/time-capsule'}>
                        <span>Time Capsule</span>
                    </div>
                </div>

                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef}>
                        <div className="nt-profile-circle" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? <img src={profilePic} alt="Profile" /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown">
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/home'}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/profile'}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={() => window.location.href = '/about'}>ABOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- INTERACTIVE CONTAINER --- */}
            <main className="tc-main">
                <div className="tc-card">
                    <h1 className="tc-title">MUSICAL TIME CAPSULE</h1>
                    <div className="tc-divider"></div>
                    <p className="tc-subtitle">Seal a soundtrack and your current state of mind. Lock it away until a moment down the line.</p>

                    {/* Step 1: Lock Configuration */}
                    <div className="tc-input-group">
                        <label className="tc-label">1. Set Unlocking Date</label>
                        <input 
                            type="date" 
                            className="tc-date-input" 
                            value={unlockDate}
                            min={new Date().toISOString().split('T')[0]} 
                            onChange={(e) => setUnlockDate(e.target.value)}
                        />
                    </div>

                    {/* Step 2: Track Attachment */}
                    <div className="tc-input-group">
                        <label className="tc-label">2. Pick the Soundtrack</label>
                        {!selectedSong ? (
                            <div className="tc-search-box-wrapper">
                                <div className="tc-search-bar">
                                    <span className="search-icon">🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search for a track to bury..." 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                    />
                                </div>
                                {results.length > 0 && (
                                    <div className="tc-search-dropdown">
                                        {results.map((track) => (
                                            <div key={track.id} className="tc-search-item" onClick={() => handleSelectSong(track)}>
                                                <img src={track.albumArt} alt="art" />
                                                <div className="tc-search-info">
                                                    <p className="tc-search-name">{track.name}</p>
                                                    <p className="tc-search-artist">{track.artist}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="tc-selected-song-card">
                                <img src={selectedSong.albumArt} alt="art" className="tc-song-art" />
                                <div className="tc-song-details">
                                    <span className="tc-song-name">{selectedSong.name}</span>
                                    <span className="tc-song-artist">{selectedSong.artist}</span>
                                </div>
                                <button className="tc-song-remove-btn" onClick={() => setSelectedSong(null)}>✕ Change Track</button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Message Content */}
                    <div className="tc-input-group">
                        <label className="tc-label">3. Write to Your Future Self</label>
                        <textarea 
                            className="tc-textarea" 
                            placeholder="What's happening right now? What secrets or thoughts are you locking away with this melody?" 
                            value={capsuleNote}
                            onChange={(e) => setCapsuleNote(e.target.value)}
                            maxLength={1000}
                        />
                        <div className="tc-char-counter">{capsuleNote.length}/1000 characters</div>
                    </div>

                    {/* Seal Control Button */}
                    <button className="tc-seal-btn" onClick={handleSealCapsule}>
                        🔒 SEAL TIME CAPSULE
                    </button>
                </div>
            </main>
        </div>
    );
}

export default TimeCapsule;