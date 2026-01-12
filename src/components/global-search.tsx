'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Store, Beer, User, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { globalSearch, type SearchResult } from '@/lib/actions/search'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Flatten results for keyboard navigation
  const flatResults = results
    ? [
        ...results.businesses.map((b) => ({ type: 'business' as const, item: b })),
        ...results.products.map((p) => ({ type: 'product' as const, item: p })),
        ...results.users.map((u) => ({ type: 'user' as const, item: u })),
      ]
    : []

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Search when query changes
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null)
      setSelectedIndex(0)
      return
    }

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearch(query)
        setResults(data)
        setSelectedIndex(0)
      })
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle navigation
  const navigateTo = useCallback(
    (path: string) => {
      setOpen(false)
      setQuery('')
      setResults(null)
      router.push(path)
    },
    [router]
  )

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      const selected = flatResults[selectedIndex]
      if (selected.type === 'business') {
        navigateTo(`/business/${selected.item.slug}`)
      } else if (selected.type === 'product') {
        navigateTo(`/product/${selected.item.id}`)
      } else if (selected.type === 'user') {
        navigateTo(`/profile/${selected.item.username}`)
      }
    }
  }

  const hasResults =
    results &&
    (results.businesses.length > 0 ||
      results.products.length > 0 ||
      results.users.length > 0)

  const noResults = results && !hasResults && query.length >= 2

  let currentIndex = -1

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="overflow-hidden p-0 sm:max-w-xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search businesses, products, or users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {!query && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Start typing to search...
              </div>
            )}

            {noResults && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {hasResults && (
              <div className="py-2">
                {/* Businesses */}
                {results.businesses.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                      Businesses
                    </div>
                    {results.businesses.map((business) => {
                      currentIndex++
                      const index = currentIndex
                      return (
                        <button
                          key={business.id}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-accent',
                            selectedIndex === index && 'bg-accent'
                          )}
                          onClick={() => navigateTo(`/business/${business.slug}`)}
                        >
                          {business.logo_url ? (
                            <div className="relative h-9 w-9 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={business.logo_url}
                                alt={business.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                              <Store className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{business.name}</div>
                            {business.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {business.description}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                      Products
                    </div>
                    {results.products.map((product) => {
                      currentIndex++
                      const index = currentIndex
                      return (
                        <button
                          key={product.id}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-accent',
                            selectedIndex === index && 'bg-accent'
                          )}
                          onClick={() => navigateTo(`/product/${product.id}`)}
                        >
                          {product.photo_url ? (
                            <div className="relative h-9 w-9 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={product.photo_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chart-3/10">
                              <Beer className="h-4 w-4 text-chart-3" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              at {product.business_name}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                      Users
                    </div>
                    {results.users.map((user) => {
                      currentIndex++
                      const index = currentIndex
                      const displayName = user.display_name || user.username
                      return (
                        <button
                          key={user.id}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-accent',
                            selectedIndex === index && 'bg-accent'
                          )}
                          onClick={() => navigateTo(`/profile/${user.username}`)}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-chart-2/10 text-chart-2">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{displayName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
