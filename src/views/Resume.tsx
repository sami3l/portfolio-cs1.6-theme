import { portfolio } from '../data/portfolio';
import { asset, formatPeriod, prettyUrl } from '../utils/format';

/** Plain, printable one-page version of the same content, for readers who want no game. */
export function Resume() {
  const { profile, contact, experience, projects, skills } = portfolio;
  const work = experience.filter((e) => e.team === 'ct');
  const education = experience.filter((e) => e.team === 't');

  return (
    <div className="resume">
      <nav className="resume__nav">
        <a href="#">← Back to the game</a>
        <span className="resume__downloads">
          {contact.resumes.map((r) => (
            <a key={r.lang} href={asset(r.href)} download={r.filename}>
              Download CV ({r.label})
            </a>
          ))}
        </span>
      </nav>

      <main>
        <header className="resume__header">
          <h1>{profile.name}</h1>
          <p className="resume__title">{profile.title}</p>
          <p className="resume__contact">
            {profile.location} · <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.phone && <> · {contact.phone}</>}
            {contact.github && (
              <>
                {' · '}
                <a href={contact.github}>{prettyUrl(contact.github)}</a>
              </>
            )}
            {contact.linkedin && (
              <>
                {' · '}
                <a href={contact.linkedin}>{prettyUrl(contact.linkedin)}</a>
              </>
            )}
          </p>
        </header>

        <section>
          {profile.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        <section>
          <h2>Experience</h2>
          {work.map((e) => (
            <article key={e.id} className="resume__entry">
              <h3>
                {e.title} <span>· {e.org}</span>
              </h3>
              <p className="resume__meta">{formatPeriod(e)}</p>
              <ul>
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              {e.stack && <p className="resume__meta">{e.stack.join(', ')}</p>}
            </article>
          ))}
        </section>

        <section>
          <h2>Projects</h2>
          {projects.map((p) => (
            <article key={p.id} className="resume__entry">
              <h3>
                {p.name} <span>· {[p.org, p.year].filter(Boolean).join(', ')}</span>
              </h3>
              <p>{p.summary}.</p>
              <p className="resume__meta">{p.stack.join(', ')}</p>
            </article>
          ))}
        </section>

        <section>
          <h2>Education</h2>
          {education.map((e) => (
            <article key={e.id} className="resume__entry">
              <h3>
                {e.title} <span>· {e.org}</span>
              </h3>
              <p className="resume__meta">{formatPeriod(e)}</p>
              {e.highlights.map((h) => (
                <p key={h}>{h}</p>
              ))}
            </article>
          ))}
        </section>

        <section>
          <h2>Skills</h2>
          <dl className="resume__skills">
            {skills.map((c) => (
              <div key={c.label}>
                <dt>{c.label}</dt>
                <dd>{c.skills.map((s) => s.name).join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="resume__columns">
          <div>
            <h2>Certifications</h2>
            <ul>
              {profile.certifications.map((c) => (
                <li key={c.name}>
                  {c.name}
                  {c.issuer && `, ${c.issuer}`}
                  {c.inProgress && ' (in progress)'}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Languages</h2>
            <ul>
              {profile.languages.map((l) => (
                <li key={l.name}>
                  {l.name}: {l.level}
                </li>
              ))}
            </ul>
            <h2>Interests</h2>
            <p>{profile.interests.join(', ')}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
