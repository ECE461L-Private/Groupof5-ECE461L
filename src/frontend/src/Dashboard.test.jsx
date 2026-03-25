import { describe, it, expect, vi, beforeEach } from 'vitest'
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

    beforeEach(() => {
        localStorage.clear()
        localStorage.setItem('activityLog', JSON.stringify([
            { msg: 'Checked out 5 units', time: '10:00 AM' },
            { msg: 'Joined project ABC', time: '11:00 AM' },
            { msg: 'Returned 2 units', time: '12:00 PM' },
            { msg: 'Created project XYZ', time: '1:00 PM' }
        ]))
    })

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
        expect(screen.getByText('Units Checked Out')).toBeInTheDocument()
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

    it('navigates to /hardware on View Hardware click', async () => {
        mockNavigate.mockClear()
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /view hardware/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/hardware')
    })

    it('navigates to /new-project on New Project click', async () => {
        mockNavigate.mockClear()
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /new project/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/new-project')
    })

    it('navigates to /profile on My Profile click', async () => {
        mockNavigate.mockClear()
        renderDashboard()
        await userEvent.click(screen.getByRole('button', { name: /my profile/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/profile')
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
