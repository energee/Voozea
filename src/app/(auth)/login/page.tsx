import Link from 'next/link'
import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Sign in to Voozea</CardTitle>
          <CardDescription>Rate your favorite beers and dishes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className="text-center text-sm text-green-600 bg-green-50 p-3 rounded">
              {message}
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </p>
          )}

          <form action={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="text-center text-sm space-y-2">
            <p>
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
