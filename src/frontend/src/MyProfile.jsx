import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { API_BASE } from './apiBase'

function MyProfile() {
    const navigate = useNavigate()
    const { token, logout } = useAuth()
    const [user, setUser] = useState({ username: '' })
    const [projects, setProjects] = useState([])
    const [usage, setUsage] = useState([])

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const json = await res.json()
                if (json.status === 'ok') {
                    setUser({ username: json.data.username })
                    setProjects(json.data.projects)
                    setUsage(json.data.usage)
                }
            } catch(e) { console.error("Failed to load profile", e) }
        }
        fetchProfile()
    }, [token])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="container">
            <div className="form-box" style={{ width: '400px', textAlign: 'left' }}>
                <h2 style={{ textAlign: 'center' }}>My Profile</h2>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>User Info</h3>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0' }}>
                        <li style={{ marginBottom: '5px' }}><strong>Username:</strong> {user.username || 'Loading...'}</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>My Projects</h3>
                    {projects.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0' }}>
                            {projects.map((p, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>
                                    - {p.name} <span style={{ color: '#888' }}>[{p.id}]</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#555' }}>You have not joined any projects yet.</p>
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>My Usage</h3>
                    {usage.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0' }}>
                            {usage.map((u, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>
                                    - {u.project_name} &rarr; Checked out {u.units} total unit{u.units > 1 ? 's' : ''}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#555' }}>No hardware usage.</p>
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Account Settings</h3>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <button
                                onClick={() => alert('Change password functionality coming soon!')}
                                style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px' }}
                            >
                                Change Password
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                style={{ background: 'none', border: 'none', color: 'red', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px' }}
                            >
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>

                <button onClick={() => navigate('/dashboard')} style={{ backgroundColor: '#ccc', color: '#333', marginTop: '10px' }}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    )
}

export default MyProfile
