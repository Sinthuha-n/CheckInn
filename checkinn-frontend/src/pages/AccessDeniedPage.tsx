import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'

export function AccessDeniedPage() {
  return (
    <section className="status-page" aria-labelledby="access-denied-title">
      <Container size="narrow">
        <ShieldAlert aria-hidden="true" size={32} strokeWidth={1.5} />
        <p className="status-page__code">403 · Private access</p>
        <h1 id="access-denied-title">This space is reserved for the team.</h1>
        <p>
          Your account is signed in, but it does not have permission to open
          this area.
        </p>
        <Link className="button button--primary button--large" to="/">
          <ArrowLeft aria-hidden="true" size={18} />
          Return home
        </Link>
      </Container>
    </section>
  )
}
