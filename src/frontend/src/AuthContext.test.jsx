import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AuthProvider, useAuth } from './AuthContext'

function Harness() {
    const { token, username, login, logout } = useAuth()

    return (
        <div>
            <span>{token || 'no-token'}</span>
            <span>{username || 'no-user'}</span>
            <button onClick={() => login('token-123', 'shaun')}>login</button>
            <button onClick={logout}>logout</button>
        </div>
    )
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('hydrates from localStorage', () => {
        localStorage.setItem('token', 'persisted-token')
        localStorage.setItem('username', 'persisted-user')

        render(
            <AuthProvider>
                <Harness />
            </AuthProvider>
        )

        expect(screen.getByText('persisted-token')).toBeInTheDocument()
        expect(screen.getByText('persisted-user')).toBeInTheDocument()
    })

    it('login stores auth state and logout clears it', async () => {
        render(
            <AuthProvider>
                <Harness />
            </AuthProvider>
        )

        await userEvent.click(screen.getByRole('button', { name: 'login' }))
        expect(screen.getByText('token-123')).toBeInTheDocument()
        expect(localStorage.getItem('token')).toBe('token-123')
        expect(localStorage.getItem('username')).toBe('shaun')

        await userEvent.click(screen.getByRole('button', { name: 'logout' }))
        expect(screen.getByText('no-token')).toBeInTheDocument()
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('username')).toBeNull()
    })
})
