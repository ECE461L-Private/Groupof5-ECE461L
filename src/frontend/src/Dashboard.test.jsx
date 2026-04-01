import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard'
import { renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

describe('Dashboard Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('loads dashboard stats and recent activity', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha', owner: 'shaun', members: ['shaun'] }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', capacity: 10, available: 8, allocations: { proj_1: 2 } },
                            { hw_id: 'hw_2', capacity: 10, available: 10, allocations: {} },
                        ],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        logs: [{ msg: 'Checked out hardware', time: '10:00:00 AM' }],
                    }),
            })

        renderWithProviders(<Dashboard />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByRole('heading', { name: /welcome back, shaun!/i })).toBeInTheDocument()
        expect(screen.getByText('Hardware Sets').previousElementSibling).toHaveTextContent('2')
        expect(screen.getByText('Units Checked Out').previousElementSibling).toHaveTextContent('2')
        expect(screen.getByText('Projects Joined').previousElementSibling).toHaveTextContent('1')
        expect(await screen.findByText(/checked out hardware/i)).toBeInTheDocument()
    })

    it('shows the empty activity state and logs fetch failures', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi.fn().mockRejectedValue(new Error('boom'))

        renderWithProviders(<Dashboard />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument()
        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to fetch dashboard stats', expect.any(Error))
        })
    })

    it('keeps fallback stats when upstream responses are not ok', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error' }) })

        renderWithProviders(<Dashboard />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByRole('heading', { name: /welcome back, shaun!/i })).toBeInTheDocument()
        expect(screen.getByText('Hardware Sets').previousElementSibling).toHaveTextContent('2')
        expect(screen.getByText('Units Checked Out').previousElementSibling).toHaveTextContent('0')
        expect(screen.getByText('Projects Joined').previousElementSibling).toHaveTextContent('0')
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
    })

    it('handles ok responses with missing optional fields', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok', hardware: [] }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })

        renderWithProviders(<Dashboard />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument()
        expect(screen.getByText('Projects Joined').previousElementSibling).toHaveTextContent('0')
    })

    it('navigates through dashboard actions and logs out', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({ json: () => Promise.resolve({ status: 'ok', projects: [], hardware: [], logs: [] }) })
        )

        renderWithProviders(<Dashboard />, { token: 'token-123', username: 'shaun' })

        await userEvent.click(screen.getByRole('button', { name: /view hardware/i }))
        await userEvent.click(screen.getByRole('button', { name: /new project/i }))
        await userEvent.click(screen.getByRole('button', { name: /my profile/i }))
        await userEvent.click(screen.getByRole('button', { name: /logout/i }))

        expect(mockNavigate).toHaveBeenCalledWith('/hardware')
        expect(mockNavigate).toHaveBeenCalledWith('/new-project')
        expect(mockNavigate).toHaveBeenCalledWith('/profile')
        expect(mockNavigate).toHaveBeenCalledWith('/login')
        expect(localStorage.getItem('token')).toBeNull()
    })
})
