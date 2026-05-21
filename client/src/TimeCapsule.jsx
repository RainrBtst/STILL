import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimeCapsule.css';

function TimeCapsule() {
    const [capsuleNote, setCapsuleNote] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [selectedSong, setSelectedSong] = useState(null);
    const [capsules, setCapsules] = useState([]); // Added state for existing capsules

    // ... (keep your existing search/seal logic here)

    return (
        <div className="tc-page-wrapper">
            {/* 1. BIG HEADER */}
            <h1 className="tc-page-title">MUSICAL TIME CAPSULE</h1>
            <p className="tc-page-subtitle">Preserve your daily soundscape for the future.</p>

            {/* 2. OPEN FORM LAYOUT (No bounding box) */}
            <div className="tc-creation-section">
                <div className="tc-input-row">
                    <div className="tc-field">
                        <label>1. UNLOCK DATE</label>
                        <input type="date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />
                    </div>
                    <div className="tc-field">
                        <label>2. PICK A TRACK</label>
                        {/* Your search logic here */}
                    </div>
                </div>
                
                <div className="tc-field full-width">
                    <label>3. YOUR NOTE</label>
                    <textarea value={capsuleNote} onChange={(e) => setCapsuleNote(e.target.value)} placeholder="Write your future memory..." />
                </div>

                <button className="tc-seal-btn" onClick={handleSealCapsule}>🔒 SEAL TIME CAPSULE</button>
            </div>

            {/* 4. CAPSULE ARCHIVE GRID */}
            <section className="tc-archive-section">
                <h2 className="tc-section-title">MY SEALED CAPSULES</h2>
                <div className="tc-capsules-grid">
                    {capsules.map((cap) => (
                        <div key={cap.id} className="tc-capsule-item">
                            <img src={cap.song.albumArt} alt="art" />
                            <div className="tc-capsule-meta">
                                <h3>{cap.song.name}</h3>
                                <p>Unlocks: {new Date(cap.unlockDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}