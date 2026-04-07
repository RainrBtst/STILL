import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import Journal from './Journal';
import ReadJournal from './ReadJournal';
import Archive from './Archive';

const API_BASE_URL = "https://unwinning-unscourging-johnie.ngrok-free.dev";

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
    // ADDED: State for profile picture
    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    // ADDED PROFILE HANDLER
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
            const userId = localStorage.getItem("currentUserId");
            const username = localStorage.getItem("currentUsername");
            const identifier = userId || username; 

            if (!identifier) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/journals/user/${identifier}`, {
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
        if (!selectedSong) { alert("Search and choose a song first"); return; }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
        setIsJournaling(true);
    };

    const saveNewEntry = async (journalData) => {
        const username = localStorage.getItem("currentUsername"); 
        const userId = localStorage.getItem("currentUserId"); 

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
            const response = await axios.post(`${API_BASE_URL}/api/journals`, newEntryData, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            
            setEntries(prev => [response.data, ...prev]);
            
            setIsJournaling(false);
            setSelectedSong(null);
        } catch (err) {
            console.error("Error saving entry:", err);
            alert("Could not save your entry.");
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
            {isJournaling && (
                <Journal selectedSong={selectedSong} onClose={() => setIsJournaling(false)} onSave={saveNewEntry} />
            )}

            {viewingEntry && (
                <ReadJournal selectedSong={viewingEntry} existingData={viewingEntry} onClose={() => setViewingEntry(null)} />
            )}

            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => setShowArchives(false)}>STILL</h1>
                <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => window.location.href = '/send-song'} >
                    <span>Send a Song</span>
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
                        {/* UPDATED: Profile Circle logic */}
                        <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? (
                                <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                "👤"
                            )}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}>
                                {/* ADDED PROFILE BUTTON WITHOUT UNDERLINE */}
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {!showArchives ? (
                <>
                    <header className="nt-hero">
                        <h2 className="nt-welcome">WELCOME BACK, {localStorage.getItem("currentUsername")?.toUpperCase() || "USER"}!</h2>
                        <p className="nt-subtitle">Everyday has a rhythm, what yours?</p>
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
                                <div key={entry._id || entry.id} className="nt-card" onClick={() => setViewingEntry(entry)}>
                                    <div className="nt-album-placeholder">
                                        <img src={entry.songDetails?.albumArt || entry.albumArt} alt="Album Art" />
                                        <div className="nt-play-overlay">VIEW</div>
                                    </div>
                                    <div className="nt-card-content">
                                        <div className="nt-card-top">
                                            <span className="nt-date">{entry.journalTitle || "Untitled Entry"}</span>
                                            {entry.mood && <span className="nt-vibe-tag">{entry.mood}</span>}
                                        </div>
                                        <p className="nt-song-info">{new Date(entry.createdAt).toLocaleDateString()} • {entry.songDetails?.title || "No Title"} - {entry.songDetails?.artist || "Unknown"}</p>
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