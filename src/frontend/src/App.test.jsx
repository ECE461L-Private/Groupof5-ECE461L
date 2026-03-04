import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Helper to render App with a specific initial route
function renderApp(initialRoute = '/') {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <App />
        </MemoryRouter>
    )
}

describe('App Routing', () => {

    it('redirects / to the login page', () => {
        renderApp('/')
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('renders the Login page at /login', () => {
        renderApp('/login')
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('renders the Create Account page at /create-account', () => {
        renderApp('/create-account')
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })

    it('does not render Create Account heading on login page', () => {
        renderApp('/login')
        expect(screen.queryByRole('heading', { name: /create account/i })).not.toBeInTheDocument()
    })

    it('does not render Login heading on create-account page', () => {
        renderApp('/create-account')
        expect(screen.queryByRole('heading', { name: /haas login/i })).not.toBeInTheDocument()
    })

    it('login page has a link that points to /create-account', () => {
        renderApp('/login')
        const link = screen.getByRole('link', { name: /create account/i })
        expect(link).toHaveAttribute('href', '/create-account')
    })

    it('create-account page has a link that points to /login', () => {
        renderApp('/create-account')
        const link = screen.getByRole('link', { name: /login/i })
        expect(link).toHaveAttribute('href', '/login')
    })
})
