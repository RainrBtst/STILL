import React, { useState, useRef, useEffect } from 'react';
import './SendSong.css';
import Message from './Message';
import axios from 'axios';

// --- UPDATED: Use Vite Environment Variable for Cloud Deployment ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function SendSong() {
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [playingMessage, setPlayingMessage] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef(null);
    const dropdownRef = useRef(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        recipient: '', message: '', song: '', albumArt: '', previewUrl: ''
    });
    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

    const handleHome = () => { window.location.href = '/home'; };
    const handleProfile = () => { window.location.href = '/profile'; };
    const handleAbout = () => { window.location.href = '/about'; };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- UPDATED FETCH FUNCTION (Removed ngrok headers) ---
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                // Removed the ngrok-skip-browser-warning header as it's no longer needed for Render
                const res = await axios.get(`${API_BASE_URL}/api/messages`);
                setMessages(res.data);
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };
        fetchMessages();
    }, []);

    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
    }, [playingMessage]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [playingMessage]);

    const togglePlay = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const audio = audioRef.current;
        if (!audio || !audio.src) return;

        if (audio.paused) {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (err) {
                if (err.name !== 'AbortError') console.error("Manual play failed:", err);
            }
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.song) return;

        try {
            // FIXED: Ensuring we use the dynamic base URL here too
            const response = await axios.post(`${API_BASE_URL}/api/messages`, formData);
            setMessages([response.data, ...messages]);
            setIsModalOpen(false);
            setFormData({ recipient: '', message: '', song: '', albumArt: '', previewUrl: '' });
        } catch (err) { 
            console.error("Error posting message:", err); 
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const chunkedRows = [];
    for (let i = 0; i < filteredMessages.length; i += 8) {
        chunkedRows.push(filteredMessages.slice(i, i + 8));
    }

    // --- ADD THIS BLOCK ---
const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("profilePic");
    window.location.href = "/login"; // Or wherever your login route is
};
// ----------------------

const handleHome = () => { window.location.href = '/home'; };
const handleProfile = () => { window.location.href = '/profile'; };
const handleAbout = () => { window.location.href = '/about'; };

    return (
        <div className="nt-container">
            <audio
                ref={audioRef}
                src={playingMessage?.previewUrl}
                key={playingMessage?.previewUrl || 'silent'}
                preload="auto"
            />

            {playingMessage && (
                <div className="ss-letter-overlay">
                    <button className="ss-close-letter" onClick={() => {
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                        }
                        setPlayingMessage(null);
                        setIsPlaying(false);
                    }}>✕</button>

                    <div className="ss-letter-paper">
                        <h2 className="ss-letter-greeting">
                            Hello, <span className="ss-handwritten-name">{playingMessage.recipient}</span>
                        </h2>
                        <p className="ss-letter-sub">
                            There's someone sending you a song, they want you to hear this song that maybe you'll like :)
                        </p>

                        <div className="ss-spotify-card">
                            <img src={playingMessage.albumArt} alt="" className="ss-spotify-art" />
                            <div className="ss-spotify-info">
                                <h3>{playingMessage.song}</h3>
                                <div className="ss-spotify-controls">
                                    <div className="ss-mini-progress">
                                        <div
                                            className="ss-mini-fill"
                                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <button type="button" onClick={togglePlay} className="ss-mini-play">
                                        {isPlaying ? (
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="black"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="black"><path d="M8 5v14l11-7z"></path></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="ss-sender-label"> HERE'S A MESSAGE FROM THE SENDER:</p>
                        <div className="ss-handwritten-body">"{playingMessage.message}"</div>
                    </div>
                </div>
            )}

            {/* NAVBAR SECTION */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={() => setShowArchives(false)}>STILL</h1>
                <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => window.location.href = '/send-song'} >
                    <span>Send a Song</span>
                </div>
                <div className="nt-nav-actions">
                    
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
                                {/* ADDED HOME BUTTON */}
                                <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>HOME</button>
                                {/* ADDED PROFILE BUTTON WITHOUT UNDERLINE */}
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                {/* ADDED ABOUT BUTTON */}
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <header className="nt-hero">
                <p className="ss-hero-subtitle">Express your untold message to someone through the song. Anonymously.</p>
                <button className="nt-btn-primary ss-main-btn" onClick={() => setIsModalOpen(true)}>+ TELL YOUR MESSAGE</button>
                <div className="ss-alignment-wrapper">
                    <div className="ss-search-input-box">
                        <span className="ss-search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search for names" 
                            className="ss-custom-input" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
            </header>

            <div className="ss-marquee-container">
                {searchTerm ? (
                    <div className="ss-search-results-grid">
                        {filteredMessages.length > 0 ? (
                            filteredMessages.map((item, i) => (
                                <div key={i} className="ss-dark-card ss-static-card" onClick={() => setPlayingMessage(item)}>
                                    <span className="ss-card-label">TO: {item.recipient}</span>
                                    <p className="ss-card-text">"{item.message}"</p>
                                    <div className="ss-card-meta">
                                        {item.albumArt && <img src={item.albumArt} alt="" className="ss-meta-mini-art" />}
                                        {item.song}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="ss-no-results">No messages found for "{searchTerm}"</p>
                        )}
                    </div>
                ) : (
                    chunkedRows.map((row, index) => (
                        <div key={index} className="ss-marquee-row">
                            <div className={index % 2 === 0 ? "ss-track-left" : "ss-track-right"}>
                                {[...row, ...row].map((item, i) => (
                                    <div key={i} className="ss-dark-card" onClick={() => setPlayingMessage(item)}>
                                        <span className="ss-card-label">TO: {item.recipient}</span>
                                        <p className="ss-card-text">"{item.message}"</p>
                                        <div className="ss-card-meta">
                                            {item.albumArt && <img src={item.albumArt} alt="" className="ss-meta-mini-art" />}
                                            {item.song}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Message isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} />
        </div>
    );
}

export default SendSong;