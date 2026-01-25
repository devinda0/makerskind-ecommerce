import type { OrderSerializable } from '../server/order-utils'
import './OrderList.css'

interface OrderListProps {
    orders: OrderSerializable[]
}

export function OrderList({ orders }: OrderListProps) {
    if (!orders.length) {
        return (
            <div className="empty-orders">
                <p>You haven't placed any orders yet.</p>
            </div>
        )
    }

    return (
        <div className="order-list">
            {orders.map((order) => (
                <div key={order._id} className="order-card">
                    <div className="order-header">
                        <div className="order-meta">
                            <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                            <div className="order-date">
                                {new Date(order.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                        <span className={`order-status ${order.status}`}>
                            {order.status}
                        </span>
                    </div>

                    <div className="order-items">
                        {order.items.map((item, index) => (
                            <div key={index} className="order-item">
                                <div className="item-name">
                                    <span className="item-quantity">{item.quantity}x</span>
                                    {item.productName}
                                </div>
                                <div className="item-price">
                                    ${(item.unitPrice * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="order-totals">
                        <div className="total-row">
                            <span className="total-label">Total</span>
                            <span className="total-amount">
                                ${order.totals.total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
