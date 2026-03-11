import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

// Helper to render Login inside a router context
function renderLogin() {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    )
}

describe('Login Component', () => {

    beforeEach(() => {
        mockNavigate.mockClear()
        // Default fetch mock — successful login
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', message: 'Login successful' }),
            })
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ── Rendering Tests ────────────────────────────────────────

    it('renders the login heading', () => {
        renderLogin()
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
    })

    it('renders the User ID input', () => {
        renderLogin()
        expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument()
    })

    it('renders the Password input', () => {
        renderLogin()
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('renders a Login button', () => {
        renderLogin()
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })

    it('renders a link to the create account page', () => {
        renderLogin()
        const link = screen.getByRole('link', { name: /create account/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/create-account')
    })

    it('renders "New User?" text', () => {
        renderLogin()
        expect(screen.getByText(/new user\?/i)).toBeInTheDocument()
    })

    // ── Initial State Tests ────────────────────────────────────

    it('has empty User ID input initially', () => {
        renderLogin()
        expect(screen.getByPlaceholderText('User ID')).toHaveValue('')
    })

    it('has empty Password input initially', () => {
        renderLogin()
        expect(screen.getByPlaceholderText('Password')).toHaveValue('')
    })

    it('does not show an error message initially', () => {
        renderLogin()
        expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument()
    })

    // ── Input Interaction Tests ────────────────────────────────

    it('allows typing a User ID', async () => {
        renderLogin()
        const input = screen.getByPlaceholderText('User ID')
        await userEvent.type(input, 'shaunak')
        expect(input).toHaveValue('shaunak')
    })

    it('allows typing a Password', async () => {
        renderLogin()
        const input = screen.getByPlaceholderText('Password')
        await userEvent.type(input, 'secret123')
        expect(input).toHaveValue('secret123')
    })

    it('password input has type="password"', () => {
        renderLogin()
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    })

    // ── Validation Tests ───────────────────────────────────────

    it('shows error when submitting with empty fields', async () => {
        renderLogin()
        const button = screen.getByRole('button', { name: /login/i })
        await userEvent.click(button)
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })

    it('shows error when User ID is empty but password is filled', async () => {
        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })

    it('shows error when Password is empty but User ID is filled', async () => {
        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'shaunak')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })

    it('does not call fetch when fields are empty', async () => {
        renderLogin()
        await userEvent.click(screen.getByRole('button', { name: /login/i }))
        expect(global.fetch).not.toHaveBeenCalled()
    })

    // ── Form Submission Tests (with fetch mock) ────────────────

    it('calls fetch on valid form submission', async () => {
        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'bob')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('navigates to /dashboard on successful login', async () => {
        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'bob')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        // Wait for the async fetch to resolve
        await vi.waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('displays backend error message on failed login', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'error', message: 'Invalid password' }),
            })
        )

        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'bob')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        await vi.waitFor(() => {
            expect(screen.getByText(/invalid password/i)).toBeInTheDocument()
        })
    })

    it('clears previous error on new valid submission', async () => {
        renderLogin()

        // First submit with empty — triggers error
        await userEvent.click(screen.getByRole('button', { name: /login/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()

        // Fill in fields and submit again — error should be gone
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'user')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        await vi.waitFor(() => {
            expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument()
        })
    })

    // ── Structure & Accessibility Tests ────────────────────────

    it('has a form element wrapping the inputs', () => {
        const { container } = renderLogin()
        const form = container.querySelector('form')
        expect(form).toBeInTheDocument()
    })

    it('submit button has type="submit"', () => {
        renderLogin()
        expect(screen.getByRole('button', { name: /login/i })).toHaveAttribute('type', 'submit')
    })
})
