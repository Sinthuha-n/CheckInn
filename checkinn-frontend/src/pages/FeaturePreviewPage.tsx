import { ArrowLeft, DoorOpen, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'

interface FeaturePreviewPageProps {
  area: 'rooms' | 'admin'
}

const content = {
  rooms: {
    icon: DoorOpen,
    eyebrow: 'Authenticated preview',
    title: 'Your room search starts here.',
    description:
      'Your secure session is ready. Room discovery will arrive in the next independently tested part.',
  },
  admin: {
    icon: ShieldCheck,
    eyebrow: 'Administrator access',
    title: 'The operations desk is ready.',
    description:
      'Your administrator role has been verified. Inventory and booking management will be added in their dedicated part.',
  },
}

export function FeaturePreviewPage({ area }: FeaturePreviewPageProps) {
  const { description, eyebrow, icon: Icon, title } = content[area]

  return (
    <section className="feature-preview" aria-labelledby={`${area}-title`}>
      <Container size="narrow">
        <Icon aria-hidden="true" size={34} strokeWidth={1.4} />
        <p className="eyebrow eyebrow--dark">{eyebrow}</p>
        <h1 id={`${area}-title`}>{title}</h1>
        <p>{description}</p>
        <Link className="button button--secondary button--large" to="/">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to the foundation
        </Link>
      </Container>
    </section>
  )
}
