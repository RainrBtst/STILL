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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));
    const [modal, setModal] = useState({ show: false, title: "", message: "", type: "" });

    const getWeekKey = () => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now - startOfYear) / 86400000;
        const trueWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        return `seenRewind_Year${now.getFullYear()}_Week${trueWeekNumber}`;
    };

    useEffect(() => {
        const checkRewindAvailability = () => {
            const now = new Date();
            const weekKey = getWeekKey();
            const hasSeenRewind = localStorage.getItem(weekKey);
            if (hasSeenRewind === "true") return;
            const day = now.getDay();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentAbsoluteMinutes = (day * 24 * 60) + (hours * 60) + minutes;
            const unlockTime = (0 * 24 * 60) + (23 * 60) + 59; 
            const lockTime = (1 * 24 * 60) + (23 * 60) + 59;  
            if (currentAbsoluteMinutes >= unlockTime && currentAbsoluteMinutes <= lockTime) {
                setModal({ show: true, title: "WEEKLY RHYTHM REWIND", message: "Your weekly musical journey is ready to be unlocked.", type: "rewind" });
            }
        };
        checkRewindAvailability();
        const interval = setInterval(checkRewindAvailability, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCloseRewindModal = (shouldNavigate) => {
        const weekKey = getWeekKey();
        localStorage.setItem(weekKey, "true");
        setModal(prev => ({ ...prev, show: false }));
        if (shouldNavigate) navigate('/rewind');
    };

    const handleLogout = () => {
        const weekKey = getWeekKey();
        const seenValue = localStorage.getItem(weekKey);
        localStorage.clear();
        if (seenValue) localStorage.setItem(weekKey, String(seenValue));
        window.location.href = '/login';
    };

    const handleHome = () => { setShowArchives(false); setIsMobileMenuOpen(false); };
    const handleProfile = () => navigate('/profile');
    const handleAbout = () => navigate('/about');
    const handleRewindNav = () => navigate('/rewind');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowProfileDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isExpired = (createdAt) => (new Date() - new Date(createdAt)) / (1000 * 60 * 60) >= 24;
    const activeEntries = entries.filter(entry => !isExpired(entry.createdAt));
    const archivedEntries = entries.filter(entry => isExpired(entry.createdAt));

    useEffect(() => {
        const loadEntries = async () => {
            const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
            if (!userId) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/journals/user/${userId}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
                setEntries(res.data);
            } catch (err) { console.error("Failed to load journals", err); }
        };
        loadEntries();
    }, [isJournaling]);

    const handleSelectSong = (track) => { setSelectedSong(track); setSearchQuery(''); setResults([]); setIsPlaying(false); };
    const togglePlay = () => { isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); };
    const handleStartEntry = () => {
        if (!selectedSong) { setModal({ show: true, title: "No Song Selected", message: "Please search and choose a song.", type: "alert" }); return; }
        setIsJournaling(true);
    };

    const saveNewEntry = async (journalData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/journals`, {
                userId: localStorage.getItem("currentUserId") || localStorage.getItem("userId"),
                username: localStorage.getItem("currentUsername"),
                journalTitle: journalData.title,
                content: journalData.content,
                mood: journalData.mood,
                songDetails: { title: selectedSong.name, artist: selectedSong.artist, albumArt: selectedSong.albumArt, previewUrl: selectedSong.previewUrl }
            });
            setEntries(prev => [response.data, ...prev]);
            setIsJournaling(false);
            setSelectedSong(null);
        } catch (err) { console.error("Error saving entry:", err); }
    };

    useEffect(() => {
        const fetchSongs = async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/music-search?query=${searchQuery}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
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
                                    <button className="modal-btn-primary" onClick={() => handleCloseRewindModal(true)}>VISIT</button>
                                    <button className="modal-btn-secondary" onClick={() => handleCloseRewindModal(false)}>NOT NOW</button>
                                </>
                            ) : (
                                <button className="modal-btn-primary" onClick={() => setModal({ ...modal, show: false })}>OKAY</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isJournaling && <Journal selectedSong={selectedSong} onClose={() => setIsJournaling(false)} onSave={saveNewEntry} />}
            {viewingEntry && <ReadJournal selectedSong={viewingEntry} existingData={viewingEntry} onClose={() => setViewingEntry(null)} />}

            <nav className="nt-navbar">
                <div className="nt-mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</div>
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
                
                <div className={`nt-nav-links-wrapper ${isMobileMenuOpen ? 'active' : ''}`}>
                    <div className="nt-nav-note" onClick={handleRewindNav}><span>Rhythm Rewind</span></div>
                    <div className="nt-nav-note" onClick={() => {navigate('/send-song'); setIsMobileMenuOpen(false);}}><span>Send a SonG</span></div>
                    <div className="nt-nav-note" onClick={() => {navigate('/daily'); setIsMobileMenuOpen(false);}}><span>Daily Aux</span></div>
                    <div className="nt-nav-note" onClick={() => {setShowArchives(true); setIsMobileMenuOpen(false);}}><span>Archive</span></div>
                </div>

                <div className="nt-nav-actions">
                    <div className={`nt-search-container ${isSearchVisible ? 'active' : ''}`}>
                        <div className="nt-search-bar">
                            <span className="search-icon" onClick={() => setIsSearchVisible(!isSearchVisible)}>🔍</span>
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
                    <div className="nt-profile-container" ref={dropdownRef}>
                        <div className="nt-profile-circle" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : "👤"}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown">
                                <button onClick={handleHome}>HOME</button>
                                <button onClick={handleProfile}>PROFILE</button>
                                <button onClick={handleAbout}>ABOUT</button>
                                <button onClick={handleLogout}>LOGOUT</button>
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
                                    <button className="nt-custom-play" onClick={togglePlay}>{isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}</button>
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
                                    <div className="nt-album-placeholder"><img src={entry.songDetails?.albumArt || entry.albumArt} alt="Album Art" /><div className="nt-play-overlay">VIEW</div></div>
                                    <div className="nt-card-content">
                                        <div className="nt-card-top"><span className="nt-date">{entry.journalTitle || "Untitled Entry"}</span>{entry.mood && <span className="nt-vibe-tag">{entry.mood}</span>}</div>
                                        <p className="nt-song-info">{new Date(entry.createdAt).toLocaleDateString()} • {entry.songDetails?.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </>
            ) : <Archive archivedEntries={archivedEntries} onBack={() => setShowArchives(false)} onViewEntry={(entry) => setViewingEntry(entry)} />}
        </div>
    );
}
export default Home;