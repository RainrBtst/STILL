import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Message.css';

const Message = ({ isOpen, onClose, formData, handleInputChange, handleSubmit }) => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch songs from your backend proxy
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setIsLoading(true);
                try {
                    const res = await axios.get(`https://still-csmi.onrender.com/music-search?query=${query}`);
                    setSearchResults(res.data);
                } catch (err) {
                    console.error("Search error:", err);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

   const handleSelectSong = (song) => {
    // This matches the keys you defined in index.js (/music-search)
    handleInputChange({
        target: { name: 'song', value: song.name }
    });
    handleInputChange({
        target: { name: 'albumArt', value: song.albumArt }
    });
    // This is the critical line to make it play!
    handleInputChange({
        target: { name: 'previewUrl', value: song.previewUrl } 
    });

    setQuery('');
    setSearchResults([]);
};

    if (!isOpen) return null;

    return (
        <div className="ss-modal-overlay">
            <div className="ss-modal-content">
                <button className="ss-modal-close" onClick={onClose}>&times;</button>
                <form onSubmit={handleSubmit}>
                    <div className="ss-form-group">
                        <label>Recipient</label>
                        <input 
                            name="recipient" 
                            placeholder="Input recipient" 
                            value={formData.recipient} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    <div className="ss-form-group">
                        <label>Message</label>
                        <textarea 
                            name="message" 
                            placeholder="Input message" 
                            value={formData.message} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    
                    {/* The relative positioning is handled in CSS for this group */}
                    <div className="ss-form-group ss-search-container">
                        <label>Song</label>
                        <div className="ss-search-wrapper">
                            <input 
                                type="text" 
                                placeholder="Search and select your song" 
                                value={query || formData.song} 
                                onChange={(e) => setQuery(e.target.value)} 
                            />
                            {isLoading && <span className="ss-loader">...</span>}
                        </div>
                        
                        {searchResults.length > 0 && (
                            <div className="ss-search-dropdown">
                                {searchResults.map((song) => (
                                    <div key={song.id} className="ss-search-item" onClick={() => handleSelectSong(song)}>
                                        <img src={song.albumArt} alt="art" className="ss-dropdown-art" />
                                        <div className="ss-item-info">
                                            <strong>{song.name}</strong>
                                            <span>{song.artist}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button type="submit" className="ss-submit-btn">SUBMIT</button>
                </form>
            </div>
        </div>
    );
};

export default Message;