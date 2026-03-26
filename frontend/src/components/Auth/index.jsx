import React, { useState } from 'react';
import './index.css';

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.message || resData.error || 'Authentication failed');
      }

      // V2 Standardized Response wraps actual payload in .data
      const payload = resData.data || resData;

      // If success, store token and notify parent
      if (payload.token) {
        localStorage.setItem('auth_token', payload.token);
        localStorage.setItem('user', JSON.stringify(payload.user));
        onLoginSuccess(payload.user);
      } else {
        // Successful registration usually requires login next, or auto-logs in
        setIsLogin(true);
        setError('Registration successful! Please sign in with your new credentials.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-brand">NexStock</h1>
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              required 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="auth-btn">
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
        
        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Auth;
