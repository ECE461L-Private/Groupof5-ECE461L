import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import CreateAccount from './CreateAccount'
import Dashboard from './Dashboard'
import MyProfile from './MyProfile'
import ViewHardware from './ViewHardware'
import NewProject from './NewProject'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/hardware" element={<ViewHardware />} />
            <Route path="/new-project" element={<NewProject />} />
        </Routes>
    )
}

export default App
