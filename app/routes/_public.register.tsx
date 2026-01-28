import { createFileRoute } from '@tanstack/react-router'
import RegisterForm from '../components/auth/RegisterForm'

export const Route = createFileRoute('/_public/register')({
    component: RegisterPage,
})

function RegisterPage() {
    return (
        <div className="auth-page">
            <RegisterForm />
        </div>
    )
}
