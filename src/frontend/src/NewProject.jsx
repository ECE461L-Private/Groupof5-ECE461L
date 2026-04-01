import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { API_BASE } from './apiBase'

const logActivity = async (msg, token) => {
    try {
        await fetch(`${API_BASE}/logs/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ message: msg })
        })
    } catch(e) { console.error('Failed to log activity', e) }
}

function NewProject() {
    const [projectName, setProjectName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [projects, setProjects] = useState([])
    const [joinId, setJoinId] = useState('')
    const [joinError, setJoinError] = useState('')
    const navigate = useNavigate()
    const { token } = useAuth()

    const fetchProjects = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/projects/get_projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.status === 'ok') {
                const mapped = data.projects.map(p => ({
                    id: p.project_id,
                    name: p.name,
                    description: `Owner: ${p.owner}`,
                    joined: p.joined ?? true
                }))
                setProjects(mapped)
            }
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        fetchProjects()
    }, [token])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!projectName.trim()) {
            setError('Project Name is required.')
            return
        }

        try {
            const res = await fetch(`${API_BASE}/projects/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: projectName.trim() })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Created project "${projectName.trim()}"`, token)
                setSuccess(`Project "${projectName}" created! ID: ${data.project_id}`)
                fetchProjects()
                setProjectName('')
                setDescription('')
            } else {
                setError(data.message)
            }
        } catch(e) { setError('Failed to create project') }
    }

    const handleJoin = async () => {
        setJoinError('')
        if (!joinId.trim()) return

        try {
            const res = await fetch(`${API_BASE}/projects/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ project_id: joinId.trim() })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Joined project ID "${joinId.trim()}"`, token)
                setJoinId('')
                fetchProjects()
            } else {
                setJoinError(data.message)
            }
        } catch(e) { setJoinError('Failed to join project') }
    }

    const handleLeave = async (id, name) => {
        if (!window.confirm(`Are you sure you want to leave ${name}?`)) return
        try {
            const res = await fetch(`${API_BASE}/projects/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ project_id: id })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Left project "${name}"`, token)
                fetchProjects()
            } else {
                alert(data.message)
            }
        } catch(e) { alert('Failed to leave project') }
    }

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete project "${name}"? This action cannot be undone.`)) return
        try {
            const res = await fetch(`${API_BASE}/projects/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ project_id: id })
            })
            const data = await res.json()
            if (data.status === 'ok') {
                logActivity(`Deleted project "${name}"`, token)
                fetchProjects()
            } else {
                alert(data.message)
            }
        } catch(e) { alert('Failed to delete project') }
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
                                        <button className="btn-small btn-grey" onClick={() => handleLeave(p.id, p.name)}>Leave</button>
                                    )}
                                    <button className="btn-small btn-red" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
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
