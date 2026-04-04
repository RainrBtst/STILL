import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios'
import { useNavigate } from "react-router-dom";
import './Login.css';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false); // Added loading state for better UX
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // UPDATED: Using your active Ngrok URL instead of the Render URL
        axios.post('https://unwinning-unscourging-johnie.ngrok-free.dev/login', { email, password })
            .then(result => {
                if (result.data.status === "Success") {
                    localStorage.setItem("currentUserId", result.data.userId);
                    localStorage.setItem("currentUsername", result.data.username);
                    alert("Login Successful!");
                    navigate('/home');
                } else {
                    // Handles cases where the server sends a 200 but status isn't "Success"
                    alert(result.data.message || "Invalid credentials.");
                }
            })
            .catch(err => {
                console.log("Login Error:", err);
                
                // FIXED: This handles the 401 error you saw in the console
                if (err.response && err.response.status === 401) {
                    alert("Invalid Credentials: The email or password you entered is incorrect.");
                } else {
                    alert("Server Error: Please make sure your local server and Ngrok are running.");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <div className="nt-container login-full-page">
            <div className="login-content-wrapper">
                <h1 className="nt-logo login-logo-large">STILL</h1>
                
                <div className="nt-card login-wide-card">
                    <h2 className="nt-welcome login-header">WELCOME BACK</h2>
                    <p className="nt-subtitle login-sub">Sign in to continue your rhythm.</p>

                    <form className="form" onSubmit={handleSubmit}>
                        <div className="nt-search-bar login-input-group">
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                required 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                        <div className="nt-search-bar login-input-group">
                            <input 
                                type="password" 
                                placeholder="Password" 
                                required 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                        </div>
                        
                        <button className="nt-btn-primary login-submit-btn" type="submit" disabled={loading}>
                            {loading ? "VERIFYING..." : "LOG IN ➔"}
                        </button>

                        <Link to="/register" className="nt-link login-register-link">
                            I HAVE NO ACCOUNT
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;