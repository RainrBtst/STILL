import { useState } from "react";
import "./Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:3001/register', { name, email, password })
            .then(result => {
                console.log(result);
                navigate('/login');
            })
            .catch(err => console.log(err));
    };

    return (
        <div className="login-full-page">
            <div className="login-content-wrapper">
                <h1 className="login-logo-large">STILL</h1>

                <div className="login-wide-card">
                    <h2 className="login-header">CREATE ACCOUNT</h2>
                    <p className="login-sub">Join the rhythm. Start your journey today.</p>
                    
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="login-input-group">
                            <input 
                                type="text" 
                                placeholder="Username" 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="login-input-group">
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="login-input-group">
                            <input 
                                type="password" 
                                placeholder="Password" 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        
                        <button className="login-submit-btn" type="submit">
                            REGISTER ➔
                        </button>

                        <Link to="/login" className="login-register-link">
                            ALREADY HAVE AN ACCOUNT?
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;