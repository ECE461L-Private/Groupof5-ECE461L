import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AuthProvider } from './AuthContext'

export function renderWithProviders(ui, { route = '/', token = null, username = null } = {}) {
    window.history.pushState({}, 'Test', route)

    if (token) {
        localStorage.setItem('token', token)
    } else {
        localStorage.removeItem('token')
    }

    if (username) {
        localStorage.setItem('username', username)
    } else {
        localStorage.removeItem('username')
    }

    return render(
        <MemoryRouter initialEntries={[route]}>
            <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
    )
}
