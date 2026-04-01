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
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
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
        await userEvent.click(screen.getByRole('button', { name: /logout/i }))
        await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }))

        expect(alertSpy).toHaveBeenCalledWith('Change password functionality coming soon!')
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
})
