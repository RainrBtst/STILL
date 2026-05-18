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

  // Helper function to figure out the exact calendar week number of any Date object
  const getCalendarWeek = (date) => {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
   // 1. TIME CHECK (Unlocks Sunday 11:59 PM, remains open all week, locks Saturday 11:59 PM)
const now = new Date();
const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const hours = now.getHours();
const minutes = now.getMinutes();

const currentAbsoluteMinutes = (day * 24 * 60) + (hours * 60) + minutes;

const unlockTime = (0 * 24 * 60) + (23 * 60) + 59; // Sunday 11:59 PM
const lockTime = (6 * 24 * 60) + (23 * 60) + 59;   // CHANGED TO 6: Saturday 11:59 PM

if (currentAbsoluteMinutes >= unlockTime && currentAbsoluteMinutes <= lockTime) {
    setIsAvailable(true);
} else {
    setIsAvailable(false);
}

    const fetchUserDataAndJournals = async () => {
      const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
      const userCreatedDate = new Date(localStorage.getItem("createdAt") || Date.now());
      
      if (!userId || userId === "undefined") {
          setLoading(false);
          return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/user-journals/${userId}`);
        const journals = res.data;

        // Calculate Week Number for display
        const today = new Date();
        const diffInMs = today - userCreatedDate;
        const diffInWeeks = Math.max(1, Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7)) + 1);
        setWeekNumber(diffInWeeks);

        // Get the current week number to isolate data processing boundaries
        const currentTrackingWeek = getCalendarWeek(today);

        const grouped = journals.reduce((acc, journal) => {
          if (!journal.date) return acc;
          
          // --- TARGETED DATA FILTERING LOGIC ---
          // Resolve entry validation timestamp
          let entryDate = new Date(journal.createdAt || journal.date);
          if (isNaN(entryDate.getTime())) {
              entryDate = new Date();
          }

          // If the entry belongs to the current calendar week or a future date,
          // exclude it from this overview window so it stays locked until next week's release cycle.
          if (getCalendarWeek(entryDate) >= currentTrackingWeek && entryDate.getFullYear() === today.getFullYear()) {
              return acc; 
          }
          // -------------------------------------

          let dateLabel = "";

          // Match string format from your Mongoose schema (e.g., "MAY 18")
          if (typeof journal.date === 'string' && isNaN(Number(journal.date)) && !journal.date.includes('-') && !journal.date.includes('/')) {
              dateLabel = journal.date.toUpperCase();
          } else {
              let localDate;
              try {
                const rawDateStr = String(journal.date).includes('T') ? String(journal.date).split('T')[0] : String(journal.date);
                if (rawDateStr.includes('-')) {
                  const parts = rawDateStr.split('-').map(Number);
                  if (parts.length === 3 && !parts.some(isNaN)) {
                    localDate = new Date(parts[0], parts[1] - 1, parts[2]);
                  }
                }
                if (!localDate || isNaN(localDate.getTime())) {
                  localDate = new Date(journal.date);
                }
              } catch (e) {
                localDate = new Date(journal.date);
              }

              if (!localDate || isNaN(localDate.getTime())) {
                  localDate = new Date(journal.createdAt || Date.now());
              }

              dateLabel = localDate.toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric'
              }).toUpperCase();
          }
          
          if (!acc[dateLabel]) acc[dateLabel] = [];
          acc[dateLabel].push({
            ...journal,
            journalTitle: journal.journalTitle || journal.title || "Untitled Moment",
            content: journal.content || journal.journalText || "No thoughts recorded.",
            mood: (journal.mood || "HAPPY").toUpperCase(),
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
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const trueWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    const weekKey = `seenRewind_Year${now.getFullYear()}_Week${trueWeekNumber}`;
    const seenValue = localStorage.getItem(weekKey);
    
    localStorage.clear(); 
    
    if (seenValue) {
        localStorage.setItem(weekKey, seenValue);
    }
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