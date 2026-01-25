import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getFinancialStatsFn } from '../../server/admin-stats'
import { Loader2, DollarSign, TrendingUp, ShoppingBag, CreditCard } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => getFinancialStatsFn(),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        <p>Failed to load financial statistics. Please try again later.</p>
        <p className="text-sm opacity-75">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          description="Total sales from all orders"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Total Cost"
          value={formatCurrency(stats?.cost || 0)}
          icon={<CreditCard className="h-5 w-5" />}
          description="Total cost of goods sold"
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatsCard
          title="Total Profit"
          value={formatCurrency(stats?.profit || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Net profit after costs"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.orderCount.toString() || '0'}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Total number of active orders"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Placeholder for charts or recent activity */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium">Recent Activity</h3>
        <p className="text-gray-500">Integration with Order Management coming soon.</p>
      </div>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  color, 
  bgColor 
}: { 
  title: string
  value: string
  icon: React.ReactNode
  description: string
  color: string
  bgColor: string
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`rounded-full p-2 ${bgColor} ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
