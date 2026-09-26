import { RefreshCw, Star } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { ApiError } from '../../../services/apiClient'
import type { ReviewResponse } from '../../../types/api'
import { reviewApi } from '../reviewApi'

interface RoomReviewsProps {
  roomId: number
  token: string
}

const ratingValues = [1, 2, 3, 4, 5]

const newestFirst = (reviews: ReviewResponse[]) =>
  [...reviews].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )

const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {ratingValues.map((value) => (
        <Star
          aria-hidden="true"
          fill={value <= rating ? 'currentColor' : 'none'}
          key={value}
          size={16}
        />
      ))}
    </span>
  )
}

export function RoomReviews({ roomId, token }: RoomReviewsProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    let active = true

    reviewApi.forRoom(roomId)
      .then((result) => {
        if (active) setReviews(newestFirst(result))
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setLoadError(
            caughtError instanceof ApiError
              ? caughtError.message
              : 'Guest reviews could not be loaded. Please try again.',
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [retryKey, roomId])

  const averageRating = useMemo(
    () =>
      reviews.length === 0
        ? 0
        : reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length,
    [reviews],
  )

  const retryReviews = () => {
    setIsLoading(true)
    setLoadError('')
    setRetryKey((key) => key + 1)
  }

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (rating === 0) {
      setSubmitError('Choose a rating before submitting your review.')
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    try {
      const createdReview = await reviewApi.create(
        { roomId, rating, comment: comment.trim() },
        token,
      )
      setReviews((current) => newestFirst([createdReview, ...current]))
      setRating(0)
      setComment('')
      setIsSubmitted(true)
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Your review could not be published. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="room-reviews" aria-labelledby="room-reviews-title">
      <div className="room-reviews__heading">
        <div>
          <p className="eyebrow eyebrow--dark">Guest perspective</p>
          <h2 id="room-reviews-title">Room reviews</h2>
        </div>
        {reviews.length > 0 ? (
          <div className="review-summary" aria-label={`${averageRating.toFixed(1)} out of 5 from ${reviews.length} reviews`}>
            <strong>{averageRating.toFixed(1)}</strong>
            <span>/ 5</span>
            <small>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</small>
          </div>
        ) : null}
      </div>

      {isLoading ? <p className="review-state" role="status">Loading guest reviews…</p> : null}
      {loadError ? (
        <div className="review-state review-state--error" role="alert">
          <p>{loadError}</p>
          <button className="button button--secondary button--small" onClick={retryReviews} type="button">
            <RefreshCw aria-hidden="true" size={16} />Try again
          </button>
        </div>
      ) : null}
      {!isLoading && !loadError && reviews.length === 0 ? (
        <p className="review-state">No reviews yet. Be the first to share your stay.</p>
      ) : null}

      {!isLoading && !loadError && reviews.length > 0 ? (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card__heading">
                <div>
                  <h3>{review.userName}</h3>
                  <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
                </div>
                <RatingStars rating={review.rating} />
              </div>
              {review.comment ? <p>{review.comment}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      <div className="review-form-wrap">
        {isSubmitted ? (
          <p className="form-notice form-notice--success" role="status">
            Thank you. Your review has been published.
          </p>
        ) : (
          <form className="review-form" noValidate onSubmit={submitReview}>
            <div>
              <h3>Share your experience</h3>
              <p>Your feedback helps future guests choose their stay.</p>
            </div>
            <fieldset>
              <legend>Your rating</legend>
              <div className="review-rating">
                {ratingValues.map((value) => (
                  <label className={value <= rating ? 'review-rating__option review-rating__option--selected' : 'review-rating__option'} key={value}>
                    <input
                      checked={rating === value}
                      name="rating"
                      onChange={() => {
                        setRating(value)
                        setSubmitError('')
                      }}
                      type="radio"
                      value={value}
                    />
                    <Star aria-hidden="true" fill="currentColor" size={22} />
                    <span>{value} {value === 1 ? 'star' : 'stars'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="review-comment">
              <span>Comment <small>Optional</small></span>
              <textarea
                onChange={(event) => setComment(event.target.value)}
                placeholder="What stood out about your stay?"
                rows={4}
                value={comment}
              />
            </label>
            {submitError ? <p className="form-notice form-notice--error" role="alert">{submitError}</p> : null}
            <Button disabled={isSubmitting} size="large" type="submit">
              {isSubmitting ? 'Publishing review…' : 'Publish review'}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
