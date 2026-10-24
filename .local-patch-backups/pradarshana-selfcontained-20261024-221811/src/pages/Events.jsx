import Button from '../components/Button'
import pradarshanaImage from '../assets/events/pradarshana-photograph.webp'
import eventPhotograph from '../assets/events/event-photograph.webp'
import performancePhotograph from '../assets/events/performance-photograph.webp'
import communityPhotograph from '../assets/events/community-photograph.webp'
import celebrationPhotograph from '../assets/events/celebration-photograph.webp'

const eventTypes = [
    {
        number: '01',
        title: 'Pradarshana',
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

const pradarshanaHistory = [
    {
        year: '2026',
        production: 'Pradarshana 2026',
        venue: '',
        students: '',
        turnout: '',
    },
    {
        year: '2025',
        production: 'Pradarshana 2025',
        venue: '',
        students: '',
        turnout: '',
    },
    {
        year: '2023',
        production: 'Ramayana – The Journey',
        venue: 'PLAYHOUSE Whitley Bay',
        students: '',
        turnout: '',
    },
    {
        year: '2022',
        production: 'Pradarshana ’22 — Keertana Sankeertana',
        venue: 'Northern Stage, Newcastle upon Tyne',
        students: '',
        turnout: '',
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
                        src={pradarshanaImage}
                        alt="Raaga Sudha students performing at Pradarshana"
                    />
                </div>

                <div className="events-feature-copy">
                    <p className="eyebrow">Featured</p>

                    <h2>Pradarshana</h2>

                    <p>
                        A special celebration of the students' musical journey,
                        bringing together learning, preparation and performance.
                    </p>

                    <p>
                        Pradarshana brings students, families and teachers together
                        to celebrate progress, confidence and the joy of sharing
                        music with an audience.
                    </p>

                    <Button to="/contact" variant="secondary">
                        Enquire About Events
                    </Button>
                </div>
            </section>

            <section className="pradarshana-history section">
                <div className="pradarshana-history-heading">
                    <div>
                        <p className="eyebrow">Pradarshana through the years</p>
                        <h2>A growing tradition of performance.</h2>
                    </div>

                    <p>
                        Pradarshana gives Raaga Sudha students a stage to bring together
                        music, storytelling and community. This archive will continue to
                        grow as each new production is added.
                    </p>
                </div>

                <div className="pradarshana-table-wrap">
                    <table className="pradarshana-table">
                        <thead>
                            <tr>
                                <th scope="col">Year</th>
                                <th scope="col">Production</th>
                                <th scope="col">Venue</th>
                                <th scope="col">Students</th>
                                <th scope="col">Turnout</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pradarshanaHistory.map((event) => (
                                <tr key={event.year}>
                                    <td><strong>{event.year}</strong></td>
                                    <td>{event.production}</td>
                                    <td>{event.venue}</td>
                                    <td>{event.students}</td>
                                    <td>{event.turnout}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="pradarshana-history-note">
                    Historical information is being carried forward from the previous
                    Raaga Sudha website. Unconfirmed student and turnout figures are
                    intentionally left blank.
                    {' '}
                    <a
                        href="https://www.raagasudhamusic.co.uk/pradarshana"
                        target="_blank"
                        rel="noreferrer"
                    >
                        View the previous Pradarshana archive
                    </a>.
                </p>
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
                        A selection of moments from performances, celebrations and
                        gatherings across the Raaga Sudha community.
                    </p>
                </div>

                <div className="event-photo-grid">
                    <div className="photo-placeholder photo-tall">
                        <img className="photo-event" src={eventPhotograph} alt="Raaga Sudha event performance" loading="lazy" />
                    </div>

                    <div className="photo-placeholder">
                        <img className="photo-performance" src={performancePhotograph} alt="Raaga Sudha student performance" loading="lazy" />
                    </div>

                    <div className="photo-placeholder">
                        <img src={communityPhotograph} alt="Raaga Sudha community event" loading="lazy" />
                    </div>

                    <div className="photo-placeholder photo-wide">
                        <img src={celebrationPhotograph} alt="Raaga Sudha musical celebration" loading="lazy" />
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