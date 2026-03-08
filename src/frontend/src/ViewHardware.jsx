import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DEFAULT_HW = [
    { name: 'HWSet1', capacity: 100, available: 100, userCheckedOut: 0 },
    { name: 'HWSet2', capacity: 100, available: 100, userCheckedOut: 0 },
]

function loadHardware() {
    try {
        const saved = localStorage.getItem('hwState')
        return saved ? JSON.parse(saved) : DEFAULT_HW
    } catch {
        return DEFAULT_HW
    }
}

function saveHardware(hw) {
    localStorage.setItem('hwState', JSON.stringify(hw))
}

function logActivity(msg) {
    const log = JSON.parse(localStorage.getItem('activityLog') || '[]')
    log.unshift({ msg, time: new Date().toLocaleTimeString() })
    localStorage.setItem('activityLog', JSON.stringify(log.slice(0, 20)))
}

function ViewHardware() {
    const [hardware, setHardware] = useState(loadHardware)
    const [quantities, setQuantities] = useState({ HWSet1: '', HWSet2: '' })
    const [messages, setMessages] = useState({})
    const [selectedProject, setSelectedProject] = useState('')
    const [projects, setProjects] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        const p = JSON.parse(localStorage.getItem('projects') || '[]')
        setProjects(p)
        if (p.length > 0) setSelectedProject(p[0].id)
    }, [])

    const updateHardware = (newHw) => {
        setHardware(newHw)
        saveHardware(newHw)
    }

    const setMsg = (name, text) => {
        setMessages(prev => ({ ...prev, [name]: text }))
        setTimeout(() => setMessages(prev => ({ ...prev, [name]: '' })), 3000)
    }

    const handleCheckout = (name) => {
        const qty = parseInt(quantities[name])
        if (!qty || qty <= 0) { setMsg(name, 'Enter a valid quantity.'); return }
        if (!selectedProject) { setMsg(name, 'Select a project first.'); return }
        const set = hardware.find(h => h.name === name)
        if (qty > set.available) { setMsg(name, `Only ${set.available} units available.`); return }
        const updated = hardware.map(h =>
            h.name === name
                ? { ...h, available: h.available - qty, userCheckedOut: h.userCheckedOut + qty }
                : h
        )
        updateHardware(updated)
        logActivity(`Checked out ${qty} unit(s) from ${name} for project "${selectedProject}"`)
        setMsg(name, `✓ Checked out ${qty} unit(s).`)
        setQuantities(prev => ({ ...prev, [name]: '' }))
    }

    const handleCheckin = (name) => {
        const qty = parseInt(quantities[name])
        if (!qty || qty <= 0) { setMsg(name, 'Enter a valid quantity.'); return }
        const set = hardware.find(h => h.name === name)
        if (qty > set.userCheckedOut) {
            setMsg(name, `You only have ${set.userCheckedOut} unit(s) to return.`)
            return
        }
        const updated = hardware.map(h =>
            h.name === name
                ? { ...h, available: h.available + qty, userCheckedOut: h.userCheckedOut - qty }
                : h
        )
        updateHardware(updated)
        logActivity(`Returned ${qty} unit(s) to ${name}`)
        setMsg(name, `✓ Checked in ${qty} unit(s).`)
        setQuantities(prev => ({ ...prev, [name]: '' }))
    }

    const handleReset = (name) => {
        const set = hardware.find(h => h.name === name)
        if (set.userCheckedOut === 0) return
        const updated = hardware.map(h =>
            h.name === name
                ? { ...h, available: h.available + h.userCheckedOut, userCheckedOut: 0 }
                : h
        )
        updateHardware(updated)
        logActivity(`Returned all units to ${name}`)
        setMsg(name, `✓ All units returned.`)
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
                    const checkedOut = set.capacity - set.available
                    const usagePercent = Math.round(((set.capacity - set.available) / set.capacity) * 100)
                    return (
                        <div className="hw-set" key={set.name}>
                            <div className="hw-set-header">
                                <h3>{set.name}</h3>
                                {set.userCheckedOut > 0 && (
                                    <span className="hw-yours">You have {set.userCheckedOut} checked out</span>
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
                                    value={quantities[set.name]}
                                    onChange={(e) =>
                                        setQuantities(prev => ({ ...prev, [set.name]: e.target.value }))
                                    }
                                />
                                <button
                                    onClick={() => handleCheckout(set.name)}
                                    disabled={set.available === 0}
                                >
                                    Check Out
                                </button>
                                <button
                                    onClick={() => handleCheckin(set.name)}
                                    disabled={set.userCheckedOut === 0}
                                >
                                    Check In
                                </button>
                                {set.userCheckedOut > 0 && (
                                    <button className="hw-return-all" onClick={() => handleReset(set.name)}>
                                        Return All
                                    </button>
                                )}
                            </div>
                            {messages[set.name] && (
                                <p className={messages[set.name].startsWith('✓') ? 'hw-msg hw-msg-ok' : 'hw-msg hw-msg-err'}>
                                    {messages[set.name]}
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
