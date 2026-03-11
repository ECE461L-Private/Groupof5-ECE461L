import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

// Helper to render Dashboard inside a router context
function renderDashboard() {
    return render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    )
}

describe('Dashboard Component', () => {

    // ── Rendering Tests ────────────────────────────────────────

    it('renders the welcome heading', () => {
        renderDashboard()
        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    })

    it('renders hardware sets summary card', () => {
        renderDashboard()
        expect(screen.getByText(/hardware sets/i)).toBeInTheDocument()
    })

    it('renders checked out summary card', () => {
        renderDashboard()
        expect(screen.getByText('Checked Out')).toBeInTheDocument()
    })

    it('renders projects summary card', () => {
        renderDashboard()
        expect(screen.getByText(/projects/i)).toBeInTheDocument()
    })

    it('renders the Recent Activity heading', () => {
        renderDashboard()
        expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument()
    })

    it('renders activity list items', () => {
        renderDashboard()
        expect(screen.getByText(/checked out 5 units/i)).toBeInTheDocument()
        expect(screen.getByText(/joined project/i)).toBeInTheDocument()
        expect(screen.getByText(/returned 2 units/i)).toBeInTheDocument()
        expect(screen.getByText(/created project/i)).toBeInTheDocument()
    })

    it('renders View Hardware button', () => {
        renderDashboard()
        expect(screen.getByRole('button', { name: /view hardware/i })).toBeInTheDocument()
    })

    it('renders New Project button', () => {
        renderDashboard()
        expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
    })

    it('renders My Profile button', () => {
        renderDashboard()
        expect(screen.getByRole('button', { name: /my profile/i })).toBeInTheDocument()
    })

    it('renders Logout button', () => {
        renderDashboard()
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })

    // ── Interaction Tests ──────────────────────────────────────

    it('navigates to /login on logout', async () => {
        mockNavigate.mockClear()
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /logout/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('shows alert when clicking View Hardware', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /view hardware/i }))
        expect(alertSpy).toHaveBeenCalledWith('Hardware Sets page coming soon!')
        alertSpy.mockRestore()
    })

    it('shows alert when clicking New Project', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /new project/i }))
        expect(alertSpy).toHaveBeenCalledWith('New Project page coming soon!')
        alertSpy.mockRestore()
    })

    it('shows alert when clicking My Profile', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /my profile/i }))
        expect(alertSpy).toHaveBeenCalledWith('Profile page coming soon!')
        alertSpy.mockRestore()
    })

    // ── Structure Tests ────────────────────────────────────────

    it('has summary cards container', () => {
        const { container } = renderDashboard()
        expect(container.querySelector('.summary-cards')).toBeInTheDocument()
    })

    it('has three summary cards', () => {
        const { container } = renderDashboard()
        const cards = container.querySelectorAll('.card')
        expect(cards.length).toBe(3)
    })

    it('has an activity list', () => {
        const { container } = renderDashboard()
        expect(container.querySelector('.activity-list')).toBeInTheDocument()
    })

    it('has four activity items', () => {
        const { container } = renderDashboard()
        const items = container.querySelectorAll('.activity-list li')
        expect(items.length).toBe(4)
    })
})
