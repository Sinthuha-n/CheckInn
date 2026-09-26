import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { authStorage } from '../auth/authStorage'
import { createSession, jsonResponse } from '../../test/authFixtures'
import { renderApp } from '../../test/renderApp'
import type { ReviewResponse, Room } from '../../types/api'

const room: Room = {
  id: 7,
  roomNumber: '204',
  roomType: 'Courtyard King',
  description: 'A quiet room overlooking the courtyard.',
  pricePerNight: 24000,
  capacity: 3,
  available: true,
}

const olderReview: ReviewResponse = {
  id: 4,
  roomId: room.id,
  userName: 'Older Guest',
  rating: 3,
  comment: 'Comfortable and quiet.',
  createdAt: '2030-05-01T10:00:00',
}

const newerReview: ReviewResponse = {
  id: 5,
  roomId: room.id,
  userName: 'Recent Guest',
  rating: 5,
  comment: 'The courtyard view was excellent.',
  createdAt: '2030-05-04T10:00:00',
}

const detailsUrl = '/rooms/7?checkIn=2030-06-12&checkOut=2030-06-15&guests=2'

const responseFor = (reviews: ReviewResponse[] | Response) =>
  vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/rooms/7') return Promise.resolve(jsonResponse(room))
    if (url === '/api/reviews/room/7') {
      return Promise.resolve(reviews instanceof Response ? reviews : jsonResponse(reviews))
    }
    throw new Error(`Unexpected request: ${url}`)
  })

describe('room reviews', () => {
  beforeEach(() => {
    sessionStorage.clear()
    authStorage.write(createSession())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows reviews newest first with an aggregate rating', async () => {
    vi.stubGlobal('fetch', responseFor([olderReview, newerReview]))
    renderApp(detailsUrl)

    expect(await screen.findByRole('heading', { name: 'Room reviews' })).toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Recent Guest' })
    const reviewerNames = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(reviewerNames.slice(0, 2)).toEqual(['Recent Guest', 'Older Guest'])
    expect(screen.getByLabelText('4.0 out of 5 from 2 reviews')).toBeInTheDocument()
  })

  it('shows an empty state without blocking the booking action', async () => {
    vi.stubGlobal('fetch', responseFor([]))
    renderApp(detailsUrl)

    expect(await screen.findByText(/no reviews yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue to booking/i })).toBeInTheDocument()
  })

  it('retries review loading independently from room details', async () => {
    const user = userEvent.setup()
    let reviewCalls = 0
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/rooms/7') return Promise.resolve(jsonResponse(room))
      if (url === '/api/reviews/room/7') {
        reviewCalls += 1
        return Promise.resolve(
          reviewCalls === 1
            ? jsonResponse({ message: 'Reviews are temporarily unavailable.' }, 503)
            : jsonResponse([newerReview]),
        )
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderApp(detailsUrl)

    expect(await screen.findByText('Reviews are temporarily unavailable.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue to booking/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByRole('heading', { name: 'Recent Guest' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === '/api/rooms/7')).toHaveLength(1)
  })

  it('validates and publishes an optional-comment review', async () => {
    const user = userEvent.setup()
    let resolveSubmission: ((response: Response) => void) | undefined
    const submission = new Promise<Response>((resolve) => {
      resolveSubmission = resolve
    })
    const createdReview = {
      ...newerReview,
      id: 8,
      userName: 'Avery Guest',
      comment: '',
      createdAt: '2030-06-16T09:00:00',
    }
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms/7') return Promise.resolve(jsonResponse(room))
      if (url === '/api/reviews/room/7') return Promise.resolve(jsonResponse([olderReview]))
      if (url === '/api/reviews' && init?.method === 'POST') return submission
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderApp(detailsUrl)

    await screen.findByRole('heading', { name: 'Share your experience' })
    await user.click(screen.getByRole('button', { name: /publish review/i }))
    expect(screen.getByText(/choose a rating/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '5 stars' }))
    await user.click(screen.getByRole('button', { name: /publish review/i }))
    expect(screen.getByRole('button', { name: /publishing review/i })).toBeDisabled()

    const postCall = fetchMock.mock.calls.find(([input]) => String(input) === '/api/reviews')
    expect(postCall?.[1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ roomId: 7, rating: 5, comment: '' }),
      method: 'POST',
    }))

    await act(async () => resolveSubmission?.(jsonResponse(createdReview)))
    expect(await screen.findByText(/review has been published/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Avery Guest' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publish review/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText('4.0 out of 5 from 2 reviews')).toBeInTheDocument()
  })

  it('shows the backend duplicate-review conflict', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms/7') return Promise.resolve(jsonResponse(room))
      if (url === '/api/reviews/room/7') return Promise.resolve(jsonResponse([]))
      if (url === '/api/reviews' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse({ message: 'You have already reviewed this room' }, 409))
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderApp(detailsUrl)

    await screen.findByText(/no reviews yet/i)
    await user.click(screen.getByRole('radio', { name: '4 stars' }))
    await user.click(screen.getByRole('button', { name: /publish review/i }))

    expect(await screen.findByText('You have already reviewed this room')).toBeInTheDocument()
  })
})
