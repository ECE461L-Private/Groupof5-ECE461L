import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ViewHardware from './ViewHardware'
import { renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

describe('ViewHardware Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('loads hardware and supports checkout, checkin, reset, and navigation', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 8, allocations: { proj_1: 2 } },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 7, allocations: { proj_1: 3 } },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 8, allocations: { proj_1: 2 } },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 10, allocations: {} },
                        ],
                    }),
            })

        renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByRole('heading', { name: /view hardware/i })).toBeInTheDocument()
        expect(screen.getByText(/this project has 2 checked out/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Quantity'), '1')
        await userEvent.click(screen.getByRole('button', { name: /check out/i }))
        expect(await screen.findByText(/checked out 1 unit/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Quantity'), '1')
        await userEvent.click(screen.getByRole('button', { name: /check in/i }))
        expect(await screen.findByText(/checked in 1 unit/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /return all/i }))
        expect(await screen.findByText(/all units returned/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('shows the no-project state and routes to project creation', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok', projects: [] }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [{ hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 10, allocations: {} }],
                    }),
            })

        renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/no projects yet/i)).toBeInTheDocument()
        await userEvent.click(screen.getByText(/create one/i))
        expect(mockNavigate).toHaveBeenCalledWith('/new-project')
    })

    it('validates quantity and shows backend checkout and checkin errors', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [
                            { project_id: 'proj_1', name: 'Alpha' },
                            { project_id: 'proj_2', name: 'Beta' },
                        ],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 9, allocations: { proj_1: 1 } },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error', message: 'No stock left' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error', message: 'Nothing to return' }) })

        renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/this project has 1 checked out/i)).toBeInTheDocument()
        await userEvent.selectOptions(screen.getByRole('combobox'), 'proj_2')
        await userEvent.selectOptions(screen.getByRole('combobox'), 'proj_1')
        await userEvent.click(screen.getByRole('button', { name: /check out/i }))
        expect(await screen.findByText(/enter a valid quantity/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Quantity'), '1')
        await userEvent.click(screen.getByRole('button', { name: /check out/i }))
        expect(await screen.findByText(/no stock left/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /check in/i }))
        expect(await screen.findByText(/nothing to return/i)).toBeInTheDocument()
    })

    it('logs fetch failures', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi.fn().mockRejectedValue(new Error('boom'))

        renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })

        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalled()
        })
    })

    it('handles checkout, checkin, reset, and log failures', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 9, allocations: { proj_1: 1 } },
                        ],
                    }),
            })
            .mockRejectedValueOnce(new Error('checkout failed'))
            .mockRejectedValueOnce(new Error('checkin failed'))
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockRejectedValueOnce(new Error('log failed'))
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 10, allocations: {} },
                        ],
                    }),
            })

        renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/this project has 1 checked out/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Quantity'), '1')
        await userEvent.click(screen.getByRole('button', { name: /check out/i }))
        expect(await screen.findByText(/failed to checkout/i)).toBeInTheDocument()

        await userEvent.clear(screen.getByPlaceholderText('Quantity'))
        await userEvent.type(screen.getByPlaceholderText('Quantity'), '1')
        await userEvent.click(screen.getByRole('button', { name: /check in/i }))
        expect(await screen.findByText(/failed to check in/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /return all/i }))
        expect(await screen.findByText(/all units returned/i)).toBeInTheDocument()

        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to log activity', expect.any(Error))
        })
    })

    it('shows reset errors and skips loading without a token', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 9, allocations: { proj_1: 1 } },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error', message: 'Reset denied' }) })

        const { unmount } = renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/this project has 1 checked out/i)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: /return all/i }))
        expect(await screen.findByText(/reset denied/i)).toBeInTheDocument()

        unmount()
        global.fetch.mockClear()
        cleanup()
        renderWithProviders(<ViewHardware />)
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('shows the return-all catch message when the reset request fails', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        hardware: [
                            { hw_id: 'hw_1', name: 'Kit', capacity: 10, available: 9, allocations: { proj_1: 1 } },
                        ],
                    }),
            })
            .mockRejectedValueOnce(new Error('reset failed'))

        renderWithProviders(<ViewHardware />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/this project has 1 checked out/i)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: /return all/i }))
        expect(await screen.findByText(/failed to return all/i)).toBeInTheDocument()
    })
})
