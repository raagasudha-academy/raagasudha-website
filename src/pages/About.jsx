import { Link } from 'react-router-dom'

function About() {
    return (
        <>
            <section className="about-hero">
                <div className="about-hero-inner">
                    <p className="eyebrow">About Raaga Sudha</p>

                    <h1>
                        Music rooted in tradition.
                        <span>Inspired by creativity.</span>
                    </h1>

                    <p>
                        A journey in Carnatic music built around learning,
                        expression, confidence and the joy of creating music.
                    </p>
                </div>
            </section>

            <section className="about-praveena section">
                <div className="about-photo">
                    <img
                        src={`${import.meta.env.BASE_URL}praveena-photo.png`}
                        alt="Mrs. Praveena Srikantan"
                    />
                </div>

                <div className="about-praveena-copy">
                    <p className="eyebrow">Meet Mrs. Praveena</p>

                    <h2>A lifelong journey with Carnatic music.</h2>

                    <p>
                        Vidya Praveena Srikantan is a disciple of
                        Smt. Vijaya Nagarajan, a direct disciple of
                        Padma Vibhushan Smt. D. K. Pattammal.
                    </p>

                    <p>
                        Praveena studied Indian Classical Carnatic music under
                        Smt. Vijaya Nagarajan for 15 years in Chennai, India.
                        She has continued her musical journey through regular
                        lessons with experts in the field.
                    </p>

                    <p>
                        She has been teaching music in the UK for more than
                        17 years, including teaching at SAGE Gateshead in
                        Tyne and Wear.
                    </p>
                </div>
            </section>

            <section className="about-community">
                <div className="about-community-inner">
                    <div>
                        <p className="eyebrow">Music & community</p>

                        <h2>
                            Bringing music beyond
                            <span>the classroom.</span>
                        </h2>
                    </div>

                    <div className="about-community-copy">
                        <p>
                            Praveena is also a qualified Behaviour Consultant,
                            specialising in working with children and young adults
                            with learning disabilities.
                        </p>

                        <p>
                            She hopes to bring her skills in music and behaviour
                            therapy together by taking music into the community
                            and creating opportunities for children and young adults
                            with learning disabilities.
                        </p>

                        <p>
                            She believes strongly that music can transcend
                            boundaries and contribute to social harmony.
                        </p>
                    </div>
                </div>
            </section>

            <section className="about-creative section">
                <div className="about-creative-heading">
                    <p className="eyebrow">A creative musical journey</p>

                    <h2>Tradition gives us roots. Creativity lets us grow.</h2>
                </div>

                <div className="about-creative-grid">
                    <article>
                        <span>01</span>
                        <h3>Bhajans & devotional music</h3>
                        <p>
                            Praveena has a special interest in bhajan renditions
                            and has a vast repertoire of soulful devotional songs.
                        </p>
                    </article>

                    <article>
                        <span>02</span>
                        <h3>Composing & recording</h3>
                        <p>
                            Although trained in Carnatic music, Praveena has been
                            composing across different genres since her school days,
                            including bhajans, patriotic songs and songs about
                            India's sacred rivers.
                        </p>
                    </article>

                    <article>
                        <span>03</span>
                        <h3>Sharing musical skills</h3>
                        <p>
                            She has provided vocal training to young singers from
                            different parts of the country and has contributed to
                            several audio productions, including recordings at
                            Blueprint Studios in Manchester.
                        </p>
                    </article>

                    <article>
                        <span>04</span>
                        <h3>Raaga Days</h3>
                        <p>
                            Her innovative “Raaga Days” concept has been
                            appreciated by colleagues and reflects her interest
                            in making musical learning creative and engaging.
                        </p>
                    </article>
                </div>
            </section>

            <section className="about-philosophy">
                <div className="about-philosophy-inner">
                    <p className="eyebrow">Her teaching philosophy</p>

                    <blockquote>
                        “Not just learn, but enjoy and create music.”
                    </blockquote>

                    <p>
                        Praveena believes creativity is innate in every child.
                        Her aim is to give students the opportunity to discover
                        that creativity through music.
                    </p>
                </div>
            </section>

            <section className="about-cta section">
                <p className="eyebrow">Discover Raaga Sudha</p>

                <h2>Come learn, experience and create with us.</h2>

                <div className="about-cta-actions">
                    <Link to="/classes" className="button">
                        Explore Classes
                    </Link>

                    <Link to="/contact" className="button button-outline">
                        Get in Touch
                    </Link>
                </div>
            </section>
        </>
    )
}

export default About