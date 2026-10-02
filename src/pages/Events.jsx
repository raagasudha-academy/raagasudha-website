import Button from '../components/Button'
import pradharshanaImage from '../assets/events/ragSudha26-409.jpg'
import eventPhotograph from '../assets/events/event-photograph.jpg'
import performancePhotograph from '../assets/events/performance-photograph.jpeg'
import communityPhotograph from '../assets/events/community-photograph.webp'
import celebrationPhotograph from '../assets/events/celebration-photograph.png'

const eventTypes = [
    {
        number: '01',
        title: 'Pradharshana',
        description:
            'A special opportunity for students to share their musical journey through performance.',
        tone: 'blue',
    },
    {
        number: '02',
        title: 'Concerts & performances',
        description:
            'Musical performances that bring students, families and the wider community together.',
        tone: 'peach',
    },
    {
        number: '03',
        title: 'Community celebrations',
        description:
            'Music as part of cultural, spiritual and community celebrations throughout the year.',
        tone: 'mint',
    },
]

function Events() {
    return (
        <>
            <section className="events-hero">
                <div className="events-hero-inner">
                    <p className="eyebrow">Events & performances</p>

                    <h1>
                        Music comes
                        <span>alive on stage.</span>
                    </h1>

                    <p>
                        From student showcases to community celebrations,
                        music gives us opportunities to learn, share and perform together.
                    </p>
                </div>
            </section>

            <section className="events-intro section">
                <div>
                    <p className="eyebrow">Experience Raaga Sudha</p>

                    <h2>Learning becomes music when we share it.</h2>
                </div>

                <p>
                    Performance is an important part of the musical journey at
                    Raaga Sudha. It gives students the opportunity to bring their
                    learning together, build confidence and experience the joy of
                    performing for others.
                </p>
            </section>

            <section className="events-feature section">
                <div className="event-large-photo">
                    <img
                        src={pradharshanaImage}
                        alt="Raaga Sudha students performing at Pradharshana"
                    />
                </div>

                <div className="events-feature-copy">
                    <p className="eyebrow">Featured</p>

                    <h2>Pradharshana</h2>

                    <p>
                        A special celebration of the students' musical journey,
                        bringing together learning, preparation and performance.
                    </p>

                    <p>
                        This space can later feature the details of the latest
                        Pradharshana, including photographs, programme information
                        and highlights from the event.
                    </p>

                    <Button to="/contact" variant="secondary">
                        Enquire About Events
                    </Button>
                </div>
            </section>

            <section className="event-types">
                <div className="event-types-inner">
                    <div className="event-types-heading">
                        <p className="eyebrow">More ways to experience music</p>

                        <h2>Moments that bring our community together.</h2>
                    </div>

                    <div className="event-type-grid">
                        {eventTypes.map((event) => (
                            <article className={`event-type-card ${event.tone}`} key={event.title}>
                                <span>{event.number}</span>

                                <h3>{event.title}</h3>

                                <p>{event.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="event-gallery section">
                <div className="event-gallery-heading">
                    <div>
                        <p className="eyebrow">Moments from our events</p>

                        <h2>Music, memories and community.</h2>
                    </div>

                    <p>
                        Real photographs from Raaga Sudha events will bring this
                        section to life.
                    </p>
                </div>

                <div className="event-photo-grid">
                    <div className="photo-placeholder photo-tall">
                        <img className="photo-event" src={eventPhotograph} alt="Event photograph" />
                    </div>

                    <div className="photo-placeholder">
                        <img className="photo-performance" src={performancePhotograph} alt="Performance photograph" />
                    </div>

                    <div className="photo-placeholder">
                        <img src={communityPhotograph} alt="Community photograph" />
                    </div>

                    <div className="photo-placeholder photo-wide">
                        <img src={celebrationPhotograph} alt="Celebration photograph" />
                    </div>
                </div>
            </section>

            <section className="events-cta section">
                <p className="eyebrow">Stay connected</p>

                <h2>Come experience the music with us.</h2>

                <p>
                    Follow our events and discover opportunities to learn,
                    perform and celebrate music together.
                </p>

                <div className="events-cta-actions">
                    <Button to="/classes">Explore Classes</Button>

                    <Button to="/contact" variant="secondary">
                        Get in Touch
                    </Button>
                </div>
            </section>
        </>
    )
}

export default Events