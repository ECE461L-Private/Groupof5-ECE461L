import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyProfile from './MyProfile'
import { renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

describe('MyProfile Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders fetched profile data with projects and usage', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        data: {
                            username: 'shaun',
                            projects: [{ id: 'proj_1', name: 'Alpha' }],
                            usage: [{ project_name: 'Alpha', units: 2 }],
                        },
                    }),
            })
        )

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/username:/i)).toBeInTheDocument()
        expect(screen.getAllByText(/alpha/i)).toHaveLength(2)
        expect(screen.getByText(/checked out 2 total units/i)).toBeInTheDocument()
    })

    it('renders empty states and handles action buttons', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        data: { username: 'shaun', projects: [], usage: [] },
                    }),
            })
        )

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/you have not joined any projects yet/i)).toBeInTheDocument()
        expect(screen.getByText(/no hardware usage/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /change password/i }))
        expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: /logout/i }))
        await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }))

        expect(mockNavigate).toHaveBeenCalledWith('/login')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('logs profile fetch failures', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi.fn().mockRejectedValue(new Error('boom'))

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })

        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to load profile', expect.any(Error))
        })
    })

    it('renders singular usage text', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        data: {
                            username: 'shaun',
                            projects: [{ id: 'proj_1', name: 'Alpha' }],
                            usage: [{ project_name: 'Alpha', units: 1 }],
                        },
                    }),
            })
        )

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/checked out 1 total unit$/i)).toBeInTheDocument()
    })

    it('keeps the loading label when the profile response is not ok', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'error' }),
            })
        )

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/loading.../i)).toBeInTheDocument()
    })

    it('changes the password successfully', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        data: { username: 'shaun', projects: [], usage: [] },
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        message: 'Password changed successfully',
                    }),
            })

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })
        await screen.findByText(/you have not joined any projects yet/i)

        await userEvent.click(screen.getByRole('button', { name: /change password/i }))
        await userEvent.type(screen.getByPlaceholderText(/current password/i), 'oldpass123')
        await userEvent.type(screen.getByPlaceholderText(/^new password$/i), 'newpass456')
        await userEvent.type(screen.getByPlaceholderText(/confirm new password/i), 'newpass456')
        await userEvent.click(screen.getByRole('button', { name: /save new password/i }))

        expect(global.fetch).toHaveBeenNthCalledWith(
            2,
            '/api/auth/change_password',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer token-123',
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    current_password: 'oldpass123',
                    new_password: 'newpass456',
                }),
            })
        )
        expect(await screen.findByText(/password changed successfully\./i)).toBeInTheDocument()
        expect(screen.queryByPlaceholderText(/current password/i)).not.toBeInTheDocument()
    })

    it('validates password form input and shows API errors', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        data: { username: 'shaun', projects: [], usage: [] },
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'error',
                        message: 'Current password is incorrect',
                    }),
            })

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })
        await screen.findByText(/you have not joined any projects yet/i)

        await userEvent.click(screen.getByRole('button', { name: /change password/i }))
        await userEvent.click(screen.getByRole('button', { name: /save new password/i }))
        expect(await screen.findByText(/all password fields are required\./i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText(/current password/i), 'oldpass123')
        await userEvent.type(screen.getByPlaceholderText(/^new password$/i), 'newpass456')
        await userEvent.type(screen.getByPlaceholderText(/confirm new password/i), 'mismatch')
        await userEvent.click(screen.getByRole('button', { name: /save new password/i }))
        expect(await screen.findByText(/new passwords do not match\./i)).toBeInTheDocument()

        await userEvent.clear(screen.getByPlaceholderText(/confirm new password/i))
        await userEvent.type(screen.getByPlaceholderText(/confirm new password/i), 'newpass456')
        await userEvent.click(screen.getByRole('button', { name: /save new password/i }))
        expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument()
    })

    it('handles password change request failures', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        data: { username: 'shaun', projects: [], usage: [] },
                    }),
            })
            .mockRejectedValueOnce(new Error('nope'))

        renderWithProviders(<MyProfile />, { token: 'token-123', username: 'shaun' })
        await screen.findByText(/you have not joined any projects yet/i)

        await userEvent.click(screen.getByRole('button', { name: /change password/i }))
        await userEvent.type(screen.getByPlaceholderText(/current password/i), 'oldpass123')
        await userEvent.type(screen.getByPlaceholderText(/^new password$/i), 'newpass456')
        await userEvent.type(screen.getByPlaceholderText(/confirm new password/i), 'newpass456')
        await userEvent.click(screen.getByRole('button', { name: /save new password/i }))

        expect(await screen.findByText(/unable to change password\./i)).toBeInTheDocument()
        expect(errorSpy).toHaveBeenCalledWith('Failed to change password', expect.any(Error))
    })
})
