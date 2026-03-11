import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Mock react-router-dom's useNavigate for components that use it
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

// Helper to render App with a specific initial route
function renderApp(initialRoute = '/') {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <App />
        </MemoryRouter>
    )
}

describe('E2E Integration Tests', () => {

    beforeEach(() => {
        mockNavigate.mockClear()
        // Default fetch mock — successful response
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', message: 'Success' }),
            })
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ── Navigation Flow Tests ──────────────────────────────────

    describe('Login ↔ Create Account Navigation', () => {
        it('navigates from login page to create account via link', async () => {
            renderApp('/login')
            expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()

            const createLink = screen.getByRole('link', { name: /create account/i })
            await userEvent.click(createLink)

            expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
        })

        it('navigates from create account page to login via link', async () => {
            renderApp('/create-account')
            expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()

            const loginLink = screen.getByRole('link', { name: /login/i })
            await userEvent.click(loginLink)

            expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
        })

        it('full navigation cycle: login → create-account → login', async () => {
            renderApp('/login')

            // Start on login
            expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()

            // Navigate to create account
            await userEvent.click(screen.getByRole('link', { name: /create account/i }))
            expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()

            // Navigate back to login
            await userEvent.click(screen.getByRole('link', { name: /login/i }))
            expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
        })
    })

    // ── Login Flow Tests ───────────────────────────────────────

    describe('Login Validation → Success Flow', () => {
        it('shows error on empty submit, then succeeds with filled fields', async () => {
            renderApp('/login')

            // Submit empty form — should show validation error
            await userEvent.click(screen.getByRole('button', { name: /login/i }))
            expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()

            // Fill in fields and submit — should call fetch and navigate
            await userEvent.type(screen.getByPlaceholderText('User ID'), 'testuser')
            await userEvent.type(screen.getByPlaceholderText('Password'), 'testpass')
            await userEvent.click(screen.getByRole('button', { name: /login/i }))

            await vi.waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(1)
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
            })
        })

        it('shows backend error on failed login, then succeeds after retry', async () => {
            // First call fails, second succeeds
            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    json: () => Promise.resolve({ status: 'error', message: 'User not found' }),
                })
                .mockResolvedValueOnce({
                    json: () => Promise.resolve({ status: 'ok', message: 'Logged in' }),
                })

            renderApp('/login')

            // First attempt — fails
            await userEvent.type(screen.getByPlaceholderText('User ID'), 'wrong')
            await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
            await userEvent.click(screen.getByRole('button', { name: /login/i }))

            await vi.waitFor(() => {
                expect(screen.getByText(/user not found/i)).toBeInTheDocument()
            })

            // Clear and retry with correct credentials
            await userEvent.clear(screen.getByPlaceholderText('User ID'))
            await userEvent.type(screen.getByPlaceholderText('User ID'), 'correct')
            await userEvent.click(screen.getByRole('button', { name: /login/i }))

            await vi.waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
            })
        })
    })

    // ── Create Account Flow Tests ──────────────────────────────

    describe('Create Account Validation → Success Flow', () => {
        it('shows validation errors in order, then succeeds', async () => {
            renderApp('/create-account')

            // Empty submit — fill-in-all-fields error
            await userEvent.click(screen.getByRole('button', { name: /create account/i }))
            expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()

            // Fill user ID and password but mismatched confirm
            await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
            await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
            await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'mismatch')
            await userEvent.click(screen.getByRole('button', { name: /create account/i }))
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()

            // Fix confirm password and submit
            await userEvent.clear(screen.getByPlaceholderText('Confirm Password'))
            await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass123')
            await userEvent.click(screen.getByRole('button', { name: /create account/i }))

            await vi.waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(1)
                expect(mockNavigate).toHaveBeenCalledWith('/login')
            })
        })

        it('shows backend error when username is taken', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve({
                    json: () => Promise.resolve({ status: 'error', message: 'Username already exists' }),
                })
            )

            renderApp('/create-account')
            await userEvent.type(screen.getByPlaceholderText('User ID'), 'taken')
            await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
            await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass')
            await userEvent.click(screen.getByRole('button', { name: /create account/i }))

            await vi.waitFor(() => {
                expect(screen.getByText(/username already exists/i)).toBeInTheDocument()
            })
            // Should NOT navigate on error
            expect(mockNavigate).not.toHaveBeenCalledWith('/login')
        })
    })

    // ── Dashboard Flow Tests ───────────────────────────────────

    describe('Dashboard Interactions', () => {
        it('renders dashboard with all sections', () => {
            renderApp('/dashboard')
            expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
            expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
        })

        it('logout navigates back to login', async () => {
            renderApp('/dashboard')
            await userEvent.click(screen.getByRole('button', { name: /logout/i }))
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })

        it('all nav buttons show coming-soon alerts', async () => {
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
            renderApp('/dashboard')

            await userEvent.click(screen.getByRole('button', { name: /view hardware/i }))
            expect(alertSpy).toHaveBeenCalledWith('Hardware Sets page coming soon!')

            await userEvent.click(screen.getByRole('button', { name: /new project/i }))
            expect(alertSpy).toHaveBeenCalledWith('New Project page coming soon!')

            await userEvent.click(screen.getByRole('button', { name: /my profile/i }))
            expect(alertSpy).toHaveBeenCalledWith('Profile page coming soon!')

            expect(alertSpy).toHaveBeenCalledTimes(3)
            alertSpy.mockRestore()
        })
    })

    // ── Root Redirect Tests ────────────────────────────────────

    describe('Root Redirect', () => {
        it('redirects / to the login page', () => {
            renderApp('/')
            expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
        })

        it('unknown route shows nothing (no crash)', () => {
            renderApp('/nonexistent-page')
            // Should not show login or create account — but should not crash
            expect(screen.queryByRole('heading', { name: /haas login/i })).not.toBeInTheDocument()
        })
    })
})
