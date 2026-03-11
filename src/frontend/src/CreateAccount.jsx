import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function CreateAccount() {
    const [userid, setUserid] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

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

        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/add_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userid, password: password })
        })
        const data = await response.json()
        if (data.status === 'ok') {
            setError('Account created!')
            navigate('/login')
        } else {
            setError(data.message)
        }
        //console.log('Creating account for', userid)
        // alert('Account created! (placeholder)')
        // navigate('/login')
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
