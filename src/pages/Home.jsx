import { Link } from 'react-router-dom'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import classEvent from '../assets/home/class-event1.webp'
import teacherPhoto from '../assets/home/praveena.webp'
import featuredEvent from '../assets/home/featured-event.webp'
import autismMusicImage from '../assets/home/autism-music.webp'

import middlesbroughImage from '../assets/locations/middlesbrough.webp'
import durhamImage from '../assets/locations/durham.webp'
import newcastleImage from '../assets/locations/newcastle.webp'
import onlineImage from '../assets/home/online.webp'


const locations = [
    {
        name: 'Newcastle',
        image: newcastleImage,
    },
    {
        name: 'Durham',
        image: durhamImage,
    },
    {
        name: 'Middlesbrough',
        image: middlesbroughImage,
    },
    {
        name: 'Online',
        image: onlineImage,
    },
]

function Home() {
    return (
        <>
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-copy">
                        <p className="hero-eyebrow">
                            Carnatic music · North East England
                        </p>

                        <h1 className="hero-title">
                            <strong>Raaga Sudha</strong>
                            <span className="hero-subtitle">
                                <span className="hero-discover">Discover</span>
                                <span className="hero-carnatic">Carnatic Music</span>
                            </span>
                        </h1>

                        <p className="hero-text">
                            Explore, enjoy and grow with Raaga Sudha Music Academy —
                            through traditional Carnatic music, creativity and community.
                        </p>

                        <div className="hero-actions">
                            <Button to="/classes">Explore Classes</Button>
                            <Button to="/contact" variant="secondary">
                                Enquire Now
                            </Button>
                        </div>

                        <div className="hero-location-strip">
                            <span>Newcastle</span>
                            <i>·</i>
                            <span>Durham</span>
                            <i>·</i>
                            <span>Middlesbrough</span>
                            <i>·</i>
                            <span>Online</span>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-photo">
                            <img src={classEvent} alt="Raaga Sudha students learning Carnatic music" />
                        </div>
                        <div className="hero-note">
                            <span>Explore · Enjoy · Belong</span>
                            <strong>Music with tradition and heart.</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="intro section">
                <div className="intro-image">
                    <img
                        src={autismMusicImage}
                        alt="Children participating in music learning at Raaga Sudha"
                    />
                </div>

                <div className="intro-copy">
                    <p className="eyebrow">Welcome to Raaga Sudha</p>

                    <h2>Music that grows with you.</h2>

                    <p>
                        Raaga Sudha offers Carnatic music learning in a welcoming and
                        supportive environment, helping students develop musical skill,
                        confidence and a lasting connection with music.
                    </p>

                    <p>
                        <strong>Raaga Sudha and Autism</strong><br />
                        Since 2023, young adults from Autism Able in South Tyneside have
                        been learning music with enthusiasm and passion, building
                        confidence through learning and performance.
                    </p>
                </div>
            </section>

            <section className="classes-preview section section-blue">
                <SectionHeading
                    eyebrow="Learn with us"
                    title="Find a class near you."
                    text="Join us in person across the North East or learn from home through our online classes."
                />

                <div className="location-grid">
                    {locations.map((location) => (
                        <article
                            className="location-card"
                            key={location.name}
                            style={{ backgroundImage: `url(${location.image})` }}
                        >
    <span className="location-index">
        {String(locations.indexOf(location) + 1).padStart(2, '0')}
    </span>

                            <h3>{location.name}</h3>

                            <p>{location.venue}</p>

                            <strong>{location.time}</strong>

                            <Link to="/classes">View class →</Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="pillars section">
                <SectionHeading
                    eyebrow="The Raaga Sudha experience"
                    title="Explore. Experience. Enjoy."
                    centered
                />

                <div className="pillar-grid">
                    <article>
                        <span>01</span>
                        <h3>Eplore</h3>
                        <p>
                            Build a strong foundation in Carnatic music through
                            structured and progressive learning.
                        </p>
                    </article>

                    <article>
                        <span>02</span>
                        <h3>Experience</h3>
                        <p>
                            Explore music through workshops, community activities
                            and shared musical experiences.
                        </p>
                    </article>

                    <article>
                        <span>03</span>
                        <h3>Enjoy</h3>
                        <p>
                            Grow in confidence through concerts, showcases and
                            opportunities such as Pradarshana.
                        </p>
                    </article>
                </div>
            </section>

            <section className="teacher-preview section section-peach">
                <div className="teacher-photo">
                    <img src={teacherPhoto} alt="Praveena Srikantan - Raaga Sudha music teacher" />
                </div>

                <div>
                    <p className="eyebrow">Meet your teacher</p>

                    <h2>Music with tradition, creativity and heart.</h2>

                    <p>
                        At the heart of Raaga Sudha is Praveena Srikantan, whose
                        teaching brings together the traditions of Carnatic music
                        with a warm and encouraging approach to learning.
                    </p>

                    <Link className="text-link" to="/about">
                        Meet Praveena →
                    </Link>
                </div>
            </section>

            <section className="event-preview section">
                <img
                    src={featuredEvent}
                    alt="Raaga Sudha students performing at a featured event"
                />

                <div>
                    <p className="eyebrow">Events & performances</p>

                    <h2>Music comes alive on stage.</h2>

                    <p>
                        Students are encouraged to share their learning through
                        concerts, community events and our annual showcase,
                        Pradarshana.
                    </p>

                    <Button to="/events" variant="secondary">
                        Explore Events
                    </Button>
                </div>
            </section>

            <section className="community-preview section section-mint">
                <p className="eyebrow">Our community</p>

                <h2>Music brings people together.</h2>

                <p>
                    Raaga Sudha believes music should be accessible, joyful and
                    inclusive. Alongside regular music education, the academy
                    supports community initiatives and musical experiences.
                </p>

                <Link className="text-link" to="/community">
                    Discover our community →
                </Link>
            </section>

            <section className="cta section">
                <p className="eyebrow">Begin your musical journey</p>

                <h2>Ready to discover Carnatic music?</h2>

                <p>
                    Join Raaga Sudha in Middlesbrough, Durham, Newcastle or online.
                </p>

                <Button to="/contact">Enquire About Classes</Button>
            </section>
        </>
    )
}

export default Home