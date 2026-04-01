import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './AuthContext'

function renderApp(route = '/login', { token = null, username = null } = {}) {
    localStorage.clear()
    if (token) {
        localStorage.setItem('token', token)
    }
    if (username) {
        localStorage.setItem('username', username)
    }

    return render(
        <MemoryRouter initialEntries={[route]}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </MemoryRouter>
    )
}

describe('E2E Integration Tests', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url, options) => {
            if (String(url).includes('/auth/add_user')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ status: 'ok', message: 'Created', access_token: 'new-token' }),
                })
            }
            if (String(url).includes('/auth/login')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ status: 'ok', message: 'Logged in', access_token: 'login-token' }),
                })
            }
            if (String(url).includes('/projects/get_projects')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ status: 'ok', projects: [], message: 'Fetched 0 projects' }),
                })
            }
            if (String(url).includes('/hardware/list')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ status: 'ok', hardware: [], message: 'Successfully fetched 0 hardware sets' }),
                })
            }
            if (String(url).includes('/logs/list')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ status: 'ok', logs: [] }),
                })
            }

            return Promise.resolve({
                json: () => Promise.resolve({ status: 'ok' }),
            })
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('supports create-account to dashboard navigation with persisted auth', async () => {
        renderApp('/create-account')

        await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(await screen.findByRole('heading', { name: /welcome back, alice!/i })).toBeInTheDocument()
        expect(localStorage.getItem('token')).toBe('new-token')
    })

    it('supports login, protected routing, and logout', async () => {
        renderApp('/login')

        await userEvent.type(screen.getByPlaceholderText('User ID'), 'bob')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(await screen.findByRole('heading', { name: /welcome back, bob!/i })).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: /logout/i }))
        expect(await screen.findByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('blocks protected routes without a token', () => {
        renderApp('/profile')
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })
})
