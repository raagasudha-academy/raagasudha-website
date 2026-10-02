import Button from '../components/Button'

function Community() {
    return (
        <>
            <section className="community-hero">
                <div className="community-hero-inner">
                    <p className="eyebrow">Raaga Sudha & community</p>

                    <h1>
                        Music has
                        <span>no boundaries.</span>
                    </h1>

                    <p>
                        We believe music can bring people together, create
                        confidence and give everyone an opportunity to express
                        themselves.
                    </p>
                </div>
            </section>

            <section className="community-story section">
                <div className="community-story-heading">
                    <p className="eyebrow">Music & inclusion</p>

                    <h2>
                        Taking music beyond
                        <span>the classroom.</span>
                    </h2>
                </div>

                <div className="community-story-copy">
                    <p>
                        Alongside her work as a music teacher, Mrs. Praveena is
                        a qualified Behaviour Consultant specialising in children
                        and young adults with learning disabilities.
                    </p>

                    <p>
                        She is passionate about bringing these two areas together
                        by taking music into the community and creating meaningful
                        opportunities for children and young adults with learning
                        disabilities.
                    </p>

                    <p>
                        For Raaga Sudha, music is not simply something to learn.
                        It can be a way to connect, communicate, participate and
                        create.
                    </p>
                </div>
            </section>

            <section className="community-feature">
                <div className="community-feature-inner">
                    <div className="community-feature-photo photo-placeholder">
                        <span>Community photograph</span>
                        <small>A real community moment will go here</small>
                    </div>

                    <div className="community-feature-copy">
                        <p className="eyebrow">Creativity in every child</p>

                        <h2>Not just learn. Enjoy and create music.</h2>

                        <p>
                            Praveena believes creativity is innate in every child.
                            Her approach is about giving students the opportunity
                            to discover and express that creativity through music.
                        </p>

                        <p>
                            Learning becomes more than mastering notes. It becomes
                            a chance to explore, participate and develop confidence.
                        </p>
                    </div>
                </div>
            </section>

            <section className="community-values section">
                <div className="community-values-heading">
                    <p className="eyebrow">Why music matters</p>

                    <h2>Music can connect us in many ways.</h2>
                </div>

                <div className="community-values-grid">
                    <article>
                        <span>01</span>
                        <h3>Connection</h3>
                        <p>
                            Music creates shared experiences and brings people
                            together across different backgrounds and abilities.
                        </p>
                    </article>

                    <article>
                        <span>02</span>
                        <h3>Expression</h3>
                        <p>
                            Music gives children and young people a creative way
                            to express themselves and explore their own ideas.
                        </p>
                    </article>

                    <article>
                        <span>03</span>
                        <h3>Confidence</h3>
                        <p>
                            Learning and performing can help students discover
                            their voice and grow in confidence.
                        </p>
                    </article>

                    <article>
                        <span>04</span>
                        <h3>Belonging</h3>
                        <p>
                            Shared musical experiences can create a sense of
                            participation and community.
                        </p>
                    </article>
                </div>
            </section>

            <section className="community-belief">
                <div className="community-belief-inner">
                    <p className="eyebrow">A simple belief</p>

                    <blockquote>
                        “Music is the key to transcending all boundaries and leads
                        to social harmony.”
                    </blockquote>

                    <p>
                        It is this belief that continues to shape the way
                        Raaga Sudha approaches music, learning and community.
                    </p>
                </div>
            </section>

            <section className="community-closing section">
                <p className="eyebrow">Be part of the journey</p>

                <h2>Everyone has a place in music.</h2>

                <p>
                    Discover our classes, performances and the wider Raaga Sudha
                    community.
                </p>

                <div className="community-actions">
                    <Button to="/classes">Explore Classes</Button>

                    <Button to="/events" variant="secondary">
                        Explore Events
                    </Button>
                </div>
            </section>
        </>
    )
}

export default Community