import { createFileRoute } from '@tanstack/react-router'
import LoginForm from '../components/auth/LoginForm'

export const Route = createFileRoute('/_public/login')({
    component: LoginPage,
})

function LoginPage() {
    return (
        <div className="auth-page">
            <LoginForm />
        </div>
    )
}
