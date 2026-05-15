import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Rewind.css';
import ReadJournal from './ReadJournal'; // Ensure the path is correct

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

const Rewind = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic] = useState(localStorage.getItem("profilePic"));
  const [realWeeklyData, setRealWeeklyData] = useState([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State to handle the ReadJournal view
  const [selectedJournal, setSelectedJournal] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. TIME CHECK (Unlocks at 3:57 PM)
    const now = new Date();
    if (now.getHours() > 15 || (hours === 15 && minutes >= 57)) {
        setIsAvailable(true);
    } else {
        setIsAvailable(false);
    }

    const fetchUserDataAndJournals = async () => {
      const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
      const userCreatedDate = new Date(localStorage.getItem("createdAt") || Date.now());
      
      if (!userId || userId === "undefined") {
          console.error("User ID is missing.");
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

        // Grouping logic
        const grouped = journals.reduce((acc, journal) => {
          const dateLabel = new Date(journal.date).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', weekday: 'short' 
          }).toUpperCase();
          
          if (!acc[dateLabel]) acc[dateLabel] = [];
          
          acc[dateLabel].push({
            ...journal,
            // Mapping keys for ReadJournal compatibility
            journalTitle: journal.journalTitle || journal.title || "Untitled Moment",
            content: journal.content || journal.journalText || "No thoughts recorded.",
            mood: (journal.mood || "HAPPY").toUpperCase(),
            // Ensure songDetails exists for ReadJournal
            songDetails: journal.songDetails || {
                title: journal.songName || journal.title,
                artist: journal.artist,
                albumArt: journal.albumArt,
                previewUrl: journal.previewUrl
            }
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

  const handleLogout = () => { 
    const seenFlag = localStorage.getItem("hasSeenRewindModal");
    localStorage.clear(); 
    if (seenFlag) localStorage.setItem("hasSeenRewindModal", seenFlag);
    window.location.href = '/login'; 
  };
  const handleHome = () => navigate('/home');
  const handleProfile = () => navigate('/profile');
  const handleRewind = () => navigate('/rewind');
  const handleAbout = () => navigate('/about');

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowProfileDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <div className="loading-screen">Loading your rhythm...</div>;

  return (
    <div className="nt-container">
      {/* --- NAVBAR --- */}
      <nav className="nt-navbar">
        <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
        <div className="nt-nav-links-wrapper">
            <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewind} >
                <span>Rhythm Rewind</span>
            </div>
            <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={() => navigate('/send-song')} >
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
                                <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer'}}>LOGOUT</button>
                            </div>
                        )}
            </div>
        </div>
      </nav>

      {/* --- REWIND CONTENT --- */}
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
              {realWeeklyData.length === 0 ? (
                <p className="no-data">No entries found for this week yet.</p>
              ) : (
                realWeeklyData.map((day, index) => (
                  <div key={index} className="day-column">
                    <span className="day-label">{day.date}</span>
                    <div className="song-stack">
                      {day.entries.map((song, sIndex) => (
                        <div key={sIndex} className="song-card" onClick={() => setSelectedJournal(song)} style={{cursor: 'pointer'}}>
                          <div className="album-thumb" style={{backgroundImage: `url(${song.songDetails.albumArt})`, backgroundSize: 'cover'}}></div>
                          <div className="song-meta">
                            <p className="song-title">{song.journalTitle}</p>
                            <span className="mood-tag">{song.mood}</span>
                            <p className="song-artist">{song.songDetails.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* --- INTEGRATED READ JOURNAL --- */}
      {selectedJournal && (
        <ReadJournal 
            selectedSong={selectedJournal} 
            existingData={selectedJournal} 
            onClose={() => setSelectedJournal(null)} 
        />
      )}
    </div>
  );
};

export default Rewind;