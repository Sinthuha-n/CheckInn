import { ArrowDown, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'

const principles = [
  {
    icon: Sparkles,
    title: 'Distinctly considered',
    description:
      'An editorial visual language shaped by generous space, elegant type, and purposeful detail.',
  },
  {
    icon: ShieldCheck,
    title: 'Inclusive by default',
    description:
      'Semantic structure, visible focus states, strong contrast, and calmer motion are built into the foundation.',
  },
  {
    icon: Check,
    title: 'Ready to evolve',
    description:
      'Reusable components and clear boundaries make each upcoming booking feature easier to build and maintain.',
  },
]

export function FoundationPage() {
  const showPrinciples = () => {
    document.querySelector('#principles')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className="foundation-hero" aria-labelledby="foundation-title">
        <Container className="foundation-hero__layout">
          <div className="foundation-hero__content">
            <p className="eyebrow">
              <span aria-hidden="true" />
              A new standard of stay
            </p>
            <h1 id="foundation-title">
              The journey begins <em>before</em> check-in.
            </h1>
            <p className="foundation-hero__lede">
              CheckInn is being shaped into a calm, considered way to discover
              remarkable places and book with confidence.
            </p>
            <Button size="large" onClick={showPrinciples}>
              Explore the foundation
              <ArrowDown aria-hidden="true" size={18} />
            </Button>
          </div>

          <aside className="foundation-note" aria-label="Foundation status">
            <span className="foundation-note__number">01</span>
            <div>
              <p className="foundation-note__label">Now building</p>
              <p>Identity, interface, and a thoughtful foundation.</p>
            </div>
          </aside>
        </Container>
      </section>

      <section
        className="principles-section"
        id="principles"
        aria-labelledby="principles-title"
      >
        <Container>
          <div className="section-heading">
            <p className="eyebrow eyebrow--dark">Our approach</p>
            <h2 id="principles-title">Made to feel effortless.</h2>
          </div>

          <ol className="principles-list">
            {principles.map(({ description, icon: Icon, title }, index) => (
              <li key={title}>
                <span className="principles-list__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon aria-hidden="true" size={22} strokeWidth={1.7} />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  )
}
