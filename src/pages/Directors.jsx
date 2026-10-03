import { Link } from 'react-router-dom'

function Directors() {
    const directors = [
        {
            number: '01',
            name: 'Mr. Srikailash Venkitadri',
            role: 'Director',
            image: `${import.meta.env.BASE_URL}directors/srikailash-venkitadri.webp`,
            bio: `As a social entrepreneur, Mr. Venkitadri works to take music, particularly Indian music, into communities across the North East of England.

He teaches music through an after-school club at West Jesmond Primary School in Newcastle and is passionate about making Indian music accessible to people of different ages and abilities.

He is also interested in using music to connect with older members of the community and help address social isolation.`,
        },
        {
            number: '02',
            name: 'Mr. Arvind Kywalya',
            role: 'Director',
            image: `${import.meta.env.BASE_URL}directors/arvind-kywalya.webp`,
            bio: `Mr. Kywalya is training to become a chartered accountant in London and works for PwC, London. He is passionate about music and is also a performing artist, appearing on stages in London and India.

He has released music singles through his social media presence and is passionate about supporting and developing young artists in the North East through Raaga Sudha Music Academy.`,
        },
        {
            number: '03',
            name: 'Dr. Bijoysree Sengupta',
            role: 'Director',
            image: `${import.meta.env.BASE_URL}directors/bijoysree-sengupta.webp`,
            bio: `Dr. Sengupta is a retired Consultant in Gynecology and Obstetrics at NHS, UK. He was also the Chairman of the European Council of Gynecologists and Obstetricians and an Emeritus Professor in the same field. He has authored three books for MD students in Gynecology and Obstetrics.

He has a keen ear for music and a strong interest in the arts. He encouraged his daughters to develop their artistic interests through piano and singing and is passionate about encouraging arts and music among young people in the North East.

As a registered disabled person, he is particularly committed to ensuring that Raaga Sudha includes artists with disabilities in its performances.`,
        },
    ]

    return (
        <>
            <section className="directors-hero">
                <div className="directors-hero-inner">
                    <p className="eyebrow">Our leadership</p>

                    <h1>
                        The people behind
                        <span>Raaga Sudha.</span>
                    </h1>

                    <p>
                        Meet the directors who help guide Raaga Sudha Music Academy
                        and its work in the community.
                    </p>
                </div>
            </section>

            <section className="directors-intro section">
                <p className="eyebrow">Our Directors</p>

                <h2>
                    Supporting music, creativity
                    <span>and community.</span>
                </h2>

                <p>
                    Raaga Sudha is guided by directors who bring together
                    professional experience, a passion for music and a commitment
                    to the wider community.
                </p>
            </section>

            <section className="directors-list section">
                {directors.map((director) => (
                    <article className="director-card" key={director.name}>
                        <div className="director-number">
                            {director.number}
                        </div>

                        <div className="director-photo">
                            <img
                                src={director.image}
                                alt={director.name}
                            />
                        </div>

                        <div className="director-content">
                            <p className="eyebrow">{director.role}</p>

                            <h2>{director.name}</h2>

                            {director.bio.split('\n\n').map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </article>
                ))}
            </section>

            <section className="directors-cta section">
                <p className="eyebrow">Good governance</p>

                <h2>Learn how Raaga Sudha is governed.</h2>

                <Link className="button" to="/governance">
                    Explore Governance
                </Link>
            </section>
        </>
    )
}

export default Directors