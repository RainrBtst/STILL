import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Rewind.css';

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

const Rewind = () => {
  // HOOKS AND REFS INSIDE COMPONENT CONTEXT
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));
  const [showArchives, setShowArchives] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  // Mock data showing multiple entries for specific days
  const weeklyData = [
    { date: 'MAY 9 (SUN)', entries: [{ title: 'somacea', mood: 'HAPPY' }, { title: 'ang tram', mood: 'CALM' }] },
    { date: 'MAY 10 (MON)', entries: [{ title: 'ang tram', mood: 'HAPPY' }, { title: 'ang tra...', mood: 'HAPPY' }] },
    { date: 'MAY 11 (TUE)', entries: [{ title: 'shining', mood: 'CALM' }, { title: 'shining', mood: 'CALM' }, { title: 'shining', mood: 'HAPPY' }] },
    { date: 'MAY 12 (WED)', entries: [{ title: 'manoyla', mood: 'HAPPY' }, { title: 'shining', mood: 'CALM' }, { title: 'man...', mood: 'ENERGETIC' }, { title: 'lost...', mood: 'MELANCHOLIC' }, { title: 'chill', mood: 'CHILL' }] },
    { date: 'MAY 13 (THUR)', entries: [{ title: 'lost', mood: 'MELANCHOLIC' }, { title: 'ma...', mood: 'MELANCHOLIC' }, { title: 'los!', mood: 'MELANCHOLIC' }, { title: 'los:', mood: 'MELANCHOLIC' }, { title: 'manoyla', mood: 'CALM' }], active: true },
    { date: 'MAY 14 (FRI)', entries: [{ title: 'ang tram', mood: 'HAPPY' }, { title: 'ang tram', mood: 'HAPPY' }] },
    { date: 'MAY 15 (SAT)', entries: [{ title: 'somacea', mood: 'HAPPY' }, { title: 'ang tra...', mood: 'CALM' }, { title: 'somacea', mood: 'CALM' }] },
  ];

  const [hoveredDay, setHoveredDay] = useState('MAY 13 (THUR)');

  const handleRewind = () => {
    navigate('/rewind');
  };

  const handleLogout = () => {
    localStorage.clear();
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

  const handleSelectSong = (track) => {
    setSelectedSong(track);
    setSearchQuery(''); 
    setResults([]); 
    setIsPlaying(false);
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
      <nav className="nt-navbar">
        <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => setShowArchives(false)}>STILL</h1>
        <div className="nt-nav-links-wrapper">
            <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={handleRewind} >
                <span>Rhythm Rewind</span>
            </div>
            <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => window.location.href = '/send-song'} >
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
                <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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

      <div className="rewind-page">
        <header className="rewind-header">
          <h1>WEEKLY RHYTHM REWIND</h1>
          <p>Your musical journey is complex; view all your daily expressions.</p>
        </header>

        <div className="week-grid">
          {weeklyData.map((day, index) => (
            <div 
              key={index} 
              className={`day-column ${hoveredDay === day.date ? 'active' : ''}`}
              onMouseEnter={() => setHoveredDay(day.date)}
            >
              <span className="day-label">{day.date}</span>
              <div className="song-stack">
                {day.entries.map((song, sIndex) => (
                  <div key={sIndex} className={`song-card ${song.mood.toLowerCase()}`}>
                    <div className="album-thumb"></div>
                    <div className="song-meta">
                      <p className="song-title">{song.title}</p>
                      <span className="mood-tag">{song.mood}</span>
                    </div>
                  </div>
                ))}
              </div>
              {hoveredDay === day.date && day.entries.length > 3 && (
                <div className="scroll-indicator">*Scrolling through tracks...</div>
              )}
            </div>
          ))}
        </div>

        <div className="mood-map">
           <span className="dot energetic"></span> Energetic
           <span className="dot happy"></span> Happy
           <span className="dot melancholic"></span> Melancholic
           <span className="dot calm"></span> Calm
        </div>
      </div>
    </div>
  );
};

export default Rewind;