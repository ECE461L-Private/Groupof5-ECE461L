import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CreateAccount from './CreateAccount'

// Helper to render CreateAccount inside a router context
function renderCreateAccount() {
    return render(
        <MemoryRouter>
            <CreateAccount />
        </MemoryRouter>
    )
}

describe('CreateAccount Component', () => {

    // ── Rendering Tests ────────────────────────────────────────

    it('renders the Create Account heading', () => {
        renderCreateAccount()
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })

    it('renders the User ID input', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument()
    })

    it('renders the Password input', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('renders the Confirm Password input', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument()
    })

    it('renders a Create Account button', () => {
        renderCreateAccount()
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('renders a link to the login page', () => {
        renderCreateAccount()
        const link = screen.getByRole('link', { name: /login/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/login')
    })

    it('renders "Already have an account?" text', () => {
        renderCreateAccount()
        expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    })

    // ── Initial State Tests ────────────────────────────────────

    it('has empty User ID input initially', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('User ID')).toHaveValue('')
    })

    it('has empty Password input initially', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('Password')).toHaveValue('')
    })

    it('has empty Confirm Password input initially', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('Confirm Password')).toHaveValue('')
    })

    it('does not show any error message initially', () => {
        renderCreateAccount()
        expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
    })

    // ── Input Interaction Tests ────────────────────────────────

    it('allows typing a User ID', async () => {
        renderCreateAccount()
        const input = screen.getByPlaceholderText('User ID')
        await userEvent.type(input, 'newuser')
        expect(input).toHaveValue('newuser')
    })

    it('allows typing a Password', async () => {
        renderCreateAccount()
        const input = screen.getByPlaceholderText('Password')
        await userEvent.type(input, 'secret123')
        expect(input).toHaveValue('secret123')
    })

    it('allows typing a Confirm Password', async () => {
        renderCreateAccount()
        const input = screen.getByPlaceholderText('Confirm Password')
        await userEvent.type(input, 'secret123')
        expect(input).toHaveValue('secret123')
    })

    it('password inputs have type="password"', () => {
        renderCreateAccount()
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
        expect(screen.getByPlaceholderText('Confirm Password')).toHaveAttribute('type', 'password')
    })

    // ── Validation Tests ───────────────────────────────────────

    it('shows error when submitting with all fields empty', async () => {
        renderCreateAccount()
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })

    it('shows error when only User ID is filled', async () => {
        renderCreateAccount()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'user')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })

    it('shows error when Confirm Password is missing', async () => {
        renderCreateAccount()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'user')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })

    it('shows error when passwords do not match', async () => {
        renderCreateAccount()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'user')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'different')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    it('does not show "passwords do not match" if fields are empty', async () => {
        renderCreateAccount()
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        // The first validation ("fill in all fields") fires before password match check
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
    })

    // ── Successful Submission Tests ────────────────────────────

    it('calls alert on successful account creation', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })

        renderCreateAccount()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(alertSpy).toHaveBeenCalledWith('Account created! (placeholder)')

        alertSpy.mockRestore()
    })

    it('does not show any error on valid submission', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })

        renderCreateAccount()
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()

        alertSpy.mockRestore()
    })

    it('clears previous error on new valid submission', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { })

        renderCreateAccount()

        // First submit with empty — triggers error
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()

        // Fill all fields correctly and submit
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument()

        alertSpy.mockRestore()
    })

    // ── Structure & Accessibility Tests ────────────────────────

    it('has a form element wrapping the inputs', () => {
        const { container } = renderCreateAccount()
        const form = container.querySelector('form')
        expect(form).toBeInTheDocument()
    })

    it('submit button has type="submit"', () => {
        renderCreateAccount()
        expect(screen.getByRole('button', { name: /create account/i })).toHaveAttribute('type', 'submit')
    })

    it('has exactly three input fields', () => {
        const { container } = renderCreateAccount()
        const inputs = container.querySelectorAll('input')
        expect(inputs.length).toBe(3)
    })
})
