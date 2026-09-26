import { KeyRound } from 'lucide-react'
import courtyardImage from '../../../assets/editorial/checkinn-courtyard.jpg'
import { Container } from '../../../components/ui/Container'

export function ExperienceSection() {
  return (
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
            composed experience—so you can spend less time navigating and more
            time looking forward to where you are going.
          </p>
          <div className="experience-copy__signature" aria-hidden="true">
            <KeyRound size={19} strokeWidth={1.6} />
            Thoughtful from search to stay
          </div>
        </div>
      </Container>
    </section>
  )
}
