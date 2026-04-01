import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'
import { renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

describe('Login Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        message: 'Login successful',
                        access_token: 'token-123',
                    }),
            })
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders the form fields and navigation link', () => {
        renderWithProviders(<Login />)
        expect(screen.getByRole('heading', { name: /haas login/i })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('User ID')).toHaveValue('')
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
        expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/create-account')
    })

    it('validates empty fields before submitting', async () => {
        renderWithProviders(<Login />)

        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('submits successfully and stores auth state', async () => {
        renderWithProviders(<Login />)

        await userEvent.type(screen.getByPlaceholderText('User ID'), 'bob')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/auth/login',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ username: 'bob', password: 'pass' }),
                })
            )
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })

        expect(localStorage.getItem('token')).toBe('token-123')
        expect(localStorage.getItem('username')).toBe('bob')
        expect(screen.getByText(/login successful/i)).toBeInTheDocument()
    })

    it('shows backend errors and clears validation errors on retry', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'error', message: 'Invalid password' }),
            })
        )

        renderWithProviders(<Login />)
        await userEvent.click(screen.getByRole('button', { name: /login/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('User ID'), 'bob')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong')
        await userEvent.click(screen.getByRole('button', { name: /login/i }))

        await vi.waitFor(() => {
            expect(screen.getByText(/invalid password/i)).toBeInTheDocument()
        })
        expect(screen.queryByText(/please fill in all fields/i)).not.toBeInTheDocument()
    })
})
