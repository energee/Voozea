import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createBusiness } from '@/lib/actions/business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/image-upload'
import { SiteHeader } from '@/components/site-header'

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

export default async function NewBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  // Fetch business types
  const { data: businessTypes } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('type', 'business_type')
    .order('name')

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add a Business</CardTitle>
            <CardDescription>
              Add a brewery, restaurant, bar, or any other business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                {error}
              </p>
            )}

            <form action={createBusiness} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input id="name" name="name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Business Type *</Label>
                  <Select name="category_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This determines the default category for products you add
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about this business..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" type="url" placeholder="https://" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-medium">Address</h3>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" name="address" placeholder="123 Main St" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" name="state" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input id="postal_code" name="postal_code" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-medium">Images</h3>

                <ImageUpload
                  name="logo_url"
                  label="Logo"
                />

                <ImageUpload
                  name="cover_url"
                  label="Cover Image"
                />
              </div>

              {/* Business Hours */}
              <div className="space-y-4">
                <h3 className="font-medium">Business Hours</h3>
                <p className="text-sm text-muted-foreground">Leave blank if closed on that day</p>

                <div className="space-y-3">
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-[100px_1fr_1fr] gap-2 items-center">
                      <Label className="text-sm">{label}</Label>
                      <Input
                        name={`hours_${key}_open`}
                        type="time"
                        className="text-sm"
                      />
                      <Input
                        name={`hours_${key}_close`}
                        type="time"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit">Add Business</Button>
                <Button variant="outline" asChild>
                  <Link href="/businesses">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
