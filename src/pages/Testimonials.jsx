import { Link } from 'react-router-dom'

function Testimonials() {
  return (
    <>
      <section className="testimonials-hero">
        <div className="testimonials-hero-inner">
          <p className="eyebrow">Stories from Raaga Sudha</p>
          <h1>
            Every journey
            <span>has a song.</span>
          </h1>
          <p className="testimonials-hero-copy">
            A place for students, families and community members to share what
            learning and making music with Raaga Sudha has meant to them.
          </p>
        </div>
        <div className="testimonials-hero-mark" aria-hidden="true">♪</div>
      </section>

      <section className="testimonials-more-samples section" aria-label="More sample testimonials">
        <div className="testimonials-more-heading">
          <p className="eyebrow">Peoples voices</p>
          <h2>Music is personal.So is every story.</h2>
        </div>
        <div className="testimonials-sample-grid">
          <article className="testimonials-sample-card testimonials-sample-card-parent">
            <p className="testimonial-sample-label">Parent voice</p>
            <blockquote>
              Seeing my twin girls grow in confidence through music has been a joy. I’m grateful to Raagasudha for creating a warm, encouraging space where they can learn, share their talents, and deepen their connection to our rich traditions and cultural heritage.
            </blockquote>
            <p className="testimonials-sample-byline">Mohana Kamanooru <span>Middlesbrough</span></p>
          </article>
          <article className="testimonials-sample-card testimonials-sample-card-community">
            <p className="testimonial-sample-label">Parent voice</p>
            <blockquote>
              Singing and chanting with my children through Raaga Sudha has
              become a treasured part of our family life. We love learning
              devotional songs together, and it fills me with joy to see them
              connect with music and our culture. Thank you to the Raaga Sudha
              team for keeping our traditions alive for the next generation.
            </blockquote>
            <p className="testimonials-sample-byline">Swathi Vangala <span>Middlesbrough</span></p>
          </article>
        </div>
      </section>

      <section className="testimonials-cta">
        <div className="testimonials-cta-inner">
          <p className="eyebrow">Your voice belongs here</p>
          <h2>Would you like to share your experience?</h2>
          <p>
            We’d be glad to hear from students, families and friends of Raaga
            Sudha.
          </p>
          <Link className="button button-primary" to="/contact">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  )
}

export default Testimonials
