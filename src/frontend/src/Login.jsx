import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { API_BASE } from './apiBase'

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

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userid, password: password })
            })
            const data = await response.json()
            if (data.status === 'ok') {
                login(data.access_token, userid)
                setError('Login successful!')
                navigate('/dashboard')
            }
            else {
                setError(data.message)
            }
        } catch (err) {
            console.error('Failed to log in', err)
            setError('Unable to log in. Please try again.')
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
