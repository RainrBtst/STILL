import { useState } from "react";
import "./Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(""); 
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); 

        // Now expecting a "SUCCESS" status from your updated backend
        axios.post(`${API_BASE_URL}/register`, { name, email, password })
            .then(result => {
                if (result.data.status === "SUCCESS") {
                    // Skip OTP, go straight to login
                    navigate('/login');
                } 
                else if (result.data.status === "ALREADY_EXISTS") {
                    setError("Email already used."); 
                }
                else {
                    setError("Something went wrong. Please try again.");
                }
            })
            .catch(err => {
                console.log("Error Detail:", err);
                const msg = err.response?.data?.error || "Registration error.";
                setError(msg);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="login-full-page">
            <div className="login-content-wrapper">
                <h1 className="login-logo-large">STILL</h1>

                {error && (
                    <div className="still-alert-box">
                        <span className="alert-icon">⚠️</span>
                        <p>{error}</p>
                        <button className="alert-close" onClick={() => setError("")}>✕</button>
                    </div>
                )}

                <div className="login-wide-card">
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
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>

                        <div className="show-pass-container" onClick={() => setShowPassword(!showPassword)} style={{display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '8px', cursor: 'pointer'}}>
                            <input 
                                type="checkbox" 
                                checked={showPassword} 
                                readOnly 
                                style={{cursor: 'pointer'}}
                            />
                            <span style={{color: '#a7a7a7', fontSize: '0.8rem'}}>Show Password</span>
                        </div>

                        <button className="login-submit-btn" type="submit" disabled={loading}>
                            {loading ? "CREATING ACCOUNT..." : "REGISTER ➔"}
                        </button>
                        <Link to="/login" className="login-register-link">ALREADY HAVE AN ACCOUNT?</Link>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;