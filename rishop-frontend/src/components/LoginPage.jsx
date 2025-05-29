import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContext from '../Context/Context'; // Assuming AppContext handles auth state
import axiosInstance from '../axios'; // Assuming you have an axios instance configured

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthToken, setUser } = useContext(AppContext); // Assuming these setters exist

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axiosInstance.post('/login', { username, password });
      if(response.data === "INVALID"){
        setError('Invalid username or password. Try again');
      }
      else if (response.data) {
        // Assuming the token is directly in response.data or response.data.token
        const token = response.data.token || response.data; 
        localStorage.setItem('authToken', token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Optionally, fetch user details if your /login doesn't return them
        // For now, let's assume login itself is enough or user data is part of login response
        // If you need to fetch user details separately after login:
        // const userResponse = await axiosInstance.get('/profile'); // Or similar endpoint
        // setUser(userResponse.data);

        setAuthToken(token); // Update context
        navigate('/'); // Redirect to home page after successful login
      } 
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } 
      else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
      <div style={{ padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'white', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Username or Email:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '16px' }}>
            Login
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#555' }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} style={{ color: '#007bff', background: 'none', border: 'none', padding: '0', cursor: 'pointer', textDecoration: 'underline' }}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 