import Button from '../components/Button'

const locations = [
    {
        number: '01',
        name: 'Middlesbrough',
        type: 'In-person classes',
        description:
            'Join Raaga Sudha for Carnatic music learning in Middlesbrough.',
    },
    {
        number: '02',
        name: 'Durham',
        type: 'In-person classes',
        description:
            'Regular Carnatic music classes for students in the Durham area.',
    },
    {
        number: '03',
        name: 'Newcastle',
        type: 'In-person classes',
        description:
            'Learn Carnatic music through our Newcastle classes.',
    },
    {
        number: '04',
        name: 'Online',
        type: 'Online classes',
        description:
            'Raaga Sudha also offers online music classes. Contact Mrs. Praveena for registration, timings and availability.',
    },
]

function Contact() {
    return (
        <>
            <section className="contact-hero">
                <div className="contact-hero-inner">
                    <p className="eyebrow">Get in touch</p>

                    <h1>
                        Let's start your
                        <span>musical journey.</span>
                    </h1>

                    <p>
                        Whether you are looking for a class, asking about online
                        learning or simply want to know more about Raaga Sudha,
                        we'd love to hear from you.
                    </p>
                </div>
            </section>

            <section className="contact-intro section">
                <div>
                    <p className="eyebrow">Find your way to us</p>

                    <h2>
                        Music can meet you
                        <span>wherever you are.</span>
                    </h2>
                </div>

                <div className="contact-intro-copy">
                    <p>
                        Raaga Sudha offers in-person music classes across
                        Middlesbrough, Durham and Newcastle, as well as online
                        music classes.
                    </p>

                    <p>
                        For online class registration, timings and availability,
                        please contact Mrs. Praveena.
                    </p>
                </div>
            </section>

            <section className="contact-locations">
                <div className="contact-locations-inner">
                    <p className="eyebrow">Classes</p>

                    <h2>Where you can learn with us.</h2>

                    <div className="contact-location-grid">
                        {locations.map((location) => (
                            <article
                                className={`contact-location-card ${
                                    location.number === '02'
                                        ? 'peach'
                                        : location.number === '03'
                                            ? 'mint'
                                            : ''
                                }`}
                                key={location.name}
                            >
                                <span>{location.number}</span>

                                <p className="location-type">{location.type}</p>

                                <h3>{location.name}</h3>

                                <p>{location.description}</p>

                                {location.name === 'Online' && (
                                    <p className="location-note">
                                        Contact Mrs. Praveena for registration,
                                        timings and availability.
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="contact-enquiry section">
                <div className="contact-enquiry-card">
                    <div>
                        <p className="eyebrow">Have a question?</p>

                        <h2>
                            Tell us a little
                            <span>about what you're looking for.</span>
                        </h2>

                        <p>
                            Whether you're enquiring about classes, online learning,
                            performances or anything else about Raaga Sudha,
                            get in touch and we'll help you find the right place.
                        </p>
                    </div>

                    <div className="contact-enquiry-action">
                        <p className="eyebrow">Ready to begin?</p>

                        <Button to="/classes">
                            Explore Classes
                        </Button>
                    </div>
                </div>
            </section>

            <section className="contact-final section">
                <p className="eyebrow">Raaga Sudha Music Academy</p>

                <h2>We look forward to hearing from you.</h2>

                <div className="contact-final-actions">
                    <Button to="/events">
                        Explore Events
                    </Button>

                    <Button to="/community" variant="secondary">
                        Our Community
                    </Button>
                </div>
            </section>

            <section className="contact-details section">
                <div>
                    <p className="eyebrow">Contact us</p>

                    <h2>Speak to Praveena.</h2>

                    <p>
                        For class enquiries, registration, timings and
                        availability, please contact Mrs. Praveena.
                    </p>
                </div>

                <a
                    className="contact-phone"
                    href="tel:+447702785815"
                >
                    +44 7702 785815
                </a>
            </section>
        </>
    )
}

export default Contact