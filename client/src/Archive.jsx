import React, { useState } from 'react'; // Added useState
import './Archive.css';

function Archive({ archivedEntries, onBack, onViewEntry }) {
    // --- ADDED: Local state for the search query ---
    const [searchTerm, setSearchTerm] = useState('');

    // --- ADDED: Filter logic to match song title or journal title ---
    const filteredEntries = archivedEntries.filter((entry) => {
        const titleMatch = entry.journalTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const songMatch = entry.songDetails?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        return titleMatch || songMatch;
    });

    return (
        <main className="archive-main">
            <div className="archive-header">
                <button className="archive-back-btn" onClick={onBack}>
                    ← BACK TO TODAY
                </button>
                <h2 className="archive-title">PAST JOURNALS</h2>
                <p className="archive-subtitle">Your collection of musical memories.</p>

                {/* --- ADDED: Search Bar Element --- */}
                <div className="nt-search-bar" style={{ marginTop: '20px', maxWidth: '400px' }}>
                    <span className="search-icon">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search archived songs or journals..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            outline: 'none',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            <div className="archive-grid">
                {/* --- UPDATED: Mapping over filteredEntries instead of archivedEntries --- */}
                {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                        <div key={entry._id || entry.id} className="archive-card" onClick={() => onViewEntry(entry)}>
                            <div 
                                className="archive-album-art" 
                                style={{
                                    backgroundImage: `url(${entry.songDetails?.albumArt})`
                                }}
                            >
                                <div className="archive-overlay">RECALL</div>
                            </div>
                            <div className="archive-content">
                                <div className="archive-card-top">
                                    <span className="archive-date-text">{entry.journalTitle}</span>
                                </div>
                                <p className="archive-song-metadata">
                                    {new Date(entry.createdAt).toLocaleDateString()} • {entry.songDetails?.title}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="archive-empty-msg">
                        {searchTerm ? "No matching journals found." : "Your archive is currently empty."}
                    </p>
                )}
            </div>
        </main>
    );
}

export default Archive;