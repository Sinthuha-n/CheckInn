import { Container } from '../ui/Container'

export function Footer() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__inner">
        <div>
          <p className="site-footer__brand">CheckInn</p>
          <p className="site-footer__copy">
            Thoughtful stays, beautifully discovered.
          </p>
        </div>
        <p className="site-footer__meta">
          © {new Date().getFullYear()} CheckInn
        </p>
      </Container>
    </footer>
  )
}
