import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/ui/Container'
import { useAuth } from '../features/auth/useAuth'

const benefits = [
  {
    title: 'Search with clarity',
    description:
      'Choose the dates and number of guests that matter, with a focused path from discovery to decision.',
  },
  {
    title: 'Book with confidence',
    description:
      'Clear stay details and thoughtful validation help every reservation feel considered before it is confirmed.',
  },
  {
    title: 'Keep stays close',
    description:
      'Return to your account for reservation details, cancellations, and downloadable booking tickets.',
  },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="landing-page">
      <section className="landing-hero landing-panel" aria-labelledby="landing-title">
        <Container className="landing-hero__layout">
          <div className="landing-hero__content">
            <p className="eyebrow">
              <span aria-hidden="true" />
              A new standard of stay
            </p>
            <h1 id="landing-title">
              The journey begins <em>before</em> check-in.
            </h1>
            <p className="landing-hero__lede">
              Discover a more considered way to find your next room, make your
              reservation, and arrive with confidence.
            </p>
            <Link
              className="button button--large button--primary"
              state={isAuthenticated ? undefined : { from: '/find-your-stay' }}
              to={isAuthenticated ? '/find-your-stay' : '/login'}
            >
              Plan your stay
              <ArrowDown aria-hidden="true" size={18} />
            </Link>
          </div>

          <aside className="landing-hero__note" aria-label="CheckInn promise">
            <span className="landing-hero__note-number">01</span>
            <div>
              <p className="landing-hero__note-label">Your stay, considered</p>
              <p>A calm path from first search to confirmed arrival.</p>
            </div>
          </aside>
        </Container>
      </section>

      <section className="benefits-section landing-panel" aria-labelledby="benefits-title">
        <Container>
          <div className="section-heading">
            <p className="eyebrow eyebrow--dark">Why CheckInn</p>
            <h2 id="benefits-title">The details are part of the welcome.</h2>
          </div>
          <ol className="benefits-list">
            {benefits.map(({ description, title }, index) => (
              <li key={title}>
                <span className="benefits-list__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="brand-story landing-panel" aria-labelledby="brand-story-title">
        <Container className="brand-story__layout">
          <p className="brand-story__kicker">CheckInn</p>
          <div>
            <h2 id="brand-story-title">Hospitality begins with how it feels.</h2>
            <p>
              Our name is a promise to make every step before the door opens
              feel as welcoming as the stay itself.
            </p>
          </div>
          <Link
            className="brand-story__link"
            to={isAuthenticated ? '/find-your-stay' : '/register'}
          >
            {isAuthenticated ? 'Explore available rooms' : 'Create your account'}
            <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </Container>
      </section>
      <Footer />
    </div>
  )
}
