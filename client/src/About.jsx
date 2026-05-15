import React, { useState, useEffect, useRef } from 'react';
import './About.css'; 

function About() {
    // --- NAVBAR STATE & LOGIC ---
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

    // --- ADDED: DEVELOPER SECTION STATE ---
    const [showDevInfo, setShowDevInfo] = useState(false);

    const handleLogout = () => {
        // IDENTIFY THE CURRENT WEEK KEY FOR REWIND PERSISTENCE
        const now = new Date();
        const weekKey = `seenRewind_${now.getFullYear()}_${Math.ceil(now.getDate() / 7)}`;
        const seenFlag = localStorage.getItem(weekKey);

        localStorage.clear();

        // RE-SET THE SEEN FLAG IF IT EXISTED SO REWIND DOESN'T RE-TRIGGER ON RE-LOGIN
        if (seenFlag) {
            localStorage.setItem(weekKey, seenFlag);
        }
        window.location.href = '/login';
    };

    const handleHome = () => {
        window.location.href = '/home';
    };

    const handleProfile = () => {
        window.location.href = '/profile';
    };

    const handleAbout = () => {
        window.location.href = '/about';
    };

    const handleRewindNav = () => {
        window.location.href = '/rewind';
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="nt-container">
            {/* --- MATCHING NAVBAR START --- */}
            <nav className="nt-navbar">
                <h1 className="nt-logo" style={{cursor: 'pointer'}} onClick={handleHome}>STILL</h1>
                
                <div className="nt-nav-links-wrapper">
                    <div className="nt-nav-note" style={{cursor: 'pointer'}} onClick={handleRewindNav} >
                        <span>Rhythm Rewind</span>
                    </div>
                    <div className="nt-nav-note" style={{cursor: 'pointer', pointerEvents: 'auto'}} onClick={() => window.location.href = '/send-song'} >
                        <span>Send a Song</span>
                    </div>
                </div>

                <div className="nt-nav-actions">
                    <div className="nt-profile-container" ref={dropdownRef} style={{position: 'relative'}}>
                        <div className="nt-profile-circle" style={{cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            {profilePic ? (
                                <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                "👤"
                            )}
                        </div>
                        {showProfileDropdown && (
                            <div className="nt-profile-dropdown" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 1000, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}>
                                <button className="nt-logout-btn-dropdown" onClick={handleHome} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>HOME</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleProfile} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>PROFILE</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleAbout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>ABOUT</button>
                                <button className="nt-logout-btn-dropdown" onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: '5px'}}>LOGOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            {/* --- MATCHING NAVBAR END --- */}

            <main className="nt-main">
                <div className="about-section-container">
                    <h2 className="about-title">ABOUT STILL</h2>
                    <div className="about-underline"></div>
                    
                    <div className="about-text-content">
                        <p>
                            Music has the power to capture what words alone cannot. 
                            <strong> STILL</strong> is an immersive music-journaling platform where your 
                            personal stories meet their perfect soundtrack. Whether you are navigating 
                            a quiet moment of peace or a loud burst of joy, STILL allows you to anchor 
                            your journal entries to the music that matches your soul.
                        </p>

                        <p>
                            We believe that <strong>"Everyday has a rhythm,"</strong> and our mission 
                            is to help you preserve the melody of your life in a safe, private environment. 
                            Here, your moods are translated into playlists, and your memories are kept 
                            <strong> STILL</strong>—forever synchronized with the songs that moved you.
                        </p>
                    </div>

                    <h2 className="about-title" style={{ marginTop: '60px', fontSize: '1.5rem' }}>FEATURES</h2>
                    <div className="about-underline" style={{ marginBottom: '30px' }}></div>

                    <div className="about-features-grid">
                        {/* Music Journal Card */}
                        <div className="feature-card">
                            <h3>🎵 Music Journal</h3>
                            <p>
                                At the heart of <strong>STILL</strong> lies the Music Journal—a digital canvas where 
                                your reflections find their melody. More than just a diary, it allows you to write 
                                your deepest thoughts and pair them with the exact song that defines your mood in that moment. 
                                By synchronizing your narrative with a specific track, you create a living record of your 
                                life’s rhythm, turning simple words into a sensory experience that resonates every time you look back.
                            </p>
                        </div>

                        {/* Send a Song Card */}
                        <div className="feature-card">
                            <h3>✉️ Send a Song</h3>
                            <p>
                                Sometimes, the best way to say something is through a song. <strong>STILL</strong> offers 
                                a unique way to connect, allowing you to share a message and a melody anonymously with someone special. 
                                Whether it’s a hidden sentiment or a shared memory, this feature lets you bridge the gap between 
                                words and sound, delivering your heartfelt intentions through the timeless language of music.
                            </p>
                        </div>
                    </div>

                    {/* --- PRIVACY SECTION START --- */}
                    <h2 className="about-title" style={{ marginTop: '60px', fontSize: '1.5rem' }}>PRIVACY</h2>
                    <div className="about-underline" style={{ marginBottom: '30px' }}></div>

                    <div className="about-features-grid">
                        <div className="feature-card" style={{ flex: 'none', width: '100%' }}>
                            <h3>🔒 Your Secure Sanctuary</h3>
                            <p>
                                Your journals, messages, and your tracks are yours alone. We provide a 
                                <strong> secure sanctuary</strong> for your reflections, ensuring that the 
                                rhythm of your life stays private. We believe that true expression 
                                requires a safe space, and we are committed to protecting the intimacy 
                                of your musical journey.
                            </p>
                        </div>
                    </div>
                    {/* --- PRIVACY SECTION END --- */}

                    {/* --- ADDED: DEVELOPER DROPDOWN TRIGGER --- */}
                    <div className="dev-dropdown-trigger" onClick={() => setShowDevInfo(!showDevInfo)}>
                        <span className="dev-more-text">MORE</span>
                        <span className={`arrow-icon ${showDevInfo ? 'open' : ''}`}>▼</span>
                    </div>

                    {/* --- ADDED: DEVELOPER DROPDOWN CONTENT --- */}
                    {showDevInfo && (
                        <div className="dev-section-container">
                            <div className="dev-layout">
                                <div className="dev-photo-col">
                                    <div className="dev-large-circle">
                                        <img src="/rain.png" alt="Rainier Bautista" />
                                    </div>
                                </div>

                                <div className="dev-content-col">
                                    <div className="speech-bubble">
                                        <p>
                                            <strong>STILL</strong> was designed and developed by me (Rainier Bautista). 
                                            This project started with a simple idea: that music is the best way to say what words can't. 
                                            Every line of code was written to ensure that the moment you share a song, 
                                            the technology gets out of the way of the message.
                                        </p>
                                        <p>
                                            This platform is a tribute to those backseat secrets we keep—the ones that are too heavy for words but fit perfectly within a melody. 
                                            I built this for the times when you feel super far from where you want to be, using music as the bridge to close that distance. 
                                            Whether it’s an connection to the prettiest thing you’ve ever seen or a way to navigate through the tears, it is for those who truly mean it.
                                        </p>
                                        <p>
                                            I created this because I like me better when I’m connected to the people and the sounds that move me. In a world that never stops, I wanted to build something that stays <strong>STILL</strong>.
                                        </p>
                                        <div className="bubble-pointer"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default About;