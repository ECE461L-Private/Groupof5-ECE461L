import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { API_BASE } from './apiBase'

function CreateAccount() {
    const [userid, setUserid] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')

        if (!userid || !password || !confirmPassword) {
            setError('Please fill in all fields.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        try {
            const response = await fetch(`${API_BASE}/auth/add_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userid, password: password })
            })
            const data = await response.json()
            if (data.status === 'ok') {
                login(data.access_token, userid)
                setError('Account created!')
                navigate('/dashboard')
            } else {
                setError(data.message)
            }
        } catch (err) {
            console.error('Failed to create account', err)
            setError('Unable to create account. Please try again.')
        }
    }

    return (
        <div className="container">
            <div className="form-box">
                <h2>Create Account</h2>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleCreate}>
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
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit">Create Account</button>
                </form>
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default CreateAccount
