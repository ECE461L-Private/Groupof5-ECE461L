import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MyProfile() {
    const navigate = useNavigate()
    const [userid, setUserid] = useState('StudentUser')
    const [projects, setProjects] = useState([])

    useEffect(() => {
        // Attempt to get logged in user from localStorage if we added it in login, 
        // else fallback to mock user
        const storedUser = localStorage.getItem('username')
        if (storedUser) {
            setUserid(storedUser)
        }

        // Mock data representing the user's projects
        setProjects([
            { id: '101', name: 'Robot Arm' },
            { id: '102', name: 'IoT Sensor' }
        ])
    }, [])

    return (
        <div className="container">
            <div className="form-box" style={{ width: '400px' }}>
                <h2>My Profile</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>User ID:</label>
                    <div style={{ padding: '8px', backgroundColor: '#f9f9f9', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}>
                        {userid}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>My Projects:</label>
                    {projects.length > 0 ? (
                        <ul className="activity-list" style={{ marginTop: '10px' }}>
                            {projects.map((p, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>
                                    {p.name} <span style={{ color: '#888' }}>(ID: {p.id})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#555', marginTop: '5px' }}>You have not joined any projects yet.</p>
                    )}
                </div>

                <button onClick={() => navigate('/dashboard')} style={{ backgroundColor: '#ccc', color: '#333' }}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    )
}

export default MyProfile
