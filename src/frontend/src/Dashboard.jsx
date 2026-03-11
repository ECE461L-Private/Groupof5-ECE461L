import React from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
    const navigate = useNavigate()

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
                        <h3>2</h3>
                        <p>Hardware Sets</p>
                    </div>
                    <div className="card">
                        <h3>1</h3>
                        <p>Checked Out</p>
                    </div>
                    <div className="card">
                        <h3>3</h3>
                        <p>Projects</p>
                    </div>
                </div>

                <h3>Recent Activity</h3>
                <ul className="activity-list">
                    <li>Checked out 5 units from HWSet1</li>
                    <li>Joined project "Robot Arm"</li>
                    <li>Returned 2 units to HWSet2</li>
                    <li>Created project "IoT Sensor"</li>
                </ul>

                <div className="nav-buttons">
                    <button onClick={() => alert('Hardware Sets page coming soon!')}>
                        View Hardware
                    </button>
                    <button onClick={() => alert('New Project page coming soon!')}>
                        New Project
                    </button>
                    <button onClick={() => alert('Profile page coming soon!')}>
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
