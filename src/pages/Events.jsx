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
        event: "Pradarshana '26",
        date: '04-Jul-26',
        students: '65',
        turnout: '393',
        venue: 'Gala Theatre, Durham',
    },
    {
        event: "Pradarshana '25",
        date: '15-Jun-25',
        students: '60',
        turnout: '150',
        venue: 'St Aidans Community Center',
    },
    {
        event: "Pradarshana '24",
        date: '15-Jun-25',
        students: '58',
        turnout: '1110',
        venue: 'The Glasshouse International Centre For Music',
    },
    {
        event: 'Pradarshana London Edition',
        date: '18-Feb-24',
        students: '51',
        turnout: '320',
        venue: 'The Royal Court Theater',
    },
    {
        event: 'Pradarshana London Edition',
        date: '17-Feb-24',
        students: '51',
        turnout: '300',
        venue: 'The Bhavan',
    },
    {
        event: "Pradarshana '23",
        date: '24-Jun-23',
        students: '50',
        turnout: '543',
        venue: 'Playhouse Whitley Bay',
    },
    {
        event: "Pradarshana '22",
        date: '18-Jun-22',
        students: '40',
        turnout: '175',
        venue: 'Northern Stage',
    },
    {
        note: 'Covid 19',
    },
    {
        event: "Pradarshana '19",
        date: '22-Jun-19',
        students: '18',
        turnout: '160',
        venue: 'Northern Stage',
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
                        <h2>A growing stage for our students.</h2>
                    </div>

                    <p>
                        A snapshot of Raaga Sudha's Pradarshana journey, from our earlier
                        showcases to the latest editions.
                    </p>
                </div>

                <div className="pradarshana-table-wrap">
                    <table className="pradarshana-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Students Count</th>
                                <th>Audience Turnout</th>
                                <th>Venue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pradarshanaHistory.map((item, index) =>
                                item.note ? (
                                    <tr className="pradarshana-note-row" key={`${item.note}-${index}`}>
                                        <td colSpan="5">{item.note}</td>
                                    </tr>
                                ) : (
                                    <tr key={`${item.event}-${item.date || index}`}>
                                        <td>{item.event}</td>
                                        <td>{item.date}</td>
                                        <td>{item.students}</td>
                                        <td>{item.turnout}</td>
                                        <td>{item.venue}</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="pradarshana-history-note">
                    Visit this space for more information on upcoming Pradarshana events and editions.
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