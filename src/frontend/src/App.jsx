import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './Login'
import CreateAccount from './CreateAccount'
import Dashboard from './Dashboard'
import MyProfile from './MyProfile'
import ViewHardware from './ViewHardware'
import NewProject from './NewProject'

function ProtectedRoute({ children }) {
    const { token } = useAuth()
    if (!token) {
        return <Navigate to="/login" replace />
    }
    return children
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/hardware" element={<ProtectedRoute><ViewHardware /></ProtectedRoute>} />
            <Route path="/new-project" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        </Routes>
    )
}

export default App
