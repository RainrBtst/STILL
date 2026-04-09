import React, { useEffect, useState, useRef } from 'react';
import './ReadJournal.css';

function ReadJournal({ selectedSong, onClose, existingData }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const audioRef = useRef(null);

    // --- FIX: Extract song data from either direct props or nested songDetails ---
    const songInfo = {
        title: selectedSong?.songDetails?.title || selectedSong?.title || selectedSong?.name,
        artist: selectedSong?.songDetails?.artist || selectedSong?.artist,
        albumArt: selectedSong?.songDetails?.albumArt || selectedSong?.albumArt,
        previewUrl: selectedSong?.songDetails?.previewUrl || selectedSong?.previewUrl
    };

    const getPages = (text) => {
        if (!text) return [""];
        
        const maxCharsPerLine = 62; // Safety limit to ensure clean justification
        const lines = [];
        
        // Split by existing newlines to respect paragraph breaks
        const paragraphs = text.split('\n');

        paragraphs.forEach(para => {
            const words = para.split(' ');
            let currentLine = "";

            words.forEach(word => {
                // If adding the word exceeds the line length, push and wrap
                if ((currentLine + word).length > maxCharsPerLine) {
                    lines.push(currentLine.trim());
                    currentLine = word + " ";
                } else {
                    currentLine += word + " ";
                }
            });
            lines.push(currentLine.trim());
        });

        // Group lines into pages: 10 lines for Page 1, 16 lines for Page 2+
        const paginated = [];
        let lineIndex = 0;

        while (lineIndex < lines.length) {
            const limit = paginated.length === 0 ? 10 : 18;
            const content = lines.slice(lineIndex, lineIndex + limit).join('\n');
            if (content.trim() !== "" || paginated.length === 0) {
                paginated.push(content);
            }
            lineIndex += limit;
        }
        
        return paginated;
    };

    const pages = getPages(existingData?.content);
    const totalPages = pages.length;

    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => (document.body.style.overflow = originalStyle);
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 0) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="read-journal-overlay">
            <div className="read-overlay-content">
                <nav className="read-modal-nav">
                    <button className="read-back-btn" onClick={onClose}>← BACK</button>
                </nav>

                <div className="read-hero-text">
                    <p className="read-subtitle">Reliving this moment...</p>
                </div>

                <div className="read-paper-card">
                    {currentPage === 0 && (
                        <div className="read-music-section">
                            {/* FIX: Use songInfo for the Image */}
                            <img src={songInfo.albumArt} alt="Album Art" className="read-modal-art" />
                            <div className="read-music-info">
                                <p className="read-label">SONG TITLE:</p>
                                <h3 className="read-song-name">{songInfo.title}</h3>
                                <p className="read-label">by</p>
                                <p className="read-artist-name">{songInfo.artist}</p>
                                
                                {/* FIX: Use songInfo for the Audio Source */}
                                <audio 
                                    ref={audioRef} 
                                    src={songInfo.previewUrl} 
                                    onEnded={() => setIsPlaying(false)} 
                                />
                                <button className="read-play-preview-btn" onClick={togglePlay}>
                                    {isPlaying ? "❚❚ PAUSE PREVIEW" : "▶ PLAY PREVIEW"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="read-body-content">
                        {currentPage === 0 && <h2 className="read-entry-title">{existingData?.journalTitle}</h2>}
                        <p className="read-entry-text">{pages[currentPage]}</p>
                    </div>

                    <div className="read-pagination-controls">
                        {totalPages > 1 && (
                            <button 
                                className={`read-nav-arrow ${currentPage === 0 ? 'hidden' : ''}`} 
                                onClick={prevPage}
                            >
                                ←
                            </button>
                        )}
                        
                        <div className="read-page-footer">
                            {totalPages > 1 ? `PAGE ${currentPage + 1}/${totalPages}` : ""}
                        </div>

                        {totalPages > 1 && (
                            <button 
                                className={`read-nav-arrow ${currentPage === totalPages - 1 ? 'hidden' : ''}`} 
                                onClick={nextPage}
                            >
                                →
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="read-sparkle"></div>
            </div>
        </div>
    );
}

export default ReadJournal;