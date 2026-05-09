import React, { useState, useRef, useEffect } from 'react';
import './SendSong.css';
import Message from './Message';
import axios from 'axios';

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

    // --- NAV HANDLERS ---
    const handleHome = () => { window.location.href = '/home'; };
    const handleProfile = () => { window.location.href = '/profile'; };
    const handleAbout = () => { window.location.href = '/about'; };
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("profilePic");
        window.location.href = "/login";
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/messages`);
                setMessages(res.data);
            } catch (err) { console.error("Error fetching messages:", err); }
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
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const audio = audioRef.current;
        if (!audio || !audio.src) return;
        if (audio.paused) {
            try { await audio.play(); setIsPlaying(true); } 
            catch (err) { if (err.name !== 'AbortError') console.error(err); }
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
            const response = await axios.post(`${API_BASE_URL}/api/messages`, formData);
            setMessages([response.data, ...messages]);
            setIsModalOpen(false);
            setFormData({ recipient: '', message: '', song: '', albumArt: '', previewUrl: '' });
        } catch (err) { console.error(err); }
    };

    const filteredMessages = messages.filter(msg =>
        msg.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const chunkedRows = [];
    for (let i = 0; i < filteredMessages.length; i += 8) {
        chunkedRows.push(filteredMessages.slice(i, i + 8));
    }

    return (
        <div className="nt-container">
            <audio ref={audioRef} src={playingMessage?.previewUrl} key={playingMessage?.previewUrl || 'silent'} preload="auto" />

            {playingMessage && (
                <div className="ss-letter-overlay">
                    <button className="ss-close-letter" onClick={() => {
                        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
                        setPlayingMessage(null);
                        setIsPlaying(false);
                    }}>✕</button>
                    <div className="ss-letter-paper">
                        <h2 className="ss-letter-greeting">Hello, <span className="ss-handwritten-name">{playingMessage.recipient}</span></h2>
                        <p className="ss-letter-sub">There's someone sending you a song...</p>
                        <div className="ss-spotify-card">
                            <img src={playingMessage.albumArt} alt="" className="ss-spotify-art" />
                            <div className="ss-spotify-info">
                                <h3>{playingMessage.song}</h3>
                                <div className="ss-spotify-controls">
                                    <div className="ss-mini-progress">
                                        <div className="ss-mini-fill" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
                                    </div>
                                    <button type="button" onClick={togglePlay} className="ss-mini-play">
                                        {isPlaying ? "⏸" : "▶"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="ss-sender-label">MESSAGE FROM SENDER:</p>
                        <div className="ss-handwritten-body">"{playingMessage.message}"</div>
                    </div>
                </div>
            )}

            {/* --- EXACT HOME NAV BAR JSX --- */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" onClick={handleHome}>STILL</h1>
                <div className="nt-nav-note" onClick={() => window.location.href = '/send-song'}>
                    <span>Send a Song</span>
                </div>
                <div className="nt-profile-container" ref={dropdownRef}>
                    <div className="nt-profile-circle" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                        {profilePic ? <img src={profilePic} alt="Profile" /> : "👤"}
                    </div>
                    {showProfileDropdown && (
                        <div className="nt-profile-dropdown">
                            <button className="nt-logout-btn-dropdown" onClick={handleHome}>HOME</button>
                            <button className="nt-logout-btn-dropdown" onClick={handleProfile}>PROFILE</button>
                            <button className="nt-logout-btn-dropdown" onClick={handleAbout}>ABOUT</button>
                            <button className="nt-logout-btn-dropdown" onClick={handleLogout}>LOGOUT</button>
                        </div>
                    )}
                </div>
            </nav>

            <header className="nt-hero">
                <p className="ss-hero-subtitle">Express your untold message through song. Anonymously.</p>
                <button className="nt-btn-primary ss-main-btn" onClick={() => setIsModalOpen(true)}>+ TELL YOUR MESSAGE</button>
                <div className="ss-alignment-wrapper">
                    <div className="ss-search-input-box">
                        <span className="ss-search-icon">🔍</span>
                        <input type="text" placeholder="Search for names" className="ss-custom-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </header>

            <div className="ss-marquee-container">
                {searchTerm ? (
                    <div className="ss-search-results-grid">
                        {filteredMessages.map((item, i) => (
                            <div key={i} className="ss-dark-card ss-static-card" onClick={() => setPlayingMessage(item)}>
                                <span className="ss-card-label">TO: {item.recipient}</span>
                                <p className="ss-card-text">"{item.message}"</p>
                                <div className="ss-card-meta">
                                    {item.albumArt && <img src={item.albumArt} alt="" className="ss-meta-mini-art" />}
                                    {item.song}
                                </div>
                            </div>
                        ))}
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