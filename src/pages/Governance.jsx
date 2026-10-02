const documents = [
    {
        number: '01',
        title: 'Child Safeguarding Policy',
        description:
            'Our policy for protecting children and young people who participate in Raaga Sudha activities.',
        file: '/governance/ChildSafeguarding.pdf',
        tone: 'blue',
    },
    {
        number: '02',
        title: 'Adult Safeguarding Policy',
        description:
            'Our strategy and procedures for safeguarding adults at risk who access Raaga Sudha services.',
        file: '/governance/AdultSafeguarding.pdf',
        tone: 'peach',
    },
    {
        number: '03',
        title: 'Equality, Diversity & Inclusion',
        description:
            'Our commitment to equality, diversity, dignity and respect for everyone involved with Raaga Sudha.',
        file: '/governance/EqualityDiversityInclusion.pdf',
        tone: 'mint',
    },
    {
        number: '04',
        title: 'Data Protection Policy',
        description:
            'Information about how Raaga Sudha protects and handles personal information.',
        file: '/governance/DataProtection.pdf',
        tone: 'blue',
    },
    {
        number: '05',
        title: 'Articles of Association',
        description:
            'The governing document setting out the structure, responsibilities and operation of Raaga Sudha Music Academy CIC.',
        file: '/governance/ArticlesOfAssociation.pdf',
        tone: 'peach',
    },
    {
        number: '06',
        title: 'Form CIC36',
        description:
            'The community interest statement describing the community benefit activities of Raaga Sudha.',
        file: '/governance/CIC36.pdf',
        tone: 'mint',
    },
    {
        number: '07',
        title: 'Business Plan',
        description:
            `The organisation's business plan and approach to developing its activities and community work.`,
        file: '/governance/BusinessPlan.pdf',
        tone: 'blue',
    },
]

function Governance() {
    return (
        <>
            <section className="governance-hero">
                <div className="governance-hero-inner">
                    <p className="eyebrow">Governance & policies</p>

                    <h1>
                        Open, responsible
                        <span>and community focused.</span>
                    </h1>

                    <p>
                        Our policies and governing documents explain how Raaga Sudha
                        supports its students, staff, volunteers and wider community.
                    </p>
                </div>
            </section>

            <section className="governance-intro section">
                <div>
                    <p className="eyebrow">Our commitment</p>

                    <h2>
                        Creating a safe,
                        <span>inclusive environment.</span>
                    </h2>
                </div>

                <div className="governance-intro-copy">
                    <p>
                        Raaga Sudha is committed to safeguarding children, young
                        people and adults at risk, while promoting equality,
                        diversity and inclusion across its activities.
                    </p>

                    <p>
                        Our policies and organisational documents are available
                        below for transparency and reference.
                    </p>
                </div>
            </section>

            <section className="safeguarding-highlight">
                <div className="safeguarding-highlight-inner">
                    <div>
                        <p className="eyebrow">Safeguarding</p>

                        <h2>
                            Everyone has a role
                            <span>in keeping people safe.</span>
                        </h2>
                    </div>

                    <div>
                        <p>
                            Raaga Sudha takes safeguarding responsibilities seriously
                            and has designated safeguarding roles for children,
                            young people and adults at risk.
                        </p>

                        <div className="safeguarding-roles">
                            <div>
                                <strong>Designated Safeguarding Officer</strong>
                                <span>Srikailash Venkitadri</span>
                            </div>

                            <div>
                                <strong>Deputy Safeguarding Officer</strong>
                                <span>Praveena Srikantan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="governance-documents section">
                <div className="governance-documents-heading">
                    <p className="eyebrow">Policies & documents</p>

                    <h2>Our documents.</h2>

                    <p>
                        Read or download the documents that describe our policies,
                        responsibilities and organisational framework.
                    </p>
                </div>

                <div className="governance-document-grid">
                    {documents.map((document) => (
                        <article
                            className={`governance-document-card ${document.tone}`}
                            key={document.title}
                        >
                            <span>{document.number}</span>

                            <h3>{document.title}</h3>

                            <p>{document.description}</p>

                            <a
                                href={document.file}
                                target="_blank"
                                rel="noreferrer"
                            >
                                View document →
                            </a>
                        </article>
                    ))}
                </div>
            </section>

            <section className="governance-directors section">
                <div>
                    <p className="eyebrow">Leadership</p>

                    <h2>Want to know who's behind the organisation?</h2>
                </div>

                <a className="button" href="/directors">
                    Meet Our Directors
                </a>
            </section>
        </>
    )
}

export default Governance