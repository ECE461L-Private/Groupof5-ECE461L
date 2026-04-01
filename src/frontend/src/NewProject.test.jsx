import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProject from './NewProject'
import { renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

describe('NewProject Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('loads projects and supports creating and joining a project', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha', owner: 'shaun' }],
                    }),
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ status: 'ok', project_id: 'proj_2' }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [
                            { project_id: 'proj_1', name: 'Alpha', owner: 'shaun' },
                            { project_id: 'proj_2', name: 'Beta', owner: 'shaun' },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_2', name: 'Beta', owner: 'shaun' }],
                    }),
            })

        renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })

        expect(await screen.findByText(/your projects/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Project Name'), 'Beta')
        await userEvent.type(screen.getByPlaceholderText('Description (optional)'), 'Important description')
        await userEvent.click(screen.getByRole('button', { name: /create project/i }))
        expect(await screen.findByText(/project "Beta" created!/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Project ID'), 'proj_2')
        await userEvent.click(screen.getByRole('button', { name: /^join$/i }))

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/projects/join',
            expect.objectContaining({ method: 'POST' })
        )
    })

    it('handles successful leave and delete flows even when activity logging fails', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [
                            { project_id: 'proj_1', name: 'Alpha', owner: 'shaun', joined: false },
                            { project_id: 'proj_2', name: 'Beta', owner: 'shaun', joined: true },
                        ],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockRejectedValueOnce(new Error('log leave failed'))
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_2', name: 'Beta', owner: 'shaun', joined: true }],
                    }),
            })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok' }) })
            .mockRejectedValueOnce(new Error('log delete failed'))
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'ok', projects: [] }) })

        renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/your projects/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /leave/i }))
        await userEvent.click(screen.getByRole('button', { name: /delete/i }))

        expect(confirmSpy).toHaveBeenCalled()
        expect(alertSpy).not.toHaveBeenCalled()
        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to log activity', expect.any(Error))
        })
    })

    it('covers validation, errors, cancel flows, and destructive actions', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm')
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [
                            { project_id: 'proj_1', name: 'Alpha', owner: 'shaun', joined: false },
                            { project_id: 'proj_2', name: 'Beta', owner: 'shaun', joined: true },
                        ],
                    }),
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ status: 'error', message: 'Duplicate project' }),
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ status: 'error', message: 'Join failed' }),
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ status: 'error', message: 'Cannot leave' }),
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ status: 'error', message: 'Cannot delete' }),
            })

        renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/your projects/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /create project/i }))
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Project Name'), 'Alpha')
        await userEvent.click(screen.getByRole('button', { name: /create project/i }))
        expect(await screen.findByText(/duplicate project/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Project ID'), 'proj_1')
        await userEvent.click(screen.getByRole('button', { name: /^join$/i }))
        expect(await screen.findByText(/join failed/i)).toBeInTheDocument()

        confirmSpy.mockReturnValueOnce(true)
        await userEvent.click(screen.getByRole('button', { name: /leave/i }))
        await vi.waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Cannot leave')
        })

        confirmSpy.mockReturnValueOnce(false)
        await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
        expect(alertSpy).toHaveBeenCalledTimes(1)

        confirmSpy.mockReturnValueOnce(true)
        await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
        await vi.waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Cannot delete')
        })

        await userEvent.click(screen.getByText(/back to dashboard/i))
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('handles request failures for loading, creating, and joining', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch = vi
            .fn()
            .mockRejectedValueOnce(new Error('load failed'))
            .mockRejectedValueOnce(new Error('create failed'))
            .mockRejectedValueOnce(new Error('join failed'))

        renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })

        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalled()
        })

        await userEvent.type(screen.getByPlaceholderText('Project Name'), 'Gamma')
        await userEvent.click(screen.getByRole('button', { name: /create project/i }))
        expect(await screen.findByText(/failed to create project/i)).toBeInTheDocument()

        await userEvent.type(screen.getByPlaceholderText('Project ID'), 'proj_1')
        await userEvent.click(screen.getByRole('button', { name: /^join$/i }))
        expect(await screen.findByText(/failed to join project/i)).toBeInTheDocument()
    })

    it('handles request failures for leaving and deleting', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha', owner: 'shaun', joined: false }],
                    }),
            })
            .mockRejectedValueOnce(new Error('leave failed'))
            .mockRejectedValueOnce(new Error('delete failed'))

        renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/your projects/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /leave/i }))
        await vi.waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to leave project')
        })

        await userEvent.click(screen.getByRole('button', { name: /delete/i }))
        await vi.waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to delete project')
        })
    })

    it('does not fetch projects without a token and ignores empty join requests', async () => {
        global.fetch = vi.fn()

        renderWithProviders(<NewProject />)
        await userEvent.click(screen.getByRole('button', { name: /^join$/i }))

        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('ignores non-ok project fetches and supports canceling leave', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'error' }) })
            .mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        status: 'ok',
                        projects: [{ project_id: 'proj_1', name: 'Alpha', owner: 'shaun', joined: false }],
                    }),
            })

        const { unmount } = renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })
        expect(screen.queryByText(/your projects/i)).not.toBeInTheDocument()

        unmount()
        renderWithProviders(<NewProject />, { token: 'token-123', username: 'shaun' })
        expect(await screen.findByText(/your projects/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /leave/i }))
        expect(confirmSpy).toHaveBeenCalled()
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })
})
