import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({ hwSets: 2, checkedOut: 0, projects: 0 })
    const [activityLog, setActivityLog] = useState([])

    useEffect(() => {
        // Read real data from localStorage
        const hw = JSON.parse(localStorage.getItem('hwState') || '[]')
        const totalCheckedOut = hw.reduce((sum, h) => sum + (h.userCheckedOut || 0), 0)

        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const joinedProjects = projects.filter(p => p.joined).length

        const log = JSON.parse(localStorage.getItem('activityLog') || '[]')

        setStats({
            hwSets: hw.length > 0 ? hw.length : 2,
            checkedOut: totalCheckedOut,
            projects: joinedProjects,
        })
        setActivityLog(log)
    }, [])

    const handleLogout = () => {
        // TODO: clear session/token
        navigate('/login')
    }

    return (
        <div className="container">
            <div className="dashboard-box">
                <h2>Welcome back, User!</h2>

                <div className="summary-cards">
                    <div className="card">
                        <h3>{stats.hwSets}</h3>
                        <p>Hardware Sets</p>
                    </div>
                    <div className="card">
                        <h3>{stats.checkedOut}</h3>
                        <p>Units Checked Out</p>
                    </div>
                    <div className="card">
                        <h3>{stats.projects}</h3>
                        <p>Projects Joined</p>
                    </div>
                </div>

                <h3>Recent Activity</h3>
                {activityLog.length === 0 ? (
                    <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
                        No activity yet. Check out some hardware or create a project!
                    </p>
                ) : (
                    <ul className="activity-list">
                        {activityLog.slice(0, 5).map((entry, i) => (
                            <li key={i}>
                                <span>{entry.msg}</span>
                                <span className="activity-time">{entry.time}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="nav-buttons">
                    <button onClick={() => navigate('/hardware')}>
                        View Hardware
                    </button>
                    <button onClick={() => navigate('/new-project')}>
                        New Project
                    </button>
                    <button onClick={() => navigate('/profile')}>
                        My Profile
                    </button>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    )
}

export default Dashboard
