import { Link } from 'react-router-dom'

function Gallery() {
    return (
        <>
            <section className="gallery-hero">
                <div className="gallery-hero-inner">
                    <p className="eyebrow">Gallery</p>

                    <h1>
                        Moments worth
                        <span>remembering.</span>
                    </h1>

                    <p>
                        A glimpse into learning, performing, celebrating and
                        sharing music with the Raaga Sudha community.
                    </p>
                </div>
            </section>

            <section className="gallery-feature section">
                <div className="gallery-feature-photo photo-placeholder">
                    <span>Featured photograph</span>
                    <small>Your strongest Raaga Sudha photograph goes here</small>
                </div>

                <div className="gallery-feature-copy">
                    <p className="eyebrow">Life at Raaga Sudha</p>

                    <h2>Music is best remembered through the moments we share.</h2>

                    <p>
                        From weekly classes to performances and community
                        celebrations, every photograph tells a little part of
                        the Raaga Sudha journey.
                    </p>
                </div>
            </section>

            <section className="gallery-category section">
                <div className="gallery-category-heading">
                    <div>
                        <p className="eyebrow">Classes</p>
                        <h2>Learning together.</h2>
                    </div>

                    <p>
                        Everyday moments from our music classes and learning
                        spaces across the North East.
                    </p>
                </div>

                <div className="gallery-grid gallery-grid-three">
                    <div className="photo-placeholder">
                        <span>Class photograph</span>
                    </div>

                    <div className="photo-placeholder">
                        <span>Class photograph</span>
                    </div>

                    <div className="photo-placeholder">
                        <span>Class photograph</span>
                    </div>
                </div>
            </section>

            <section className="gallery-category gallery-category-soft section">
                <div className="gallery-category-heading">
                    <div>
                        <p className="eyebrow">Performances</p>
                        <h2>From practice to stage.</h2>
                    </div>

                    <p>
                        Performances, Pradarshana and special musical moments
                        shared by our students.
                    </p>
                </div>

                <div className="gallery-grid gallery-grid-performance">
                    <div className="photo-placeholder gallery-large">
                        <span>Performance photograph</span>
                    </div>

                    <div className="photo-placeholder">
                        <span>Performance photograph</span>
                    </div>

                    <div className="photo-placeholder">
                        <span>Performance photograph</span>
                    </div>
                </div>
            </section>

            <section className="gallery-category section">
                <div className="gallery-category-heading">
                    <div>
                        <p className="eyebrow">Community</p>
                        <h2>Music beyond the classroom.</h2>
                    </div>

                    <p>
                        Moments that show the people, connections and community
                        around Raaga Sudha.
                    </p>
                </div>

                <div className="gallery-grid gallery-grid-community">
                    <div className="photo-placeholder">
                        <span>Community photograph</span>
                    </div>

                    <div className="photo-placeholder gallery-wide">
                        <span>Community photograph</span>
                    </div>
                </div>
            </section>

            <section className="gallery-cta section">
                <p className="eyebrow">Share the journey</p>

                <h2>Every musical journey has a story.</h2>

                <p>
                    Explore Raaga Sudha classes, events and community activities.
                </p>

                <div className="gallery-actions">
                    <Link className="button" to="/classes">
                        Explore Classes
                    </Link>

                    <Link className="button button-secondary" to="/events">
                        Explore Events
                    </Link>
                </div>
            </section>
        </>
    )
}

export default Gallery