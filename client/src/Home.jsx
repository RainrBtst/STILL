import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import axios from 'axios';
import './Home.css';
import Journal from './Journal';
import ReadJournal from './ReadJournal'; // ADDED: Import for the new reading mode
import Archive from './Archive'; // Import the new file


function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [journalText, setJournalText] = useState('');

    // --- NEW: STATE TO TOGGLE ARCHIVE VIEW ---
    const [showArchives, setShowArchives] = useState(false);

    // --- NEW: STATE FOR CUSTOM PLAY BUTTON ---
    const [isPlaying, setIsPlaying] = useState(false);

    // --- NEW: REF TO CONTROL THE AUDIO ELEMENT ---
    const audioRef = useRef(null);

    const [isJournaling, setIsJournaling] = useState(false);

    // --- NEW: STATE FOR ENTRIES & VIEWING ---
    const [viewingEntry, setViewingEntry] = useState(null);
    const [entries, setEntries] = useState([]);

    // --- NEW: STATE FOR PROFILE DROPDOWN ---
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // --- NEW: LOGOUT FUNCTION ---
    const handleLogout = () => {
        localStorage.clear(); // Clears currentUsername and userId
        window.location.href = '/login'; // Redirects to login page
    };

    // --- NEW: CLOSE DROPDOWN ON CLICK OUTSIDE ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- NEW: EXPIRATION CALCULATION ---
    const isExpired = (createdAt) => {
        const entryDate = new Date(createdAt);
        const now = new Date();
        const differenceInHours = (now - entryDate) / (1000 * 60 * 60);
        return differenceInHours >= 24;
    };

    // Derived lists for Today vs Archive
    const activeEntries = entries.filter(entry => !isExpired(entry.createdAt));
    const archivedEntries = entries.filter(entry => isExpired(entry.createdAt));

    // --- UPDATED: FETCH ENTRIES SPECIFIC TO LOGGED IN USERNAME ---
    useEffect(() => {
        const loadEntries = async () => {
            // UPDATED: Now looking for currentUsername string
            const username = localStorage.getItem("currentUsername"); 
            if (!username) return;

            try {
                // Use the new username-based route we added to index.js
                const res = await axios.get(`https://still-csmi.onrender.com/api/journals/user/${username}`);
                console.log("DEBUG: Fetched Entries Data ->", res.data); // ADDED: Log to check data structure
                setEntries(res.data);
            } catch (err) {
                console.error("Failed to load journals from database", err);
            }
        };
        loadEntries();
    }, []);

    const handleSelectSong = (track) => {
        setSelectedSong(track);
        setSearchQuery(''); 
        setResults([]); 
        setIsPlaying(false); // Reset play state when a new song is picked
    };

    // --- NEW: TOGGLE PLAY/PAUSE FOR CUSTOM BUTTON ---
    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    // --- NEW: FUNCTION TO STOP MUSIC AND OPEN JOURNAL ---
    const handleStartEntry = () => {
        if (audioRef.current) {
            audioRef.current.pause(); // Stops the music
            audioRef.current.currentTime = 0; // Resets it to the beginning
            setIsPlaying(false); // Update button icon
        }
        setIsJournaling(true);
    };

    // --- UPDATED: SAVE ENTRY FUNCTION WITH USERNAME ---
    const saveNewEntry = async (journalData) => {
        // UPDATED: Get the username from local storage instead of userId
        const username = localStorage.getItem("currentUsername"); 

        const newEntryData = {
            username: username, // UPDATED: Changed key to 'username' to match your new Schema
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
            // Save to MongoDB via Backend
            const response = await axios.post('https://still-csmi.onrender.com/api/journals', newEntryData);
            
            // Add the returned saved entry to the top of the list
            setEntries([response.data, ...entries]);
            setIsJournaling(false);
            setSelectedSong(null);
        } catch (err) {
            console.error("Error saving entry to database:", err);
            alert("Could not save your entry. Please check your connection.");
        }
    };

    useEffect(() => {
        const fetchSongs = async () => {
            if (searchQuery.length > 2) {
                try {
                    const res = await axios.get(`https://still-csmi.onrender.com/music-search?query=${searchQuery}`);
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

    return (
        <div className="nt-container">
            {/* Writing Mode */}
            {isJournaling && (
                <Journal 
                    selectedSong={selectedSong} 
                    onClose={() => setIsJournaling(false)} 
                    onSave={saveNewEntry}
                />
            )}

            {/* Viewing Mode */}
            {viewingEntry && (
                <ReadJournal 
                    selectedSong={viewingEntry} 
                    existingData={viewingEntry}
                    onClose={() => setViewingEntry(null)} 
                />
            )}

            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => setShowArchives(false)}>STILL</h1>
                {/* ADDED: Send a Song Note */}
                <div className="nt-nav-note" 
                    style={{cursor: 'pointer', pointerEvents: 'auto'}} 
                    onClick={() => window.location.href = '/send-song'} >
                    <span>Send a Song</span>
                </div>
                <div className="nt-nav-actions">
                    <div className="nt-search-container">
                        <div className="nt-search-bar">
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search Songs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        {results.length > 0 && (
                            <div className="nt-search-dropdown">
                                {results.map((track) => (
                                    <div 
                                        key={track.id} 
                                        className="nt-search-item"
                                        onClick={() => handleSelectSong(track)}
                                    >
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
                    
                    {/* PROFILE ICON WITH DROPDOWN LOGOUT */}
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div 
                            className="nt-profile-circle" 
                            style={{cursor: 'pointer'}} 
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        >
                            👤
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                backgroundColor: '#181818',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                padding: '10px',
                                marginTop: '10px',
                                zIndex: 1000,
                                minWidth: '120px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}>
                                <button 
                                    className="nt-logout-btn-dropdown" 
                                    onClick={handleLogout}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'white',
                                        width: '100%',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        padding: '5px'
                                    }}
                                >
                                    LOGOUT
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {!showArchives ? (
                <>
                    <header className="nt-hero">
                        {/* UPDATED: Dynamic greeting using the stored username */}
                        <h2 className="nt-welcome">WELCOME BACK, {localStorage.getItem("currentUsername")?.toUpperCase() || "USER"}!</h2>
                        <p className="nt-subtitle">Everyday has a rhythm, what yours?</p>

                        {selectedSong && (
                            <div className="nt-player-card">
                                <img src={selectedSong.albumArt} alt="album" />
                                <div className="nt-player-details">
                                    <h3>{selectedSong.name}</h3>
                                    <p>{selectedSong.artist}</p>
                                    
                                    {/* NEW: HIDDEN AUDIO ELEMENT WITHOUT CONTROLS */}
                                    <audio 
                                        ref={audioRef} 
                                        src={selectedSong.previewUrl} 
                                        onEnded={() => setIsPlaying(false)} 
                                    />

                                    {/* NEW: REDESIGNED PLAY BUTTON */}
                                    <button className="nt-custom-play" onClick={togglePlay}>
                                        {isPlaying ? (
                                            <><span className="pause-icon">❚❚</span> PAUSE PREVIEW</>
                                        ) : (
                                            <><span className="play-icon">▶</span> PLAY PREVIEW</>
                                        )}
                                    </button>
                                </div>
                                <button className="nt-remove-btn" onClick={() => setSelectedSong(null)}>✕</button>
                            </div>
                        )}

                        <button className="nt-btn-primary" onClick={handleStartEntry}>
                            + START TODAY'S ENTRY
                        </button>
                    </header>

                    <main className="nt-main">
                        <div className="nt-section-header">
                            <h3>TODAY</h3>
                            
                        </div>

                        <div className="nt-grid">
                            {activeEntries.map((entry) => (
                                <div key={entry._id || entry.id} className="nt-card" onClick={() => setViewingEntry(entry)}>
                                    <div className="nt-album-placeholder">
                                        {/* FIXED: Using songDetails for the album art */}
                                        <img 
                                            src={entry.songDetails?.albumArt || entry.albumArt} 
                                            alt="Album Art"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/300?text=Still+Journal";
                                                e.target.style.opacity = "0.3";
                                            }}
                                        />
                                        <div className="nt-play-overlay">VIEW</div>
                                    </div>
                                    <div className="nt-card-content">
                                        <div className="nt-card-top">
                                            <span className="nt-date">{entry.journalTitle || "Untitled Entry"}</span>
                                            {entry.mood && <span className="nt-vibe-tag">{entry.mood}</span>}
                                        </div>
                                        {/* FIXED: Accessing song title/artist from songDetails object */}
                                        <p className="nt-song-info">
                                            {new Date(entry.createdAt).toLocaleDateString()} • {entry.songDetails?.title || "No Title Found"} - {entry.songDetails?.artist || "Unknown Artist"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="nt-footer">
                            <button className="nt-link" onClick={() => setShowArchives(true)}>VIEW ALL ARCHIVES ➔</button>
                        </div>
                    </main>
                </>
            ) : (
                <Archive 
                    archivedEntries={archivedEntries} 
                    onBack={() => setShowArchives(false)} 
                    onViewEntry={(entry) => setViewingEntry(entry)} 
                />
            )}
        </div>
    );
}

export default Home;