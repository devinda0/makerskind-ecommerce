import { createFileRoute, redirect } from '@tanstack/react-router'
import { getUserProfileFn } from '../server/user'
import { getMyOrdersFn } from '../server/order'
import { AddressForm } from '../components/AddressForm'
import { OrderList } from '../components/OrderList'
import './profile.css'

export const Route = createFileRoute('/profile')({
    loader: async () => {
        try {
            const [user, ordersData] = await Promise.all([
                getUserProfileFn(),
                getMyOrdersFn({ data: { page: 1, limit: 10 } })
            ])
            return { user, orders: ordersData.orders }
        } catch (error) {
            // If authentication fails, redirect to login
            throw redirect({
                to: '/login',
                search: {
                    redirect: '/profile',
                },
            })
        }
    },
    component: ProfilePage,
})

function ProfilePage() {
    const { user, orders } = Route.useLoaderData()

    return (
        <div className="profile-page">
            <header className="profile-header">
                <h1>{user.name || 'Your Profile'}</h1>
                <div className="profile-email">{user.email}</div>
            </header>

            <div className="profile-content">
                <section className="profile-section">
                    <h2>Shipping Address</h2>
                    <div className="section-card">
                        <AddressForm initialAddress={user.shippingAddress} />
                    </div>
                </section>

                <section className="profile-section">
                    <h2>Order History</h2>
                    <OrderList orders={orders} />
                </section>
            </div>
        </div>
    )
}
