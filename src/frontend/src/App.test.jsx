import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './testUtils'

describe('App Routing', () => {
    beforeEach(() => {
        localStorage.clear()
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', projects: [], hardware: [], logs: [] }),
            })
        )
    })

    it('redirects / to the login page', () => {
        renderWithProviders(<App />, { route: '/' })
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('renders the login page for /login', () => {
        renderWithProviders(<App />, { route: '/login' })
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('renders the create account page for /create-account', () => {
        renderWithProviders(<App />, { route: '/create-account' })
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })

    it('redirects protected routes to login when unauthenticated', () => {
        renderWithProviders(<App />, { route: '/dashboard' })
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('renders protected routes when authenticated', async () => {
        renderWithProviders(<App />, { route: '/profile', token: 'token-123', username: 'shaun' })
        expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument()
    })

    it('renders the hardware page when authenticated', async () => {
        renderWithProviders(<App />, { route: '/hardware', token: 'token-123', username: 'shaun' })
        expect(screen.getByRole('heading', { name: /view hardware/i })).toBeInTheDocument()
    })

    it('renders the new project page when authenticated', async () => {
        renderWithProviders(<App />, { route: '/new-project', token: 'token-123', username: 'shaun' })
        expect(screen.getByRole('heading', { name: /new project/i })).toBeInTheDocument()
    })
})
