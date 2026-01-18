import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn } from '../../server/auth'

import './auth.css'

interface LoginFormProps {
    onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
    const [formError, setFormError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
        onSubmit: async ({ value }) => {
            setFormError(null)
            setIsLoading(true)

            try {
                await signIn({ data: value })

                // Success - redirect or callback
                if (onSuccess) {
                    onSuccess()
                } else {
                    window.location.href = '/'
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Invalid email or password'
                setFormError(errorMessage)
            } finally {
                setIsLoading(false)
            }
        },
    })

    return (
        <div className="auth-card">
            <div className="auth-header">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your Makerskind account</p>
            </div>

            <form
                className="auth-form"
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
            >
                {formError && <div className="form-error">{formError}</div>}

                <form.Field
                    name="email"
                    validators={{
                        onChange: ({ value }) => {
                            if (!value) return 'Email is required'
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                return 'Please enter a valid email address'
                            }
                            return undefined
                        },
                    }}
                >
                    {(field) => (
                        <div className="form-group">
                            <label className="form-label" htmlFor={field.name}>
                                Email
                            </label>
                            <input
                                id={field.name}
                                type="email"
                                placeholder="you@example.com"
                                className={`form-input ${field.state.meta.errors.length > 0 ? 'error' : ''}`}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <span className="field-error">
                                    {field.state.meta.errors.join(', ')}
                                </span>
                            )}
                        </div>
                    )}
                </form.Field>

                <form.Field
                    name="password"
                    validators={{
                        onChange: ({ value }) => {
                            if (!value) return 'Password is required'
                            return undefined
                        },
                    }}
                >
                    {(field) => (
                        <div className="form-group">
                            <label className="form-label" htmlFor={field.name}>
                                Password
                            </label>
                            <input
                                id={field.name}
                                type="password"
                                placeholder="Enter your password"
                                className={`form-input ${field.state.meta.errors.length > 0 ? 'error' : ''}`}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <span className="field-error">
                                    {field.state.meta.errors.join(', ')}
                                </span>
                            )}
                        </div>
                    )}
                </form.Field>

                <button
                    type="submit"
                    className={`auth-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="auth-footer">
                <p className="auth-footer-text">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-link">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
