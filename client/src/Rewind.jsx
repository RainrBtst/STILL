import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Rewind.css';

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

const Rewind = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));
  const [showArchives, setShowArchives] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- NEW BACKEND STATES ---
  const [realWeeklyData, setRealWeeklyData] = useState([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [isAvailable, setIsAvailable] = useState(false);
  const [nextReleaseDate, setNextReleaseDate] = useState("");
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Logic to calculate Week Number and Next Release
  useEffect(() => {
    const fetchUserDataAndJournals = async () => {
      const userId = localStorage.getItem("userId");
      const userCreatedDate = new Date(localStorage.getItem("createdAt") || Date.now());
      
      try {
        // 1. Fetch only the logged-in user's journals
        const res = await axios.get(`${API_BASE_URL}/user-journals/${userId}`);
        const journals = res.data;

        // 3. Calculate Week Number since account creation
        const today = new Date();
        const diffInMs = today - userCreatedDate;
        const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7)) + 1;
        setWeekNumber(diffInWeeks);

        // 2. Check if it's Sunday 11:59pm
        const dayOfWeek = today.getDay(); // 0 is Sunday
        if (dayOfWeek === 0 && today.getHours() >= 23 && today.getMinutes() >= 59) {
          setIsAvailable(true);
        } else {
          // Calculate next Sunday
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
          const nextSunday = new Date(today);
          nextSunday.setDate(today.getDate() + daysUntilSunday);
          setNextReleaseDate(nextSunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
          setIsAvailable(false);
        }

        // 5. Group journals by their actual entry dates
        const grouped = journals.reduce((acc, journal) => {
          const dateLabel = new Date(journal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).toUpperCase();
          if (!acc[dateLabel]) acc[dateLabel] = [];
          acc[dateLabel].push({
            title: journal.journalTitle,
            artist: journal.songName, // Placeholder logic as per previous request
            mood: journal.mood.toUpperCase()
          });
          return acc;
        }, {});

        const formattedData = Object.keys(grouped).map(date => ({
          date,
          entries: grouped[date]
        }));

        setRealWeeklyData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load rhythm rewind data", err);
        setLoading(false);
      }
    };

    fetchUserDataAndJournals();
  }, []);

  const handleRewind = () => navigate('/rewind');
  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };
  const handleHome = () => window.location.href = '/home';
  const handleProfile = () => window.location.href = '/profile';
  const handleAbout = () => window.location.href = '/about';

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
        <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
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
          <p>Your days, tracked in rhythm.</p>
        </header>

        {!isAvailable ? (
          // Display message if it's not yet Sunday 11:59pm
          <div className="rewind-lock-screen">
    <div className="lock-card">
      <div className="lock-icon-wrapper">
        <div className="pulse-ring"></div>
        <span className="lock-emoji">⏳</span>
      </div>
      
      <h2 className="lock-title">
        Your Weekly Rhythm Rewind is <br/> 
        <span className="highlight-yellow">Almost Ready</span>
      </h2>
      
      <p className="lock-subtitle">
        Gathering your melodies... See you on <span className="day-name">Sunday</span>
      </p>

      <div className="countdown-mini-box">
        <span className="time-tag">RELEASE: 11:59 PM</span>
      </div>

      <div className="loading-bar-container">
        <div className="loading-bar-fill"></div>
      </div>
    </div>
  </div>
        ) : (
          <>
            <div className="week-subtitle">
                <h3>WEEK {weekNumber}</h3>
            </div>

            <div className="week-grid">
              {(realWeeklyData.length > 0 ? realWeeklyData : []).map((day, index) => (
                <div key={index} className="day-column">
                  <span className="day-label">{day.date}</span>
                  <div className="song-stack">
                    {day.entries.map((song, sIndex) => (
                      <div key={sIndex} className="song-card">
                        <div className="album-thumb"></div>
                        <div className="song-meta">
                          <p className="song-title">{song.title}</p>
                          <div className="mood-container">
                            <span className="mood-tag">{song.mood}</span>
                          </div>
                          <p className="song-artist">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Rewind;