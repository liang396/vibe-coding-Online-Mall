export default function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="section-title">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
