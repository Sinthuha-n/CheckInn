import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'

export function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <Container size="narrow">
        <p className="not-found__code">404</p>
        <h1 id="not-found-title">This room is not on the itinerary.</h1>
        <p>
          The page may have moved, or the address may be incorrect. Let’s take
          you back somewhere familiar.
        </p>
        <Link className="button button--primary button--large" to="/">
          <ArrowLeft aria-hidden="true" size={18} />
          Return home
        </Link>
      </Container>
    </section>
  )
}
