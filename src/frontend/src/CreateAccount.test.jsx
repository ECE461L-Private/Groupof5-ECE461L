import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateAccount from './CreateAccount'
import { renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

describe('CreateAccount Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        message: 'Account created',
                        access_token: 'token-123',
                    }),
            })
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders the form inputs and login link', () => {
        renderWithProviders(<CreateAccount />)
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
        expect(screen.getAllByDisplayValue('')).toHaveLength(3)
        expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login')
    })

    it('validates required fields and password mismatch', async () => {
        renderWithProviders(<CreateAccount />)

        await userEvent.click(screen.getByRole('button', { name: /create account/i }))
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'different')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('creates an account, logs in, and navigates to the dashboard', async () => {
        renderWithProviders(<CreateAccount />)

        await userEvent.type(screen.getByPlaceholderText('User ID'), 'alice')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/auth/add_user',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ username: 'alice', password: 'pass123' }),
                })
            )
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })

        expect(localStorage.getItem('token')).toBe('token-123')
        expect(localStorage.getItem('username')).toBe('alice')
        expect(screen.getByText(/account created/i)).toBeInTheDocument()
    })

    it('shows backend error responses', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'error', message: 'Username already exists' }),
            })
        )

        renderWithProviders(<CreateAccount />)
        await userEvent.type(screen.getByPlaceholderText('User ID'), 'taken')
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123')
        await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'pass123')
        await userEvent.click(screen.getByRole('button', { name: /create account/i }))

        await vi.waitFor(() => {
            expect(screen.getByText(/username already exists/i)).toBeInTheDocument()
        })
    })
})
