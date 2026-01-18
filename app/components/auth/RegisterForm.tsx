import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { signUp } from '../../server/auth'

import './auth.css'

interface RegisterFormProps {
    onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [formError, setFormError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        onSubmit: async ({ value }) => {
            setFormError(null)
            setIsLoading(true)

            try {
                await signUp({
                    data: {
                        name: value.name,
                        email: value.email,
                        password: value.password,
                    },
                })

                // Success - redirect or callback
                if (onSuccess) {
                    onSuccess()
                } else {
                    window.location.href = '/'
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
                setFormError(errorMessage)
            } finally {
                setIsLoading(false)
            }
        },
    })

    return (
        <div className="auth-card">
            <div className="auth-header">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Makerskind and discover unique handicrafts</p>
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
                    name="name"
                    validators={{
                        onChange: ({ value }) => {
                            if (!value) return 'Name is required'
                            if (value.length < 2) return 'Name must be at least 2 characters'
                            return undefined
                        },
                    }}
                >
                    {(field) => (
                        <div className="form-group">
                            <label className="form-label" htmlFor={field.name}>
                                Full Name
                            </label>
                            <input
                                id={field.name}
                                type="text"
                                placeholder="Your full name"
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
                            if (value.length < 6) return 'Password must be at least 6 characters'
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
                                placeholder="At least 6 characters"
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
                    name="confirmPassword"
                    validators={{
                        onChangeListenTo: ['password'],
                        onChange: ({ value, fieldApi }) => {
                            if (!value) return 'Please confirm your password'
                            const password = fieldApi.form.getFieldValue('password')
                            if (value !== password) return 'Passwords do not match'
                            return undefined
                        },
                    }}
                >
                    {(field) => (
                        <div className="form-group">
                            <label className="form-label" htmlFor={field.name}>
                                Confirm Password
                            </label>
                            <input
                                id={field.name}
                                type="password"
                                placeholder="Confirm your password"
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
                    {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            <div className="auth-footer">
                <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
