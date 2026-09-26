import { Container } from '../components/ui/Container'
import { ExperienceSection } from '../features/rooms/components/ExperienceSection'
import { RoomSearchForm } from '../features/rooms/components/RoomSearchForm'

export function FindYourStayPage() {
  return (
    <>
      <section className="search-section search-section--authenticated" aria-labelledby="search-title">
        <Container>
          <div className="search-section__heading">
            <div>
              <p className="eyebrow eyebrow--dark">Find your stay</p>
              <h1 id="search-title">Where will you rest next?</h1>
            </div>
            <p>
              Enter your dates and party size to explore live room availability.
            </p>
          </div>
          <RoomSearchForm />
        </Container>
      </section>
      <ExperienceSection />
    </>
  )
}
