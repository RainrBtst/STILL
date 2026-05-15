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

    // --- FIXED: RHYTHM REWIND CHECKER ---
    useEffect(() => {
        const checkRewindAvailability = () => {
            const hasSeenRewind = localStorage.getItem("hasSeenRewindModal");
            if (hasSeenRewind === "true") {
                return; 
            }

            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            if (hours > 15 || (hours === 15 && minutes >= 57)) {
                setModal({
                    show: true,
                    title: "WEEKLY RHYTHM REWIND",
                    message: "Your weekly musical journey is ready to be unlocked. Would you like to see your rhythm?",
                    type: "rewind"
                });
            }
        };

        checkRewindAvailability();
        const interval = setInterval(checkRewindAvailability, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCloseRewindModal = (shouldNavigate) => {
        localStorage.setItem("hasSeenRewindModal", "true");
        setModal({ ...modal, show: false });
        if (shouldNavigate) {
            navigate('/rewind');
        }
    };

    const handleLogout = () => {
        const seenFlag = localStorage.getItem("hasSeenRewindModal");
        localStorage.clear();
        if (seenFlag) localStorage.setItem("hasSeenRewindModal", seenFlag);
        
        window.location.href = '/login';
    };

    const handleHome = () => setShowArchives(false);
    const handleProfile = () => navigate('/profile');
    const handleAbout = () => navigate('/about');
    const handleRewindNav = () => navigate('/rewind');

    // --- ADDED: ENTRY EXPIRATION & FILTERING LOGIC ---
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
            if (!userId || userId === "undefined") return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/journals/user/${userId}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                setEntries(res.data);
            } catch (err) { console.error("Failed to load journals", err); }
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
            setModal({ show: true, title: "No Song", message: "Select a song first.", type: "alert" });
            return;
        }
        setIsJournaling(true);
    };

    const saveNewEntry = async (journalData) => {
        const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId"); 
        const newEntryData = {
            userId, 
            username: localStorage.getItem("currentUsername"), 
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
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const fetchSongs = async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/music-search?query=${searchQuery}`);
                    setResults(res.data);
                } catch (err) { console.error(err); }
            } else { setResults([]); }
        };
        const debounce = setTimeout(fetchSongs, 500); 
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    return (
        <div className="nt-container">
            {/* MODAL SYSTEM */}
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

            {/* NAVBAR */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
                <div className="nt-nav-links-wrapper">
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewindNav}><span>Rhythm Rewind</span></div>
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => navigate('/send-song')}><span>Send a SonG</span></div>
                </div>
                <div className="nt-nav-actions">
                    <div className="nt-search-container">
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {results.length > 0 && (
                            <div className="nt-search-dropdown">
                                {results.map(track => (
                                    <div key={track.id} className="nt-search-item" onClick={() => handleSelectSong(track)}>
                                        <img src={track.albumArt} alt="art" />
                                        <p>{track.name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="nt-profile-circle" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                        {profilePic ? <img src={profilePic} alt="P" /> : "👤"}
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown">
                                <button onClick={handleHome}>HOME</button>
                                <button onClick={handleLogout}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            {!showArchives ? (
                <>
                    <header className="nt-hero">
                        <h2>WELCOME, {localStorage.getItem("currentUsername")?.toUpperCase()}</h2>
                        {selectedSong && (
                            <div className="nt-player-card">
                                <img src={selectedSong.albumArt} alt="album" />
                                <button onClick={togglePlay}>{isPlaying ? "PAUSE" : "PLAY"}</button>
                                <audio ref={audioRef} src={selectedSong.previewUrl} onEnded={() => setIsPlaying(false)} />
                            </div>
                        )}
                        <button className="nt-btn-primary" onClick={handleStartEntry}>+ START ENTRY</button>
                    </header>
                    <main className="nt-main">
                        <div className="nt-grid">
                            {activeEntries.map(entry => (
                                <div key={entry._id} className="nt-card" onClick={() => setViewingEntry(entry)}>
                                    <img src={entry.songDetails?.albumArt} alt="art" />
                                    <p>{entry.journalTitle}</p>
                                </div>
                            ))}
                        </div>
                        <button className="nt-link" onClick={() => setShowArchives(true)}>VIEW ARCHIVES</button>
                    </main>
                </>
            ) : (
                <Archive archivedEntries={archivedEntries} onBack={() => setShowArchives(false)} onViewEntry={setViewingEntry} />
            )}
        </div>
    );
}

export default Home;