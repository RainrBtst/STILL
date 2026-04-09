import React, { useState, useRef, useEffect } from 'react';
import './Journal.css';

function Journal({ selectedSong, onClose, onSave, isReadOnly, existingData }) {
    // --- NEW: LOGIC TO HANDLE EXISTING DATA ---
    const [mood, setMood] = useState(existingData?.mood || 'Happy');
    const [journalTitle, setJournalTitle] = useState(existingData?.journalTitle || '');
    const [content, setContent] = useState(existingData?.content || '');

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    // NEW: State for the toggleable "Other Vibes" menu
    const [showOtherVibes, setShowOtherVibes] = useState(false);
    
    // --- ADDED: MODAL STATE ---
    const [showModal, setShowModal] = useState(false);
    
    const audioRef = useRef(null);

    const otherVibesList = [
        { name: 'Chill', emoji: '☁️' },
        { name: 'Sad', emoji: '🌧️' },
        { name: 'Angry', emoji: '💢' },
        { name: 'In Love', emoji: '💖' },
        { name: 'Focus', emoji: '🧠' }
    ];

    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => (document.body.style.overflow = originalStyle);
    }, []);

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const duration = audioRef.current.duration;
        const currentTime = audioRef.current.currentTime;
        if (duration) {
            setProgress((currentTime / duration) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    // --- NEW: HANDLE SAVE ACTION ---
    const handleSaveAction = () => {
        if (!journalTitle || !content) {
            // UPDATED: Use themed modal instead of alert
            setShowModal(true);
            return;
        }
        onSave({ title: journalTitle, content, mood });
    };

    return (
        <div className="nt-journal-overlay" style={{ backgroundImage: `url(${selectedSong?.albumArt})` }}>
            
            {/* --- ADDED: THEMED MODAL JSX --- */}
            {showModal && (
                <div className="still-modal-overlay">
                    <div className="still-modal-card">
                        <h2 className="modal-title">Missing Info</h2>
                        <p className="modal-message">
                            Please add a title and some thoughts before saving your journey.
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn-primary" onClick={() => setShowModal(false)}>
                                OKAY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="nt-overlay-blur">
                <nav className="nt-modal-nav">
                    <button className="nt-back-btn" onClick={onClose}>← BACK</button>
                    {/* Move Save Entry to Nav if needed to match image_2054c0 */}
                   
                </nav>

                <div className="nt-hero-text">
                    
                    <p className="nt-subtitle">
                        {isReadOnly ? "Reliving this moment..." : "Every day has a rhythm. What's yours today?"}
                    </p>
                </div>

                <div className="nt-glass-card">
                    <div className="nt-music-section">
                        <img src={selectedSong?.albumArt} alt="Album Art" className="nt-modal-art" />
                        
                        <div className="nt-modal-music-info">
                            <p className="label">Song Title:</p>
                            <h3 className="nt-song-name">{selectedSong?.name || selectedSong?.title}</h3>
                            <p className="label">Artist:</p>
                            <p className="artist-name">{selectedSong?.artist}</p>
                            
                            <div className="nt-player-controls">
                                <button className="nt-play-preview-btn" onClick={togglePlay}>
                                    {isPlaying ? '⏸ PAUSE' : '▶ PLAY PREVIEW'}
                                </button>
                                
                                <div className="progress-bar">
                                    <div className="progress" style={{ width: `${progress}%` }}></div>
                                </div>
                                <audio 
                                    ref={audioRef}
                                    src={selectedSong?.previewUrl} 
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={handleEnded}
                                />
                            </div>
                        </div>
                    </div>

                    <input 
                        type="text" 
                        className="nt-journal-input title-fix" 
                        placeholder="Enter a title for this moment..." 
                        value={journalTitle}
                        onChange={(e) => setJournalTitle(e.target.value)}
                        readOnly={isReadOnly}
                    />
                    
                    <textarea 
                        className="nt-journal-input nt-main-editor" 
                        placeholder="Dear Diary, today felt like this song because..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        readOnly={isReadOnly}
                    />

                    <div className="nt-mood-container">
                        <div className="nt-mood-selector">
                            {['Happy', 'Hyped', 'Tired'].map((m) => (
                                <button 
                                    key={m}
                                    className={mood === m ? 'active' : ''} 
                                    onClick={() => {
                                        if (isReadOnly) return;
                                        setMood(m);
                                        setShowOtherVibes(false);
                                    }}
                                >
                                    {m === 'Happy' ? '😊' : m === 'Hyped' ? '🧊' : '🔥'} {m}
                                </button>
                            ))}
                            <button 
                                className={`nt-other-vibes-toggle ${showOtherVibes ? 'active' : ''}`}
                                onClick={() => !isReadOnly && setShowOtherVibes(!showOtherVibes)}
                            >
                                ✨ Other Vibes {showOtherVibes ? '▴' : '▾'}
                            </button>
                        </div>

                        {showOtherVibes && (
                            <div className="nt-other-vibes-menu">
                                {otherVibesList.map((v) => (
                                    <button 
                                        key={v.name}
                                        className={mood === v.name ? 'active' : ''}
                                        onClick={() => {
                                            setMood(v.name);
                                            setShowOtherVibes(false);
                                        }}
                                    >
                                        {v.emoji} {v.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isReadOnly && (
                        <button className="nt-btn-primary full-width" onClick={handleSaveAction}>
                            + SAVE TODAY'S ENTRY
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Journal;