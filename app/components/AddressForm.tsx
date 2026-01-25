import { useForm } from '@tanstack/react-form'

import { updateUserAddressFn } from '../server/user'
import type { ShippingAddress } from '../utils/auth'
import { useState } from 'react'
import './AddressForm.css'

interface AddressFormProps {
    initialAddress: ShippingAddress | null
}

export function AddressForm({ initialAddress }: AddressFormProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    const form = useForm({
        defaultValues: initialAddress || {
            street: '',
            city: '',
            zip: '',
            country: ''
        },
        onSubmit: async ({ value }) => {
            setStatus('saving')
            try {
                await updateUserAddressFn({ data: { address: value } })
                setStatus('saved')
                setTimeout(() => setStatus('idle'), 3000)
            } catch (error) {
                console.error('Failed to update address:', error)
                setStatus('error')
            }
        }
    })

    return (
        <form
            className="address-form"
            onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
            }}
        >
            <form.Field
                name="street"
                validators={{
                    onChange: ({ value }) => !value ? 'Street is required' : undefined
                }}
                children={(field) => (
                    <div className="form-group">
                        <label htmlFor={field.name}>Street Address</label>
                        <input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors ? (
                            <em className="error">{field.state.meta.errors.join(', ')}</em>
                        ) : null}
                    </div>
                )}
            />

            <form.Field
                name="city"
                validators={{
                    onChange: ({ value }) => !value ? 'City is required' : undefined
                }}
                children={(field) => (
                    <div className="form-group">
                        <label htmlFor={field.name}>City</label>
                        <input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors ? (
                            <em className="error">{field.state.meta.errors.join(', ')}</em>
                        ) : null}
                    </div>
                )}
            />

            <form.Field
                name="zip"
                validators={{
                    onChange: ({ value }) => !value ? 'ZIP code is required' : undefined
                }}
                children={(field) => (
                    <div className="form-group">
                        <label htmlFor={field.name}>ZIP / Postal Code</label>
                        <input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors ? (
                            <em className="error">{field.state.meta.errors.join(', ')}</em>
                        ) : null}
                    </div>
                )}
            />

            <form.Field
                name="country"
                validators={{
                    onChange: ({ value }) => !value ? 'Country is required' : undefined
                }}
                children={(field) => (
                    <div className="form-group">
                        <label htmlFor={field.name}>Country</label>
                        <input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors ? (
                            <em className="error">{field.state.meta.errors.join(', ')}</em>
                        ) : null}
                    </div>
                )}
            />

            <div className="form-actions">
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <button
                            type="submit"
                            className="header-button"
                            disabled={!canSubmit || isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Address'}
                        </button>
                    )}
                />
                
                {status === 'saved' && (
                    <span className="success-message">Address saved successfully!</span>
                )}
                {status === 'error' && (
                    <span className="error">Failed to save address. Please try again.</span>
                )}
            </div>
        </form>
    )
}
