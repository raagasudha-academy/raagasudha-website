function SectionHeading({ eyebrow, title, text, centered = false }) {
    return (
        <div className={`section-heading ${centered ? 'centered' : ''}`}>
            <div>
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <h2>{title}</h2>
            </div>

            {text && <p className="section-heading-text">{text}</p>}
        </div>
    )
}

export default SectionHeading