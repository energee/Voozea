'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { MessageCircle, Trash2, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createComment, deleteComment } from '@/lib/actions/social'
import { formatRelativeTime } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  created_at: string | null
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface CommentSectionProps {
  ratingId: string
  comments: Comment[]
  currentUserId?: string
}

export function CommentSection({ ratingId, comments: initialComments, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.set('rating_id', ratingId)
    formData.set('content', newComment.trim())

    const result = await createComment(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.comment) {
      setComments((prev) => [...prev, result.comment])
      setNewComment('')
    }

    setIsSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    const formData = new FormData()
    formData.set('comment_id', commentId)

    // Optimistic update
    const previousComments = [...comments]
    setComments((prev) => prev.filter((c) => c.id !== commentId))

    const result = await deleteComment(formData)
    if (result?.error) {
      // Revert on error
      setComments(previousComments)
      toast.error('Failed to delete comment')
    } else {
      toast.success('Comment deleted')
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Comments ({comments.length})
        </h3>

        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => {
              const displayName = comment.user.display_name || comment.user.username
              return (
                <div key={comment.id} className="flex gap-3 group">
                  <Link href={`/profile/${comment.user.username}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${comment.user.username}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {displayName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                      {currentUserId === comment.user.id && (
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-muted hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete comment</span>
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Delete comment</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your comment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(comment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}

        {/* Add comment form */}
        {currentUserId ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newComment.trim()}
              className="gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
            {' '}to leave a comment
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}
