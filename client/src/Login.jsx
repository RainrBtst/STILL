import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios'
import { useNavigate } from "react-router-dom";
import './Login.css';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('https://still-csmi.onrender.com/login', { email, password })
            .then(result => {
                if (result.data.status === "Success") {
                    localStorage.setItem("currentUserId", result.data.userId);
                    localStorage.setItem("currentUsername", result.data.username);
                    navigate('/home');
                } else {
                    alert(result.data);
                }
            })
            .catch(err => console.log(err));
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
                        
                        <button className="nt-btn-primary login-submit-btn" type="submit">
                            LOG IN ➔
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