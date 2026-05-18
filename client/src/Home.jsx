import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import Journal from './Journal';
import ReadJournal from './ReadJournal';
import Archive from './Archive';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [showArchives, setShowArchives] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [isJournaling, setIsJournaling] = useState(false);
    const [viewingEntry, setViewingEntry] = useState(null);
    const [entries, setEntries] = useState([]);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate(); 

    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));
    const [modal, setModal] = useState({ show: false, title: "", message: "", type: "" });

    // --- 1. RHYTHM REWIND MODAL LOGIC (UPDATED ACCESS LOGIC) ---
    useEffect(() => {
        const checkRewindAvailability = () => {
            const now = new Date();
            
            // Generate uniform chronological week indicators across the year
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const pastDaysOfYear = (now - startOfYear) / 86400000;
            const chronologicalWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
            const weekKey = `seenRewind_${now.getFullYear()}_Week${chronologicalWeek}`;
            
            // Check if user has already dismissed/visited this modal THIS week
            const hasSeenRewind = localStorage.getItem(weekKey);
            if (hasSeenRewind === "true") return;

            const day = now.getDay(); 
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // Match active time matrix constraints
            const currentAbsoluteMinutes = (day * 24 * 60) + (hours * 60) + minutes;
            const unlockTime = (0 * 24 * 60) + (23 * 60) + 59; // Sunday 11:59 PM
            const lockTime = (6 * 24 * 60) + (23 * 60) + 59;   // Saturday 11:59 PM

            if (currentAbsoluteMinutes >= unlockTime && currentAbsoluteMinutes <= lockTime) {
                setModal({
                    show: true,
                    title: "WEEKLY RHYTHM REWIND",
                    message: "Your weekly musical journey is ready to be unlocked. Would you like to see your rhythm?",
                    type: "rewind"
                });
            }
        };

        checkRewindAvailability();
        const interval = setInterval(checkRewindAvailability, 30000); // Check every 30 seconds for accuracy
        return () => clearInterval(interval);
    }, []);

    // Helper to close rewind modal and save preference to localStorage using Week Key
    const handleCloseRewindModal = (shouldNavigate) => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now - startOfYear) / 86400000;
        const chronologicalWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `seenRewind_${now.getFullYear()}_Week${chronologicalWeek}`;
        
        localStorage.setItem(weekKey, "true");
        setModal(prev => ({ ...prev, show: false }));
        if (shouldNavigate) {
            navigate('/rewind');
        }
    };

    const handleLogout = () => {
        // IDENTIFY THE CURRENT WEEK KEY
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now - startOfYear) / 86400000;
        const chronologicalWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `seenRewind_${now.getFullYear()}_Week${chronologicalWeek}`;
        
        // PRESERVE THE FLAG BEFORE CLEARING
        const seenFlag = localStorage.getItem(weekKey);
        
        localStorage.clear();
        
        // RE-SET THE FLAG SO IT SURVIVES THE LOGOUT/LOGIN
        if (seenFlag) {
            localStorage.setItem(weekKey, seenFlag);
        }
        window.location.href = '/login';
    };

    const handleHome = () => {
        setShowArchives(false);
    };

    const handleProfile = () => {
        navigate('/profile');
    };

    const handleAbout = () => {
        navigate('/about');
    };

    const handleRewindNav = () => {
        navigate('/rewind');
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

    const isExpired = (createdAt) => {
        const entryDate = new Date(createdAt);
        const now = new Date();
        const differenceInHours = (now - entryDate) / (1000 * 60 * 60);
        return differenceInHours >= 24;
    };

    const activeEntries = entries.filter(entry => !isExpired(entry.createdAt));
    const archivedEntries = entries.filter(entry => isExpired(entry.createdAt));

    useEffect(() => {
        const loadEntries = async () => {
            const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
            if (!userId) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/journals/user/${userId}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                setEntries(res.data);
            } catch (err) { 
                console.error("Failed to load journals", err); 
            }
        };
        loadEntries();
    }, [isJournaling]); 

    const handleSelectSong = (track) => {
        setSelectedSong(track);
        setSearchQuery(''); 
        setResults([]); 
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleStartEntry = () => {
        if (!selectedSong) { 
            setModal({
                show: true,
                title: "No Song Selected",
                message: "Please search and choose a song before starting your journey.",
                type: "alert"
            });
            return; 
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
        setIsJournaling(true);
    };

    const saveNewEntry = async (journalData) => {
        const username = localStorage.getItem("currentUsername"); 
        const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId"); 

        const newEntryData = {
            userId: userId, 
            username: username, 
            journalTitle: journalData.title,
            content: journalData.content,
            mood: journalData.mood,
            songDetails: {
                title: selectedSong.name,
                artist: selectedSong.artist,
                albumArt: selectedSong.albumArt,
                previewUrl: selectedSong.previewUrl
            }
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/api/journals`, newEntryData); 
            setEntries(prev => [response.data, ...prev]);
            setIsJournaling(false);
            setSelectedSong(null);
        } catch (err) {
            console.error("Error saving entry:", err);
            setModal({
                show: true,
                title: "Error",
                message: "Could not save your entry. Please try again.",
                type: "alert"
            });
        }
    };

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

    return (
        <div className="nt-container">
            {modal.show && (
                <div className="still-modal-overlay">
                    <div className="still-modal-card">
                        <h2 className="modal-title">{modal.title}</h2>
                        <p className="modal-message">{modal.message}</p>
                        <div className="modal-actions">
                            {modal.type === "rewind" ? (
                                <>
                                    <button className="modal-btn-primary" onClick={() => handleCloseRewindModal(true)}>
                                        VISIT
                                    </button>
                                    <button className="modal-btn-secondary" onClick={() => handleCloseRewindModal(false)}>
                                        NOT NOW
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="modal-btn-primary" onClick={() => setModal({ ...modal, show: false })}>
                                        {modal.type === "confirm" ? "KEEP EDITING" : "OKAY"}
                                    </button>
                                    {modal.type === "confirm" && (
                                        <button className="modal-btn-secondary" onClick={() => setModal({ ...modal, show: false })}>
                                            DISCARD
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isJournaling && (
                <Journal selectedSong={selectedSong} onClose={() => setIsJournaling(false)} onSave={saveNewEntry} />
            )}

            {viewingEntry && (
                <ReadJournal selectedSong={viewingEntry} existingData={viewingEntry} onClose={() => setViewingEntry(null)} />
            )}

            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
                <div className="nt-nav-links-wrapper">
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewindNav} >
                        <span>Rhythm Rewind</span>
                    </div>
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => navigate('/send-song')} >
                        <span>Send a SonG</span>
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
                        <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px'}}>
                                <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {!showArchives ? (
                <>
                    <header className="nt-hero">
                        <h2 className="nt-welcome">WELCOME BACK, {localStorage.getItem("currentUsername")?.toUpperCase() || "USER"}!</h2>
                        <p className="nt-subtitle">Everyday has a rhythm, what's yours?</p>
                        {selectedSong && (
                            <div className="nt-player-card">
                                <img src={selectedSong.albumArt} alt="album" />
                                <div className="nt-player-details">
                                    <h3>{selectedSong.name}</h3>
                                    <p>{selectedSong.artist}</p>
                                    <audio ref={audioRef} src={selectedSong.previewUrl} onEnded={() => setIsPlaying(false)} />
                                    <button className="nt-custom-play" onClick={togglePlay}>{isPlaying ? "❚❚ PAUSE PREVIEW" : "▶ PLAY PREVIEW"}</button>
                                </div>
                                <button className="nt-remove-btn" onClick={() => setSelectedSong(null)}>✕</button>
                            </div>
                        )}
                        <button className="nt-btn-primary" onClick={handleStartEntry}>+ START TODAY'S ENTRY</button>
                    </header>
                    <main className="nt-main">
                        <div className="nt-section-header"><h3>TODAY</h3></div>
                        <div className="nt-grid">
                            {activeEntries.map((entry) => (
                                <div key={entry._id} className="nt-card" onClick={() => setViewingEntry(entry)}>
                                    <div className="nt-album-placeholder">
                                        <img src={entry.songDetails?.albumArt || entry.albumArt} alt="Album Art" />
                                        <div className="nt-play-overlay">VIEW</div>
                                    </div>
                                    <div className="nt-card-content">
                                        <div className="nt-card-top">
                                            <span className="nt-date">{entry.journalTitle || "Untitled Entry"}</span>
                                            {entry.mood && <span className="nt-vibe-tag">{entry.mood}</span>}
                                        </div>
                                        <p className="nt-song-info">{new Date(entry.createdAt).toLocaleDateString()} • {entry.songDetails?.title} - {entry.songDetails?.artist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="nt-footer"><button className="nt-link" onClick={() => setShowArchives(true)}>VIEW ALL ARCHIVES ➔</button></div>
                    </main>
                </>
            ) : (
                <Archive archivedEntries={archivedEntries} onBack={() => setShowArchives(false)} onViewEntry={(entry) => setViewingEntry(entry)} />
            )}
        </div>
    );
}

export default Home;