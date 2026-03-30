import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Login() {
    const [userid, setUserid] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')

        if (!userid || !password) {
            setError('Please fill in all fields.')
            return
        }

        // Call your Flask backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userid, password: password })
        })
        const data = await response.json()
        if (data.status === 'ok') {
            login(data.access_token, userid)
            setError('Login successful!')      // redirect on success
            navigate('/dashboard')
        }
        else {
            setError(data.message)      // show backend error message
        }
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
