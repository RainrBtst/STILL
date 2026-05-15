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
  const [isPlaying, setIsPlaying] = useState(false);

  const [realWeeklyData, setRealWeeklyData] = useState([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [isAvailable, setIsAvailable] = useState(false);
  const [nextReleaseDate, setNextReleaseDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeModalSong, setActiveModalSong] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const openSongModal = (song) => {
    setActiveModalSong(song);
  };

  useEffect(() => {
    // 1. TIME CHECK
    const now = new Date();
    if (now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 57)) {
        setIsAvailable(true);
    } else {
        setIsAvailable(false);
        setNextReleaseDate("Sunday");
    }

    const fetchUserDataAndJournals = async () => {
      const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
      const userCreatedDate = new Date(localStorage.getItem("createdAt") || Date.now());
      
      if (!userId || userId === "undefined") {
          console.error("User ID is missing. Please log in again.");
          setLoading(false);
          return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/user-journals/${userId}`);
        const journals = res.data;

        // Calculate Week Number
        const today = new Date();
        const diffInMs = today - userCreatedDate;
        const diffInWeeks = Math.max(1, Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7)) + 1);
        setWeekNumber(diffInWeeks);

        // Grouping logic with fallback keys to prevent empty cards
        const grouped = journals.reduce((acc, journal) => {
          const dateLabel = new Date(journal.date).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', weekday: 'short' 
          }).toUpperCase();
          
          if (!acc[dateLabel]) acc[dateLabel] = [];
          
          acc[dateLabel].push({
            title: journal.journalTitle || journal.title || "Untitled Moment",
            artist: journal.songName || journal.artist || journal.songDetails?.artist || "Unknown Artist",
            mood: (journal.mood || "HAPPY").toUpperCase(),
            albumArt: journal.albumArt || journal.songDetails?.albumArt || "",
            content: journal.content || journal.journalText || "No thoughts recorded."
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
        console.error("Failed to load journals:", err);
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

  return (
    <div className="nt-container">
      <nav className="nt-navbar">
        <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
        <div className="nt-nav-links-wrapper">
            <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewind} >
                <span>Rhythm Rewind</span>
            </div>
            <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => window.location.href = '/send-song'} >
                <span>Send a SonG</span>
            </div>
        </div>
        <div className="nt-nav-actions">
            <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                    {profilePic ? <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : "👤"}
                </div>
                {showProfileDropdown && (
                    <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px'}}>
                        <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '5px', cursor: 'pointer'}}>HOME</button>
                        <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '5px', cursor: 'pointer'}}>PROFILE</button>
                        <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '5px', cursor: 'pointer'}}>LOGOUT</button>
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
          <div className="rewind-lock-screen">
            <div className="lock-card">
               <h2 className="lock-title">Almost Ready</h2>
               <p>See you on Sunday</p>
            </div>
          </div>
        ) : (
          <>
            <div className="week-subtitle"><h3>WEEK {weekNumber}</h3></div>
            <div className="week-grid">
              {realWeeklyData.map((day, index) => (
                <div key={index} className="day-column">
                  <span className="day-label">{day.date}</span>
                  <div className="song-stack">
                    {day.entries.map((song, sIndex) => (
                      <div key={sIndex} className="song-card" onClick={() => openSongModal(song)} style={{cursor: 'pointer'}}>
                        <div className="album-thumb" style={{backgroundImage: `url(${song.albumArt})`, backgroundSize: 'cover'}}></div>
                        <div className="song-meta">
                          <p className="song-title">{song.title}</p>
                          <span className="mood-tag">{song.mood}</span>
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

      {activeModalSong && (
        <div className="rewind-modal-overlay" onClick={() => setActiveModalSong(null)}>
          <div className="rewind-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModalSong(null)}>×</button>
            <div className="modal-album-art" style={{backgroundImage: `url(${activeModalSong.albumArt})`, backgroundSize: 'cover', width: '200px', height: '200px', margin: '0 auto'}}></div>
            <h2 className="modal-song-title">{activeModalSong.title}</h2>
            <p className="modal-song-artist">{activeModalSong.artist}</p>
            <span className="modal-mood-badge">{activeModalSong.mood}</span>
            <p className="modal-journal-text" style={{marginTop: '20px', fontStyle: 'italic'}}>"{activeModalSong.content}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewind;