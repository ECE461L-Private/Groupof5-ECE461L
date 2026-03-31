import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Dashboard() {
    const navigate = useNavigate()
    const { token, username, logout } = useAuth()
    const [stats, setStats] = useState({ hwSets: 2, checkedOut: 0, projects: 0 })
    const [activityLog, setActivityLog] = useState([])

    useEffect(() => {
        if (!token) return;

        const fetchDashboardData = async () => {
            try {
                const projRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/get_projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const projData = await projRes.json()
                const joinedProjects = projData.status === 'ok' ? projData.projects.length : 0

                const hwRes = await fetch(`${import.meta.env.VITE_API_URL}/hardware/list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const hwData = await hwRes.json()
                let hwSets = 2;
                let checkedOut = 0;
                
                if (hwData.status === 'ok') {
                    hwSets = hwData.hardware.length;
                    const userProjectIds = projData.projects ? projData.projects.map(p => p.project_id) : [];
                    hwData.hardware.forEach(hw => {
                        userProjectIds.forEach(pid => {
                            if (hw.allocations && hw.allocations[pid]) {
                                checkedOut += hw.allocations[pid];
                            }
                        })
                    })
                }

                setStats({ hwSets, checkedOut, projects: joinedProjects })

                const logRes = await fetch(`${import.meta.env.VITE_API_URL}/logs/list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const logData = await logRes.json()
                if (logData.status === 'ok') {
                    setActivityLog(logData.logs || [])
                }

            } catch (err) {
                console.error("Failed to fetch dashboard stats", err)
            }
        }

        fetchDashboardData()
    }, [token])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="container">
            <div className="dashboard-box">
                <h2>Welcome back, {username}!</h2>

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
