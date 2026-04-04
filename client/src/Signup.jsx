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
    const [loading, setLoading] = useState(false); // New Loading State
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true); // Start loading

        // CHANGED: Pointing to your Local Tunnel instead of Render
        axios.post('https://deep-queens-peel.loca.lt/register', { name, email, password })
            .then(result => {
                console.log("Server Response:", result.data);
                // Check if the backend confirms OTP was saved/sent
                if (result.data.status === "OTP_SENT") {
                    setIsVerifying(true);
                } else {
                    alert("Something went wrong. Please try again.");
                }
            })
            .catch(err => {
                console.log("Error Detail:", err);
                alert("Registration error. Check if the email is already in use.");
            })
            .finally(() => {
                setLoading(false); // Stop loading
            });
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setLoading(true);

        // CHANGED: Pointing to your Local Tunnel instead of Render
        axios.post('https://deep-queens-peel.loca.lt/verify-otp', { email, otp })
            .then(result => {
                if (result.data.status === "Success") {
                    alert("Email Verified Successfully!");
                    navigate('/login');
                }
            })
            .catch(err => {
                console.log(err);
                alert("Invalid Verification Code. Check MongoDB Compass if the email didn't arrive.");
            })
            .finally(() => {
                setLoading(false);
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
                                    onClick={() => setIsVerifying(false)}
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