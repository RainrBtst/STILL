import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Daily.css';

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3001" 
    : "https://still-csmi.onrender.com";

function Daily() {
  // --- REQUIRED HOOKS & STATE VARIABLES ---
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

  // --- DAILY AUX DASHBOARD DATA STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  
  // Enforce new 10-vote pool allocations
  const [votesRemaining, setVotesRemaining] = useState(10);
  const [votedTracksList, setVotedTracksList] = useState([]);
  
  // Custom Limit Modal State
  const [showLimitModal, setShowLimitModal] = useState(false);
  // NEW STATE VARIABLE FOR THE DUPLICATE TRACK SELECTION MODAL
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");

  // --- HANDLER FUNCTIONS ---
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

  // --- CLICK OUTSIDE DROPDOWN LOGIC ---
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowProfileDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- DYNAMIC COUNTDOWN TIMER ---
  useEffect(() => {
    const updateCountdown = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const diff = midnight - now;
        const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
        
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- FETCH LEADERBOARD & USER STATUS BREAKDOWN FROM API ---
  const fetchAuxPlaylist = async () => {
    try {
        // 1. Get tracks
        const res = await axios.get(`${API_BASE_URL}/api/daily-aux`);
        const sortedPlaylist = res.data.sort((a, b) => b.votes - a.votes);
        setPlaylist(sortedPlaylist);

        // 2. Fetch specific user distribution metrics tracking totals
        const userStatusRes = await axios.get(`${API_BASE_URL}/api/daily-aux/user-status/${userId}`);
        setVotesRemaining(userStatusRes.data.votesRemaining);
        setVotedTracksList(userStatusRes.data.votedTracks);
    } catch (err) {
        console.error("Error loading Aux panel telemetry", err);
    }
  };

  useEffect(() => {
    if (userId) {
       fetchAuxPlaylist();
    }
  }, [userId]);

  // --- SEARCH ENGINE TRIGGER DEBOUNCE TRACKING ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (searchQuery.length > 2) {
            try {
                const res = await axios.get(`${API_BASE_URL}/music-search?query=${searchQuery}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error("Track search failed", err);
            }
        } else {
            setSearchResults([]);
        }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAddTrack = async (track) => {
    try {
        await axios.post(`${API_BASE_URL}/api/daily-aux/add`, {
            songId: track.id,
            title: track.name,
            artist: track.artist,
            albumArt: track.albumArt,
            previewUrl: track.previewUrl,
            userId,
            username: localStorage.getItem("currentUsername")
        });
        setSearchQuery('');
        setSearchResults([]);
        fetchAuxPlaylist();
    } catch (err) {
        setSearchQuery('');
        setSearchResults([]);
        
        // Enforce modal popups if backend triggers specific validation protection status codes
        if (err.response && err.response.data && err.response.data.code === "LIMIT_REACHED") {
            setShowLimitModal(true);
        } else if (err.response && err.response.status === 400) {
            // Catches standard bad request rules indicating the unique track entry item already exists on board
            setShowDuplicateModal(true);
        } else {
            alert(err.response?.data || "Could not pass this track to the dashboard");
        }
    }
  };

  const handleVote = async (trackId) => {
    if (votesRemaining <= 0) return;
    try {
        await axios.post(`${API_BASE_URL}/api/daily-aux/vote`, { trackId, userId });
        fetchAuxPlaylist();
    } catch (err) {
        console.error("Vote tracking execution failed", err);
    }
  };

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
                <span>Send a Song</span>
            </div>
            <div className="nt-nav-note active-aux-note" style={{cursor: 'pointer'}}>
                <span>DAILY AUX</span>
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

      {/* --- MAIN LAYOUT SCHEME --- */}
      <div className="aux-dashboard-wrapper">
        <div className="aux-dashboard-left">
          
          {/* HEADER SECTION */}
          <div className="aux-dashboard-header-row">
            <div className="header-meta-titles">
              <h1 className="aux-main-heading">THE DAILY AUX</h1>
              <p className="aux-sub-heading-details">
                Single, global playlist capped at 30 songs. Resets every 24 hours. Cast up to 10 votes across any tracks on the board.
              </p>
            </div>

            {/* SEARCH BANNER FIELD */}
            <div className="aux-search-input-field-wrapper">
              <div className="aux-search-bar-inline">
                <span className="search-plug-vector">🔌</span>
                <input 
                  type="text" 
                  placeholder="Search song and  put it in Aux" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="aux-search-results-floating-box">
                  {searchResults.map((track) => (
                    <div key={track.id} className="aux-search-result-row" onClick={() => handleAddTrack(track)}>
                      <img src={track.albumArt} alt="cover" />
                      <div className="result-text-node">
                        <h6>{track.name}</h6>
                        <p>{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PLAYLIST ENTRIES GRID */}
          <div className="aux-grid-tracks-system">
            {playlist.length === 0 ? (
              <p className="empty-aux-notice-label">The Aux is currently empty. Drop a track above to fill the leaderboard.</p>
            ) : (
              playlist.map((track, index) => {
                // Find if this current user has cast an upvote on this item
                const userContributions = track.votedUsers?.find(u => u.userId === userId);
                const userHasVotedThisSong = !!userContributions;
                
                return (
                  <div key={track._id || index} className="aux-grid-card-item">
                    <div className="aux-index-marker-digit">{index + 1}.</div>
                    <div className="aux-card-inner-box">
                      <img className="aux-card-artwork" src={track.albumArt || "https://via.placeholder.com/150"} alt="Art" />
                      <div className="aux-card-labels">
                        <h5 className="aux-track-headline">{track.title}</h5>
                        <p className="aux-track-byline">{track.artist}</p>
                        <div className="aux-tag-mood-badge">ACTIVE</div>
                      </div>
                      <div className="aux-action-btn-cell">
                        <button 
                          className={`aux-votes-pill-btn ${userHasVotedThisSong ? 'voted-active-glow' : ''}`}
                          disabled={votesRemaining <= 0}
                          onClick={() => handleVote(track._id)}
                        >
                          <span className="btn-plug-icon">🔌</span>
                          <span className="btn-votes-digits">VOTES: {track.votes}</span>
                        </button>
                        <p className="aux-vote-indicator-text">
                          {userHasVotedThisSong ? `You cast: ${userContributions.count}` : "Click to Vote"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- STICKY SIDEBAR VOTE TRACKER --- */}
        <div className="aux-dashboard-right-sidebar">
          <div className="vote-status-sticky-panel">
            <h4 className="sidebar-status-title">YOUR VOTE STATUS</h4>
            <p className="sidebar-status-desc">You get 10 votes per day.</p>
            
            <div className="sidebar-data-metric-block">
              <span className="metric-label">Votes Remaining:</span>
              <span className="metric-value-num">{votesRemaining} / 10</span>
            </div>

            {/* DYNAMIC SCROLL CONTAINER SHOWING ALL VOTED SONGS */}
            <p className="voted-card-header-label">You have voted for:</p>
            <div className="sidebar-voted-tracks-scroll-list">
              {votedTracksList.length === 0 ? (
                <div className="sidebar-voted-display-card">
                  <div className="voted-card-row-data">
                    <span className="voted-song-title-str" style={{color: '#666'}}>[No songs upvoted yet]</span>
                    <div className="voted-mini-plug-circle">🔌</div>
                  </div>
                </div>
              ) : (
                votedTracksList.map((track, i) => (
                  <div key={i} className="sidebar-voted-display-card">
                    <div className="voted-card-row-data">
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <span className="voted-song-title-str" title={track.title}>"{track.title}"</span>
                        <span style={{fontSize: '0.7rem', color: '#666'}}>{track.artist}</span>
                      </div>
                      <div className="voted-mini-plug-circle" style={{backgroundColor: '#2c2813', color: '#FAEF5D', fontSize: '0.7rem', fontWeight: 'bold'}}>
                        +{track.votesContributed}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sidebar-footer-countdown-row">
              <span className="yellow-timer-text">{timeLeft}</span>
              <span className="until-reset-lbl">Until Reset</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- STRICT POPUP MODAL ENFORCEMENT --- */}
      {showLimitModal && (
        <div className="still-modal-overlay">
          <div className="still-modal-card">
            <h3 className="modal-title">LEADERBOARD FULL</h3>
            <p className="modal-message">
              Leaderboard has a maximum songs, you can vote for now only.
            </p>
            <div className="modal-actions">
              <button className="modal-btn-primary" onClick={() => setShowLimitModal(false)}>
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DUPLICATE TRACK SUBMISSION WARNING MODAL SYSTEM --- */}
      {showDuplicateModal && (
        <div className="still-modal-overlay">
          <div className="still-modal-card">
            <h3 className="modal-title">DUPLICATE SONG</h3>
            <p className="modal-message">
              This song is already on the leaderboard. Upvote it instead.
            </p>
            <div className="modal-actions">
              <button className="modal-btn-primary" onClick={() => setShowDuplicateModal(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Daily;