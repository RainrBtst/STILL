import React, { useState } from 'react';
import './Rewind.css';

const Rewind = () => {
  // Mock data showing multiple entries for specific days
  const weeklyData = [
    { date: 'MAY 9 (SUN)', entries: [{ title: 'somacea', mood: 'HAPPY' }, { title: 'ang tram', mood: 'CALM' }] },
    { date: 'MAY 10 (MON)', entries: [{ title: 'ang tram', mood: 'HAPPY' }, { title: 'ang tra...', mood: 'HAPPY' }] },
    { date: 'MAY 11 (TUE)', entries: [{ title: 'shining', mood: 'CALM' }, { title: 'shining', mood: 'CALM' }, { title: 'shining', mood: 'HAPPY' }] },
    { date: 'MAY 12 (WED)', entries: [{ title: 'manoyla', mood: 'HAPPY' }, { title: 'shining', mood: 'CALM' }, { title: 'man...', mood: 'ENERGETIC' }, { title: 'lost...', mood: 'MELANCHOLIC' }, { title: 'chill', mood: 'CHILL' }] },
    { date: 'MAY 13 (THUR)', entries: [{ title: 'lost', mood: 'MELANCHOLIC' }, { title: 'ma...', mood: 'MELANCHOLIC' }, { title: 'los!', mood: 'MELANCHOLIC' }, { title: 'los:', mood: 'MELANCHOLIC' }, { title: 'manoyla', mood: 'CALM' }], active: true },
    { date: 'MAY 14 (FRI)', entries: [{ title: 'ang tram', mood: 'HAPPY' }, { title: 'ang tram', mood: 'HAPPY' }] },
    { date: 'MAY 15 (SAT)', entries: [{ title: 'somacea', mood: 'HAPPY' }, { title: 'ang tra...', mood: 'CALM' }, { title: 'somacea', mood: 'CALM' }] },
  ];

  const [hoveredDay, setHoveredDay] = useState('MAY 13 (THUR)');

  return (
    <div className="rewind-page">
      <header className="rewind-header">
        <h1>WEEKLY RHYTHM REWIND</h1>
        <p>Your musical journey is complex; view all your daily expressions.</p>
      </header>

      <div className="week-grid">
        {weeklyData.map((day, index) => (
          <div 
            key={index} 
            className={`day-column ${hoveredDay === day.date ? 'active' : ''}`}
            onMouseEnter={() => setHoveredDay(day.date)}
          >
            <span className="day-label">{day.date}</span>
            <div className="song-stack">
              {day.entries.map((song, sIndex) => (
                <div key={sIndex} className={`song-card ${song.mood.toLowerCase()}`}>
                  <div className="album-thumb"></div>
                  <div className="song-meta">
                    <p className="song-title">{song.title}</p>
                    <span className="mood-tag">{song.mood}</span>
                  </div>
                </div>
              ))}
            </div>
            {hoveredDay === day.date && day.entries.length > 3 && (
              <div className="scroll-indicator">*Scrolling through tracks...</div>
            )}
          </div>
        ))}
      </div>

      <div className="mood-map">
         <span className="dot energetic"></span> Energetic
         <span className="dot happy"></span> Happy
         <span className="dot melancholic"></span> Melancholic
         <span className="dot calm"></span> Calm
      </div>
    </div>
  );
};

export default Rewind;