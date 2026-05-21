import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TimeCapsule.css';

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

function TimeCapsule() {
    const [capsuleNote, setCapsuleNote] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [selectedSong, setSelectedSong] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [capsules, setCapsules] = useState([]); // Archive state
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profilePic] = useState(localStorage.getItem("profilePic"));
    const dropdownRef = useRef(null);

    // Fetch capsules on load
    useEffect(() => {
        const fetchCapsules = async () => {
            const userId = localStorage.getItem("userId");
            try {
                const res = await axios.get(`${API_BASE_URL}/api/time-capsule/all?userId=${userId}`);
                setCapsules(res.data);
            } catch (err) { console.error("Could not load capsules"); }
        };
        fetchCapsules();
    }, []);

    // --- SEARCH & HANDLERS ---
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
        const payload = { userId: localStorage.getItem("userId"), song: selectedSong, note: capsuleNote, unlockDate: unlockDate };
        try {
            const response = await axios.post(`${API_BASE_URL}/api/time-capsule/seal`, payload);
            if (response.status === 200) {
                alert(`✨ Capsule sealed!`);
                window.location.reload();
            }
        } catch (err) { alert("Failed to seal your capsule."); }
    };

   // ... (Keep all imports and logic exactly as you had them)

    return (
        <div className="nt-container">
            <nav className="nt-navbar">{/* ... your nav ... */}</nav>

            <main className="tc-page-wrapper">
                <header className="tc-header-area">
                    <h1 className="tc-main-header">TIME CAPSULE</h1>
                    <p className="tc-main-sub">Preserve your state of mind. Encrypted in melody.</p>
                </header>

                <div className="tc-creation-grid">
                    <div className="tc-field-row">
                        <div className="tc-field">
                            <label>1. UNLOCK DATE</label>
                            <input type="date" className="tc-input-clean" value={unlockDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setUnlockDate(e.target.value)} />
                        </div>
                        <div className="tc-field">
                            <label>2. SOUNDTRACK</label>
                            {!selectedSong ? (
                                <input type="text" className="tc-input-clean" placeholder="Search track..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            ) : (
                                <div className="tc-selected-song-card">
                                    <img src={selectedSong.albumArt} alt="art" />
                                    <span className="tc-song-text">{selectedSong.name}</span>
                                    <button onClick={() => setSelectedSong(null)}>✕</button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="tc-field">
                        <label>3. REFLECTION</label>
                        <textarea className="tc-textarea-clean" value={capsuleNote} onChange={(e) => setCapsuleNote(e.target.value)} placeholder="What secrets are you burying?" />
                    </div>

                    <button className="tc-seal-btn" onClick={handleSealCapsule}>SEAL CAPSULE</button>
                </div>

                <section className="tc-archive-section">
                    <h2 className="tc-section-title">VAULT</h2>
                    <div className="tc-capsules-grid">
                        {capsules.map((cap) => (
                            <div key={cap.id} className="tc-capsule-card">
                                <img src={cap.song.albumArt} alt="art" />
                                <h3>{cap.song.name}</h3>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default TimeCapsule;