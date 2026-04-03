import { useState } from "react";
import "./Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState(""); 
    const [isVerifying, setIsVerifying] = useState(false); 
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('https://still-csmi.onrender.com/register', { name, email, password })
            .then(result => {
                console.log(result);
                setIsVerifying(true);
            })
            .catch(err => {
                console.log(err);
                // Check for the specific "already verified" error from backend
                if (err.response && err.response.data && err.response.data.error === "Your email is already verified") {
                    alert("Your email is already verified");
                } else {
                    alert("Registration failed. Please try again.");
                }
            });
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        axios.post('https://still-csmi.onrender.com/verify-otp', { email, otp })
            .then(result => {
                alert("Email Verified Successfully!");
                navigate('/login');
            })
            .catch(err => {
                alert("Invalid Verification Code. Please try again.");
            });
    };

    return (
        <div className="login-full-page">
            <div className="login-content-wrapper">
                <h1 className="login-logo-large">STILL</h1>
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
                                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <button className="login-submit-btn" type="submit">REGISTER ➔</button>
                                <Link to="/login" className="login-register-link">ALREADY HAVE AN ACCOUNT?</Link>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="login-header">VERIFY EMAIL</h2>
                            <p className="login-sub">We sent a 6-digit code to {email}</p>
                            <form className="form" onSubmit={handleVerifyOtp}>
                                <div className="login-input-group">
                                    <input 
                                        type="text" 
                                        placeholder="Enter 6-digit code" 
                                        maxLength="6"
                                        onChange={(e) => setOtp(e.target.value)} 
                                        required 
                                        style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem' }}
                                    />
                                </div>
                                <button className="login-submit-btn" type="submit">VERIFY & LOGIN ➔</button>
                                <button type="button" className="login-register-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsVerifying(false)}>
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