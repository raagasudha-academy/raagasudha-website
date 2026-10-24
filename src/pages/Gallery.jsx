import { Link } from 'react-router-dom'

import featurePhoto from '../assets/gallery/gallery-feature-children.webp'
import vocalEnsemblePhoto from '../assets/gallery/gallery-ensemble-vocal.webp'
import percussionPhoto from '../assets/gallery/gallery-percussion.webp'
import soloSingerPhoto from '../assets/gallery/gallery-solo-singer.webp'
import seatedDancePhoto from '../assets/gallery/gallery-dance-seated.webp'
import danceEnsemblePhoto from '../assets/gallery/gallery-dance-ensemble.webp'
import dramaticStoryPhoto from '../assets/gallery/gallery-drama-mask.webp'
import childrenStoryPhoto from '../assets/gallery/gallery-story-children.webp'
import sagesStoryPhoto from '../assets/gallery/gallery-story-sages.webp'
import courtStoryPhoto from '../assets/gallery/gallery-story-court.webp'
import dialogueStoryPhoto from '../assets/gallery/gallery-story-dialogue.webp'
import youngDevotionPhoto from '../assets/gallery/gallery-young-devotion.webp'
import youngKrishnaPhoto from '../assets/gallery/gallery-young-krishna.webp'
import youngDancerPhoto from '../assets/gallery/gallery-young-dancer.webp'
import krishnaSerpentPhoto from '../assets/gallery/gallery-krishna-serpent.webp'

function GalleryPhoto({ src, alt, className = '' }) {
    return (
        <div className={`gallery-photo ${className}`.trim()}>
            <img src={src} alt={alt} loading="lazy" />
        </div>
    )
}

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
                <GalleryPhoto
                    src={featurePhoto}
                    alt="Young Raaga Sudha performers sharing the stage"
                    className="gallery-feature-photo"
                />

                <div className="gallery-feature-copy">
                    <p className="eyebrow">Life at Raaga Sudha</p>

                    <h2>Music is best remembered through the moments we share.</h2>

                    <p>
                        From first performances to ambitious productions, our
                        stage brings together music, storytelling, confidence
                        and community.
                    </p>
                </div>
            </section>

            <section className="gallery-category gallery-category-soft section">
                <div className="gallery-category-heading">
                    <div>
                        <p className="eyebrow">Music on stage</p>
                        <h2>Voices, rhythm and ensemble.</h2>
                    </div>

                    <p>
                        Carnatic music, percussion, group singing and expressive
                        performance come together on stage.
                    </p>
                </div>

                <div className="gallery-grid gallery-grid-showcase">
                    <GalleryPhoto
                        src={vocalEnsemblePhoto}
                        alt="Raaga Sudha vocal ensemble performing on stage"
                        className="gallery-wide"
                    />
                    <GalleryPhoto
                        src={soloSingerPhoto}
                        alt="Raaga Sudha vocalist performing under stage lights"
                        className="gallery-portrait"
                    />
                    <GalleryPhoto
                        src={percussionPhoto}
                        alt="Percussion musicians accompanying a Raaga Sudha performance"
                    />
                    <GalleryPhoto
                        src={seatedDancePhoto}
                        alt="Dancers performing a colourful seated sequence"
                    />
                    <GalleryPhoto
                        src={danceEnsemblePhoto}
                        alt="Raaga Sudha dance ensemble performing together"
                        className="gallery-wide"
                    />
                </div>
            </section>

            <section className="gallery-category section">
                <div className="gallery-category-heading">
                    <div>
                        <p className="eyebrow">Stories brought to life</p>
                        <h2>Music becomes theatre.</h2>
                    </div>

                    <p>
                        Costume, dialogue, movement and music transform familiar
                        stories into memorable live experiences.
                    </p>
                </div>

                <div className="gallery-grid gallery-grid-story">
                    <GalleryPhoto
                        src={dramaticStoryPhoto}
                        alt="A dramatic mythological scene performed on stage"
                        className="gallery-tall"
                    />
                    <GalleryPhoto
                        src={childrenStoryPhoto}
                        alt="Young performers portraying characters from an Indian epic"
                    />
                    <GalleryPhoto
                        src={sagesStoryPhoto}
                        alt="Young performers and an elder character in a storytelling scene"
                    />
                    <GalleryPhoto
                        src={courtStoryPhoto}
                        alt="Children in colourful costumes performing a court scene"
                        className="gallery-wide"
                    />
                    <GalleryPhoto
                        src={dialogueStoryPhoto}
                        alt="Two young performers sharing a dramatic dialogue on stage"
                        className="gallery-portrait"
                    />
                </div>
            </section>

            <section className="gallery-category gallery-category-blue section">
                <div className="gallery-category-heading">
                    <div>
                        <p className="eyebrow">Young performers</p>
                        <h2>Confidence grows on stage.</h2>
                    </div>

                    <p>
                        Small moments of focus, expression and imagination often
                        become the memories that stay with us longest.
                    </p>
                </div>

                <div className="gallery-grid gallery-grid-young">
                    <GalleryPhoto
                        src={youngDevotionPhoto}
                        alt="Young performer in a devotional stage scene"
                        className="gallery-portrait"
                    />
                    <GalleryPhoto
                        src={youngKrishnaPhoto}
                        alt="Young performer dressed as Krishna playing the flute"
                        className="gallery-portrait"
                    />
                    <GalleryPhoto
                        src={youngDancerPhoto}
                        alt="Young dancer performing an expressive seated pose"
                        className="gallery-portrait"
                    />
                    <GalleryPhoto
                        src={krishnaSerpentPhoto}
                        alt="Young Krishna performer in a theatrical serpent scene"
                        className="gallery-wide"
                    />
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
