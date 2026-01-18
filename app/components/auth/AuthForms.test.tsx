
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock dependencies BEFORE imports
vi.mock('@tanstack/react-router', () => ({
    Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
    createFileRoute: () => (component: any) => component
}))

// Mock server auth functions
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('../../server/auth', () => ({
    signIn: (...args: any[]) => mockSignIn(...args),
    signUp: (...args: any[]) => mockSignUp(...args)
}))

// Import components AFTER mocking
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

describe('Auth Forms Verification (Issue #06)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('LoginForm', () => {
        it('renders all required fields', () => {
            render(<LoginForm />)
            
            expect(screen.getByRole('heading', { name: /welcome back/i })).toBeDefined()
            expect(screen.getByLabelText(/email/i)).toBeDefined()
            expect(screen.getByLabelText(/password/i)).toBeDefined()
            expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined()
        })

        it('validates email format', async () => {
            render(<LoginForm />)
            
            const emailInput = screen.getByLabelText(/email/i)
            fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
            fireEvent.blur(emailInput)

            await waitFor(() => {
                expect(screen.getByText(/please enter a valid email address/i)).toBeDefined()
            })
        })

        it('calls signIn server function with correct data on successful submission', async () => {
            mockSignIn.mockResolvedValueOnce({ session: { id: 'test-session' } })
            render(<LoginForm />)

            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
            fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
            
            const submitButton = screen.getByRole('button', { name: /sign in/i })
            fireEvent.click(submitButton)

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith({
                    data: {
                        email: 'test@example.com',
                        password: 'password123'
                    }
                })
            })
        })

        it('displays error message when signIn fails', async () => {
            mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'))
            render(<LoginForm />)

            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
            fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })
            
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.getByText(/invalid credentials/i)).toBeDefined()
            })
        })
    })

    describe('RegisterForm', () => {
        it('renders all required fields', () => {
            render(<RegisterForm />)
            
            expect(screen.getByRole('heading', { name: /create account/i })).toBeDefined()
            expect(screen.getByLabelText(/full name/i)).toBeDefined()
            expect(screen.getByLabelText(/email/i)).toBeDefined()
            expect(screen.getByLabelText(/^password$/i)).toBeDefined()
            expect(screen.getByLabelText(/confirm password/i)).toBeDefined()
            expect(screen.getByRole('button', { name: /create account/i })).toBeDefined()
        })

        it('validates password match', async () => {
            render(<RegisterForm />)
            
            fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
            const confirmInput = screen.getByLabelText(/confirm password/i)
            fireEvent.change(confirmInput, { target: { value: 'password456' } })
            fireEvent.blur(confirmInput)

            await waitFor(() => {
                expect(screen.getByText(/passwords do not match/i)).toBeDefined()
            })
        })

        it('calls signUp server function with correct data on successful submission', async () => {
            mockSignUp.mockResolvedValueOnce({ user: { id: '1' } })
            render(<RegisterForm />)

            fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } })
            fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
            fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })
            
            fireEvent.click(screen.getByRole('button', { name: /create account/i }))

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith({
                    data: {
                        name: 'Test User',
                        email: 'user@example.com',
                        password: 'password123'
                    }
                })
            })
        })
    })
})
