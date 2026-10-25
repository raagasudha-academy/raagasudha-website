import Button from '../components/Button'
import { ACADEMY_LOCATIONS } from '../data/academyCatalog'

import classEvent from '../assets/classes/classes-hero.webp'
import middlesbroughImage from '../assets/locations/middlesbrough.webp'
import durhamImage from '../assets/locations/durham.webp'
import newcastleImage from '../assets/locations/newcastle.webp'
import onlineClassImage from '../assets/classes/online-classes.webp'

const locationPresentation = {
    'LOC-NEWCASTLE': {
        image: newcastleImage,
        fadeMid: 'rgba(255,247,240,0.55)',
        fadeEnd: 'rgba(255,247,240,0.96)',
    },
    'LOC-DURHAM': {
        image: durhamImage,
        fadeMid: 'rgba(228,243,238,0.55)',
        fadeEnd: 'rgba(228,243,238,0.96)',
    },
    'LOC-MIDDLESBROUGH': {
        image: middlesbroughImage,
        fadeMid: 'rgba(255,247,240,0.55)',
        fadeEnd: 'rgba(255,247,240,0.96)',
    },
}

const locations = ACADEMY_LOCATIONS
    .filter((location) => location.mode === 'in-person')
    .map((location) => ({
        ...location,
        ...locationPresentation[location.id],
    }))

function Classes() {
    return (
        <>
            <section className="page-hero">
                <div className="page-hero-copy">
                    <p className="eyebrow">Learn with Raaga Sudha</p>
                    <h1>
                        Find your
                        <span>musical space.</span>
                    </h1>
                    <p>
                        Join our Carnatic music classes in Middlesbrough, Durham
                        or Newcastle — or learn with us online from wherever you are.
                    </p>
                </div>

                <div className="page-hero-image">
                    <img
                        src={classEvent}
                        alt="Raaga Sudha students learning Carnatic music"
                    />
                </div>
            </section>

            <section className="classes-intro section">
                <div>
                    <p className="eyebrow">Our classes</p>
                    <h2>Learn at your own pace.</h2>
                </div>

                <p>
                    Raaga Sudha welcomes students to learn Carnatic music in a
                    supportive environment where regular practice, guidance and
                    performance opportunities come together.
                </p>
            </section>

            <section className="class-locations">
                <div className="class-locations-inner">
                    <div className="class-section-heading">
                        <p className="eyebrow">In-person classes</p>
                        <h2>Meet us near you.</h2>
                    </div>

                    <div className="class-location-list">
                        {locations.map((location, index) => (
                            <article
                                className={`class-location-card ${location.tone || ''}`}
                                key={location.id}
                                style={{
                                    '--location-image': `url(${location.image})`,
                                    '--location-fade-mid': location.fadeMid,
                                    '--location-fade-end': location.fadeEnd,
                                }}
                            >
                                <div className="class-location-number">
                                    {String(index + 1).padStart(2, '0')}
                                </div>

                                <div className="class-location-main">
                                    <p className="class-location-type">
                                        {location.type}
                                    </p>
                                    <h3>{location.name}</h3>
                                    <p className="class-location-venue">{location.venue}</p>
                                    <p className="class-location-address">{location.address}</p>
                                </div>

                                <div className="class-location-time">
                                    <span>{location.day}</span>
                                    <strong>{location.time}</strong>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="online-classes">
                <div className="online-classes-inner">
                    <div className="online-classes-image">
                        <img
                            src={onlineClassImage}
                            alt="Student learning music from home online"
                        />
                    </div>

                    <div className="online-classes-content">
                        <p className="online-classes-eyebrow">Online classes</p>
                        <h2>Music can meet you wherever you are.</h2>
                        <p>
                            Raaga Sudha also offers online music classes for students
                            who prefer to learn from home.
                        </p>
                        <p>
                            For information about online classes and availability,
                            please contact Praveena.
                        </p>
                        <Button to="/contact">Enquire About Online Classes</Button>
                    </div>
                </div>
            </section>

            <section className="learning section">
                <div className="learning-heading">
                    <p className="eyebrow">The learning journey</p>
                    <h2>More than learning notes.</h2>
                    <p>
                        Carnatic music is a journey of listening, practice,
                        expression and confidence.
                    </p>
                </div>

                <div className="learning-grid">
                    <article>
                        <span>01</span>
                        <h3>Build your foundation</h3>
                        <p>
                            Develop a strong understanding of Carnatic music through
                            structured learning and regular practice.
                        </p>
                    </article>
                    <article>
                        <span>02</span>
                        <h3>Grow your confidence</h3>
                        <p>
                            Progress gradually while developing musical expression,
                            listening and performance confidence.
                        </p>
                    </article>
                    <article>
                        <span>03</span>
                        <h3>Share your music</h3>
                        <p>
                            Students have opportunities to experience concerts,
                            showcases and community performances.
                        </p>
                    </article>
                </div>
            </section>

            <section className="classes-cta section">
                <p className="eyebrow">Ready to begin?</p>
                <h2>Let's start your musical journey.</h2>
                <p>
                    Tell us a little about yourself and the class you're
                    interested in.
                </p>
                <Button to="/registration">Register a Student</Button>
            </section>
        </>
    )
}

export default Classes
