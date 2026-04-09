import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Message.css';

const Message = ({ isOpen, onClose, formData, handleInputChange, handleSubmit }) => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- ADDED: MODAL STATE FOR ERROR ---
    const [showErrorModal, setShowErrorModal] = useState(false);

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
    handleInputChange({
        target: { name: 'song', value: song.name }
    });
    handleInputChange({
        target: { name: 'albumArt', value: song.albumArt }
    });
    handleInputChange({
        target: { name: 'previewUrl', value: song.previewUrl } 
    });

    setQuery('');
    setSearchResults([]);
};

    // --- ADDED: VALIDATION LOGIC ---
    const onFormSubmit = (e) => {
        e.preventDefault();
        if (!formData.recipient || !formData.message || !formData.song) {
            setShowErrorModal(true);
            return;
        }
        handleSubmit(e);
    };

    if (!isOpen) return null;

    return (
        <div className="ss-modal-overlay">
            
            {/* --- ADDED: THEMED MISSING INFO MODAL --- */}
            {showErrorModal && (
                <div className="still-modal-overlay">
                    <div className="still-modal-card">
                        <h2 className="modal-title">MISSING INFO</h2>
                        <p className="modal-message">
                            Please add a recipient name, message, and song before submitting.
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn-primary" onClick={() => setShowErrorModal(false)}>
                                OKAY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="ss-modal-content">
                <button className="ss-modal-close" onClick={onClose}>&times;</button>
                <form onSubmit={onFormSubmit}>
                    <div className="ss-form-group">
                        <label>Recipient</label>
                        <input 
                            name="recipient" 
                            placeholder="Input recipient" 
                            value={formData.recipient} 
                            onChange={handleInputChange} 
                            // removed required
                        />
                    </div>
                    <div className="ss-form-group">
                        <label>Message</label>
                        <textarea 
                            name="message" 
                            placeholder="Input message" 
                            value={formData.message} 
                            onChange={handleInputChange} 
                            // removed required
                        />
                    </div>
                    
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