import { ArrowDown, ArrowUpRight, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import courtyardImage from '../assets/editorial/checkinn-courtyard.jpg'
import { Container } from '../components/ui/Container'
import { useAuth } from '../features/auth/useAuth'
import { RoomSearchForm } from '../features/rooms/components/RoomSearchForm'

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
    <>
      <section className="landing-hero" aria-labelledby="landing-title">
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
            <a className="button button--large button--primary" href="#stay-search">
              Plan your stay
              <ArrowDown aria-hidden="true" size={18} />
            </a>
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

      <section
        className="search-section"
        id="stay-search"
        aria-labelledby="search-title"
      >
        <Container>
          <div className="search-section__heading">
            <div>
              <p className="eyebrow eyebrow--dark">Find your stay</p>
              <h2 id="search-title">Where will you rest next?</h2>
            </div>
            <p>
              {isAuthenticated
                ? 'Enter your dates and party size to continue to live room availability.'
                : 'Enter your dates and party size. Sign in is required before live room availability can be shown.'}
            </p>
          </div>
          <RoomSearchForm />
        </Container>
      </section>

      <section className="experience-section" aria-labelledby="experience-title">
        <Container className="experience-section__layout">
          <figure className="experience-visual">
            <img
              alt="Sunlit hotel courtyard framed by limestone arches and tropical greenery"
              decoding="async"
              height="1024"
              loading="lazy"
              src={courtyardImage}
              width="1536"
            />
            <figcaption>Spaces selected to make arrival feel effortless.</figcaption>
          </figure>

          <div className="experience-copy">
            <p className="eyebrow eyebrow--dark">The CheckInn experience</p>
            <h2 id="experience-title">A quieter way to book well.</h2>
            <p>
              CheckInn brings the essential parts of planning a stay into one
              composed experience—so you can spend less time navigating and
              more time looking forward to where you are going.
            </p>
            <div className="experience-copy__signature" aria-hidden="true">
              <KeyRound size={19} strokeWidth={1.6} />
              Thoughtful from search to stay
            </div>
          </div>
        </Container>
      </section>

      <section className="benefits-section" aria-labelledby="benefits-title">
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

      <section className="brand-story" aria-labelledby="brand-story-title">
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
            to={isAuthenticated ? '/rooms' : '/register'}
          >
            {isAuthenticated ? 'Explore available rooms' : 'Create your account'}
            <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </Container>
      </section>
    </>
  )
}
