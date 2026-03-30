import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

const logActivity = async (msg, token) => {
    try {
        await fetch(`${import.meta.env.VITE_API_URL}/logs/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ message: msg })
        })
    } catch(e) { console.error('Failed to log activity', e) }
}



function ViewHardware() {
    const [hardware, setHardware] = useState([])
    const [quantities, setQuantities] = useState({})
    const [messages, setMessages] = useState({})
    const [selectedProject, setSelectedProject] = useState('')
    const [projects, setProjects] = useState([])
    const navigate = useNavigate()
    const { token } = useAuth()

    const fetchData = async () => {
        if (!token) return;
        try {
            const pRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/get_projects`, { headers: { 'Authorization': `Bearer ${token}` } })
            const pData = await pRes.json()
            let firstProjId = selectedProject;
            if (pData.status === 'ok') {
                const mappedP = pData.projects.map(p => ({ id: p.project_id, name: p.name }))
                setProjects(mappedP)
                if (mappedP.length > 0 && !selectedProject) {
                    firstProjId = mappedP[0].id;
                    setSelectedProject(firstProjId)
                }
            }

            const hRes = await fetch(`${import.meta.env.VITE_API_URL}/hardware/list`, { headers: { 'Authorization': `Bearer ${token}` } })
            const hData = await hRes.json()
            if (hData.status === 'ok') {
                setHardware(hData.hardware)
            }
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        fetchData()
    }, [token])

    const setMsg = (id, text) => {
        setMessages(prev => ({ ...prev, [id]: text }))
        setTimeout(() => setMessages(prev => ({ ...prev, [id]: '' })), 3000)
    }

    const handleCheckout = async (hw_id, name) => {
        const qty = parseInt(quantities[hw_id])
        if (!qty || qty <= 0) { setMsg(hw_id, 'Enter a valid quantity.'); return }
        if (!selectedProject) { setMsg(hw_id, 'Select a project first.'); return }
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/transactions/check_out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ project_id: selectedProject, hw_id: hw_id, quantity: qty })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Checked out ${qty} unit(s) from ${name} for project "${selectedProject}"`, token)
                setMsg(hw_id, `✓ Checked out ${qty} unit(s).`)
                setQuantities(prev => ({ ...prev, [hw_id]: '' }))
                fetchData()
            } else { setMsg(hw_id, data.message) }
        } catch(e) { setMsg(hw_id, 'Failed to checkout') }
    }

    const handleCheckin = async (hw_id, name) => {
        const qty = parseInt(quantities[hw_id])
        if (!qty || qty <= 0) { setMsg(hw_id, 'Enter a valid quantity.'); return }
        if (!selectedProject) { setMsg(hw_id, 'Select a project first.'); return }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/transactions/check_in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ project_id: selectedProject, hw_id: hw_id, quantity: qty })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Returned ${qty} unit(s) to ${name}`, token)
                setMsg(hw_id, `✓ Checked in ${qty} unit(s).`)
                setQuantities(prev => ({ ...prev, [hw_id]: '' }))
                fetchData()
            } else { setMsg(hw_id, data.message) }
        } catch(e) { setMsg(hw_id, 'Failed to check in') }
    }

    const handleReset = async (hw_id, name, checkedOutAmount) => {
        if (!checkedOutAmount || !selectedProject) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/transactions/check_in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ project_id: selectedProject, hw_id: hw_id, quantity: checkedOutAmount })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Returned all units to ${name}`, token)
                setMsg(hw_id, `✓ All units returned.`)
                fetchData()
            } else { setMsg(hw_id, data.message) }
        } catch(e) { setMsg(hw_id, 'Failed to return all') }
    }

    return (
        <div className="container">
            <div className="hardware-box">
                <h2>View Hardware Sets</h2>

                <div className="hw-project-select">
                    <label>Project:</label>
                    {projects.length === 0 ? (
                        <span className="hw-no-project">
                            No projects yet. <span className="link-btn" onClick={() => navigate('/new-project')}>Create one</span>
                        </span>
                    ) : (
                        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                            ))}
                        </select>
                    )}
                </div>

                {hardware.map(set => {
                    const totalAllocatedAmount = Object.values(set.allocations || {}).reduce((a, b) => a + b, 0)
                    const checkedOut = totalAllocatedAmount
                    const usagePercent = Math.round((checkedOut / set.capacity) * 100)
                    const userCheckedOut = (set.allocations && selectedProject && set.allocations[selectedProject]) ? set.allocations[selectedProject] : 0

                    return (
                        <div className="hw-set" key={set.hw_id}>
                            <div className="hw-set-header">
                                <h3>{set.name}</h3>
                                {userCheckedOut > 0 && (
                                    <span className="hw-yours">This project has {userCheckedOut} checked out</span>
                                )}
                            </div>

                            <table className="hw-table">
                                <thead>
                                    <tr>
                                        <th>Capacity</th>
                                        <th>Available</th>
                                        <th>Total Checked Out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{set.capacity}</td>
                                        <td style={{ color: set.available < 20 ? '#e25c5c' : 'inherit' }}>
                                            {set.available}
                                        </td>
                                        <td>{checkedOut}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="hw-progress-bar">
                                <div
                                    className="hw-progress-fill"
                                    style={{ width: `${usagePercent}%`, backgroundColor: usagePercent > 80 ? '#e25c5c' : '#4a90e2' }}
                                />
                            </div>
                            <p className="hw-progress-label">{usagePercent}% in use</p>

                            <div className="hw-controls">
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    min="1"
                                    value={quantities[set.hw_id] || ''}
                                    onChange={(e) =>
                                        setQuantities(prev => ({ ...prev, [set.hw_id]: e.target.value }))
                                    }
                                />
                                <button
                                    onClick={() => handleCheckout(set.hw_id, set.name)}
                                    disabled={set.available === 0 || !selectedProject}
                                >
                                    Check Out
                                </button>
                                <button
                                    onClick={() => handleCheckin(set.hw_id, set.name)}
                                    disabled={userCheckedOut === 0 || !selectedProject}
                                >
                                    Check In
                                </button>
                                {userCheckedOut > 0 && (
                                    <button className="hw-return-all" onClick={() => handleReset(set.hw_id, set.name, userCheckedOut)}>
                                        Return All
                                    </button>
                                )}
                            </div>
                            {messages[set.hw_id] && (
                                <p className={messages[set.hw_id].startsWith('✓') ? 'hw-msg hw-msg-ok' : 'hw-msg hw-msg-err'}>
                                    {messages[set.hw_id]}
                                </p>
                            )}
                        </div>
                    )
                })}

                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    )
}

export default ViewHardware
