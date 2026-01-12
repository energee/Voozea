import Link from 'next/link'
import { getAdminStats } from '@/lib/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Claims</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingClaims}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingClaims > 0 ? (
              <Link href="/admin/claims" className="text-sm text-primary hover:underline">
                Review claims
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No pending claims</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Businesses</CardDescription>
            <CardTitle className="text-3xl">{stats.totalBusinesses}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/businesses" className="text-sm text-primary hover:underline">
              View businesses
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-3xl">{stats.totalProducts}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">Across all businesses</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">Registered users</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage business types and product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.totalCategories} categories configured
            </p>
            <Link
              href="/admin/categories"
              className="text-sm text-primary hover:underline"
            >
              Manage categories
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Claims</CardTitle>
            <CardDescription>
              Review and approve ownership claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.pendingClaims} claims awaiting review
            </p>
            <Link
              href="/admin/claims"
              className="text-sm text-primary hover:underline"
            >
              Review claims
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
