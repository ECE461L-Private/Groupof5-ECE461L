import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function logActivity(msg) {
    const log = JSON.parse(localStorage.getItem('activityLog') || '[]')
    log.unshift({ msg, time: new Date().toLocaleTimeString() })
    localStorage.setItem('activityLog', JSON.stringify(log.slice(0, 20)))
}

function NewProject() {
    const [projectName, setProjectName] = useState('')
    const [projectId, setProjectId] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [projects, setProjects] = useState([])
    const [joinId, setJoinId] = useState('')
    const [joinError, setJoinError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('projects') || '[]')
        setProjects(saved)
    }, [])

    const saveProjects = (list) => {
        localStorage.setItem('projects', JSON.stringify(list))
        setProjects(list)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!projectName.trim() || !projectId.trim()) {
            setError('Project Name and Project ID are required.')
            return
        }

        if (projects.find(p => p.id === projectId.trim())) {
            setError('A project with that ID already exists.')
            return
        }

        const newProject = {
            id: projectId.trim(),
            name: projectName.trim(),
            description: description.trim(),
            createdAt: new Date().toLocaleDateString(),
            joined: true,
        }
        const updated = [...projects, newProject]
        saveProjects(updated)
        logActivity(`Created project "${projectName.trim()}"`)
        setSuccess(`Project "${projectName}" created!`)
        setProjectName('')
        setProjectId('')
        setDescription('')
    }

    const handleJoin = () => {
        setJoinError('')
        const target = projects.find(p => p.id === joinId.trim())
        if (!target) {
            setJoinError('No project found with that ID.')
            return
        }
        if (target.joined) {
            setJoinError('You already joined this project.')
            return
        }
        const updated = projects.map(p => p.id === joinId.trim() ? { ...p, joined: true } : p)
        saveProjects(updated)
        logActivity(`Joined project "${target.name}"`)
        setJoinId('')
        setJoinError('')
    }

    const handleLeave = (id) => {
        const target = projects.find(p => p.id === id)
        const updated = projects.map(p => p.id === id ? { ...p, joined: false } : p)
        saveProjects(updated)
        logActivity(`Left project "${target.name}"`)
    }

    const handleDelete = (id) => {
        const target = projects.find(p => p.id === id)
        if (!window.confirm(`Delete project "${target.name}"?`)) return
        const updated = projects.filter(p => p.id !== id)
        saveProjects(updated)
        logActivity(`Deleted project "${target.name}"`)
    }

    return (
        <div className="container" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
            <div className="project-page">

                <div className="form-box" style={{ width: '100%', boxSizing: 'border-box' }}>
                    <h2>New Project</h2>
                    {error && <p className="error">{error}</p>}
                    {success && <p className="hw-msg hw-msg-ok">{success}</p>}
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Project ID (unique)"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                        <button type="submit">Create Project</button>
                    </form>

                    <div className="join-section">
                        <p style={{ margin: '15px 0 6px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                            Join an Existing Project
                        </p>
                        <div className="hw-controls">
                            <input
                                type="text"
                                placeholder="Project ID"
                                value={joinId}
                                onChange={e => setJoinId(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleJoin}>Join</button>
                        </div>
                        {joinError && <p className="error" style={{ marginTop: '6px' }}>{joinError}</p>}
                    </div>

                    <p style={{ marginTop: '15px' }}>
                        <span className="link-btn" onClick={() => navigate('/dashboard')}>
                            ← Back to Dashboard
                        </span>
                    </p>
                </div>

                {projects.length > 0 && (
                    <div className="project-list-box">
                        <h3>Your Projects ({projects.filter(p => p.joined).length} joined)</h3>
                        {projects.map(p => (
                            <div className="project-item" key={p.id}>
                                <div className="project-item-info">
                                    <strong>{p.name}</strong>
                                    <span className="project-id">ID: {p.id}</span>
                                    {p.description && <span className="project-desc">{p.description}</span>}
                                    <span className="project-date">Created: {p.createdAt}</span>
                                </div>
                                <div className="project-item-actions">
                                    {p.joined ? (
                                        <span className="badge-joined">Joined</span>
                                    ) : (
                                        <button className="btn-small" onClick={() => {
                                            const updated = projects.map(x => x.id === p.id ? { ...x, joined: true } : x)
                                            saveProjects(updated)
                                            logActivity(`Joined project "${p.name}"`)
                                        }}>Join</button>
                                    )}
                                    {p.joined && (
                                        <button className="btn-small btn-grey" onClick={() => handleLeave(p.id)}>Leave</button>
                                    )}
                                    <button className="btn-small btn-red" onClick={() => handleDelete(p.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NewProject
