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

      <section className="testimonials-more-samples section" aria-label="Testimonials">
        <div className="testimonials-more-heading">
          <p className="eyebrow">People’s voices</p>
          <h2>Music is personal. So is every story.</h2>
        </div>
        <div className="testimonials-sample-grid">
          <article className="testimonials-sample-card testimonials-sample-card-parent">
            <p className="testimonial-sample-label">Parent voice</p>
            <blockquote>
              Watching my twin girls grow in confidence through music has been
              such a joy. Raaga Sudha gives them a warm, encouraging place to
              learn and share their talents. I’m grateful for the teachers’ care
              and for helping them connect with our traditions.
            </blockquote>
            <p className="testimonials-sample-byline">Mohana Kamanooru <span>Middlesbrough · 2026</span></p>
          </article>
          <article className="testimonials-sample-card testimonials-sample-card-community">
            <p className="testimonial-sample-label">Parent voice</p>
            <blockquote>
              Singing and chanting with my kids through Raagasudha is a
              beautiful part of our everyday life. We love enjoying soulful
              melodies and learning devotional songs together. It’s a joy to
              see them embrace music and our culture. Thank you for bringing
              families closer and keeping our traditions alive.
            </blockquote>
            <p className="testimonials-sample-byline">Swathi Vangala <span>Middlesbrough · 2026</span></p>
          </article>
          <article className="testimonials-sample-card testimonials-sample-card-learner">
            <p className="testimonial-sample-label">Student voice</p>
            <blockquote>
              I’ve been learning classical music with Praveena Srikailash for
              the past four years, and it’s been a joyful journey. Her patience,
              love and knowledge make learning special. The Annual Music Shows
              have helped me overcome stage nerves, and performing has built my
              confidence and given me lasting
              memories. I’m grateful to Praveena and Raagasudha for keeping our
              tradition alive in such an encouraging space.
            </blockquote>
            <p className="testimonials-sample-byline">Sreelekha Reddy <span>Sunderland · 2026</span></p>
          </article>
          <article className="testimonials-sample-card testimonials-sample-card-community">
            <p className="testimonial-sample-label">Parent voice</p>
            <blockquote>
              Joining Raaga Sudha with my daughters to learn devotional songs
              has given us so much more. The annual performances have built our
              confidence in singing and acting on stage. Praveena’s passion,
              patient guidance with Carnatic pronunciation, and engaging
              activities and stories make every class special. We love learning,
              making friends and performing together, and look forward to each
              session.
            </blockquote>
            <p className="testimonials-sample-byline">Sreelekha Koganti <span>Durham · 2026</span></p>
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
