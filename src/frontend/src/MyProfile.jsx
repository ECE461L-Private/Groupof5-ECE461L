import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MyProfile() {
    const navigate = useNavigate()
    const [user, setUser] = useState({
        username: 'StudentUser',
        email: 'student@example.com',
        role: 'Student',
        memberSince: '2023-08-15'
    })
    const [projects, setProjects] = useState([])
    const [usage, setUsage] = useState([])

    useEffect(() => {
        // Attempt to get logged in user from localStorage
        const storedUser = localStorage.getItem('username')
        if (storedUser) {
            setUser(prev => ({ ...prev, username: storedUser }))
        }

        // Mock data representing the user's projects
        setProjects([
            { id: '101', name: 'Robot Arm', status: 'Open' },
            { id: '102', name: 'IoT Sensor', status: 'Open' }
        ])

        // Mock data representing the user's hardware usage
        setUsage([
            { hwSet: 'HWSet1', units: 2 },
            { hwSet: 'HWSet2', units: 1 }
        ])
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('username')
        navigate('/')
    }

    return (
        <div className="container">
            <div className="form-box" style={{ width: '400px', textAlign: 'left' }}>
                <h2 style={{ textAlign: 'center' }}>My Profile</h2>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>User Info</h3>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0' }}>
                        <li style={{ marginBottom: '5px' }}><strong>Username:</strong> {user.username}</li>
                        <li style={{ marginBottom: '5px' }}><strong>Email:</strong> {user.email}</li>
                        <li style={{ marginBottom: '5px' }}><strong>Role:</strong> {user.role}</li>
                        <li style={{ marginBottom: '5px' }}><strong>Member since:</strong> {user.memberSince}</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>My Projects</h3>
                    {projects.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0' }}>
                            {projects.map((p, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>
                                    - {p.name} <span style={{ color: '#888' }}>[{p.status}]</span>
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
                                    - {u.hwSet} &rarr; {u.units} unit{u.units > 1 ? 's' : ''}
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
