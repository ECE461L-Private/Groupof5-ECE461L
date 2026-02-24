import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import CreateAccount from './CreateAccount'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
        </Routes>
    )
}

export default App
