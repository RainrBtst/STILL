import { useState } from "react";
import "./Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const API_BASE_URL = "https://unwinning-unscourging-johnie.ngrok-free.dev";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState(""); 
    const [isVerifying, setIsVerifying] = useState(false); 
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(""); // ADDED: Error state
    const navigate = useNavigate();
    // ADDED STATE FOR SHOW PASSWORD TOGGLE
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); // Clear previous errors

        axios.post(`${API_BASE_URL}/register`, { name, email, password })
            .then(result => {
                if (result.data.status === "OTP_SENT") {
                    setIsVerifying(true);
                } 
                else if (result.data.status === "ALREADY_EXISTS") {
                    setError("Email already used."); // Updated to custom error
                }
                else {
                    setError("Something went wrong. Please try again.");
                }
            })
            .catch(err => {
                console.log("Error Detail:", err);
                setError("Registration error.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); // Clear previous errors

        axios.post(`${API_BASE_URL}/verify-otp`, { email, otp })
            .then(result => {
                if (result.data.status === "Success") {
                    navigate('/login');
                }
            })
            .catch(err => {
                setError("Invalid Verification Code."); // Updated to custom error
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="login-full-page">
            <div className="login-content-wrapper">
                <h1 className="login-logo-large">STILL</h1>

                {/* ADDED: CUSTOM ALERT UI BOX */}
                {error && (
                    <div className="still-alert-box">
                        <span className="alert-icon">⚠️</span>
                        <p>{error}</p>
                        <button className="alert-close" onClick={() => setError("")}>✕</button>
                    </div>
                )}

                <div className="login-wide-card">
                    {!isVerifying ? (
                        <>
                            <h2 className="login-header">CREATE ACCOUNT</h2>
                            <p className="login-sub">Join the rhythm. Start your journey today.</p>
                            <form className="form" onSubmit={handleSubmit}>
                                <div className="login-input-group">
                                    <input type="text" placeholder="Username" onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="login-input-group">
                                    <input type="email" placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="login-input-group">
                                    <input 
                                        // TYPE CHANGES DYNAMICALLY
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password" 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                    />
                                </div>

                                {/* ADDED SHOW PASSWORD TOGGLE BOX WITH LEFT MARGIN */}
                                <div style={{display: 'flex', alignItems: 'center', marginTop: '-10px', marginBottom: '20px', marginLeft: '5px', gap: '8px', cursor: 'pointer'}} onClick={() => setShowPassword(!showPassword)}>
                                    <input 
                                        type="checkbox" 
                                        checked={showPassword} 
                                        onChange={() => {}} // Controlled by div click
                                        style={{cursor: 'pointer'}}
                                    />
                                    <span style={{color: '#a7a7a7', fontSize: '0.8rem'}}>Show Password</span>
                                </div>

                                <button className="login-submit-btn" type="submit" disabled={loading}>
                                    {loading ? "SENDING CODE..." : "REGISTER ➔"}
                                </button>
                                <Link to="/login" className="login-register-link">ALREADY HAVE AN ACCOUNT?</Link>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="login-header">VERIFY EMAIL</h2>
                            <p className="login-sub">Check your Gmail for the 6-digit code.</p>
                            <form className="form" onSubmit={handleVerifyOtp}>
                                <div className="login-input-group">
                                    <input 
                                        type="text" 
                                        placeholder="Enter code" 
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)} 
                                        required 
                                        style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem' }}
                                    />
                                </div>
                                <button className="login-submit-btn" type="submit" disabled={loading}>
                                    {loading ? "VERIFYING..." : "VERIFY & LOGIN ➔"}
                                </button>
                                <button 
                                    type="button" 
                                    className="login-register-link" 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '10px' }} 
                                    onClick={() => { setIsVerifying(false); setOtp(""); setError(""); }}
                                >
                                    BACK TO SIGNUP
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Signup;