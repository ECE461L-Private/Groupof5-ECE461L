import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Login() {
    const [userid, setUserid] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = (e) => {
        e.preventDefault()
        setError('')

        if (!userid || !password) {
            setError('Please fill in all fields.')
            return
        }

        // TODO: call backend API to authenticate
        console.log('Logging in with', userid, password)
        alert('Login successful! (placeholder)')
    }

    return (
        <div className="container">
            <div className="form-box">
                <h2>HaaS Login</h2>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="User ID"
                        value={userid}
                        onChange={(e) => setUserid(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>
                <p>
                    New User? <Link to="/create-account">Create Account</Link>
                </p>
            </div>
        </div>
    )
}

export default Login
