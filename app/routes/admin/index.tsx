import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getFinancialStatsFn } from '../../server/admin-stats'
import { Loader2, DollarSign, TrendingUp, ShoppingBag, CreditCard, User, BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => getFinancialStatsFn(),
  })

  // Mock recent activity for visual completeness
  const recentActivity = [
    { id: 1, user: 'Alice Smith', action: 'placed order #1024', time: '2 mins ago', amount: '$120.00' },
    { id: 2, user: 'Bob Jones', action: 'registered new account', time: '1 hour ago' },
    { id: 3, user: 'Supplier A', action: 'added 5 new products', time: '3 hours ago' },
    { id: 4, user: 'Charlie', action: 'reviewed "Wooden Vase"', time: '5 hours ago' },
  ]

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-700 font-medium">Failed to load financial statistics.</p>
          <p className="text-sm text-red-500 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue || 0)}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          trend="+12.5% from last month"
          gradient="from-emerald-500 to-emerald-600"
        />
        <StatsCard
          title="Total Cost"
          value={formatCurrency(stats?.cost || 0)}
          icon={<CreditCard className="h-5 w-5 text-white" />}
          trend="+4.2% from last month"
          gradient="from-amber-500 to-amber-600"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(stats?.profit || 0)}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          trend="+8.1% from last month"
          gradient="from-indigo-500 to-indigo-600"
        />
        <StatsCard
          title="Active Orders"
          value={stats?.orderCount.toString() || '0'}
          icon={<ShoppingBag className="h-5 w-5 text-white" />}
          trend="+2 new today"
          gradient="from-violet-500 to-violet-600"
        />
      </div>

      {/* Recent Activity & Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Revenue Analytics</h3>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This Year</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((item, itemIdx) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {itemIdx !== recentActivity.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center ring-8 ring-white">
                           <User className="h-4 w-4 text-indigo-600" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{item.user}</span> {item.action}
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-xs text-gray-500">
                          {item.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  trend,
  gradient
}: { 
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
  gradient: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gray-50 opacity-50 blur-xl"></div>
      
      <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 shadow-sm bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
           <span className="text-emerald-600 font-medium flex items-center">
             {trend}
           </span>
        </div>
      )}
    </div>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
