export type Level = 1 | 2 | 3 | 4 | 5;

export interface Profile {
  name: string;
  /** In-game nickname shown in window titles and on the scoreboard. */
  nickname: string;
  title: string;
  location: string;
  /** Path under /public, e.g. "avatar.jpg". Initials are shown when missing. */
  avatar?: string;
  /** One-liner shown under the name on the main menu. */
  tagline: string;
  bio: string[];
  languages: { name: string; level: string }[];
  certifications: { name: string; issuer?: string; inProgress?: boolean }[];
  interests: string[];
}

export type ProjectCategory = 'work' | 'academic' | 'side';

export interface Project {
  /** Used in URLs (#projects/<id>) and by the console's `connect <id>`. Lowercase, no spaces. */
  id: string;
  name: string;
  summary: string;
  description: string[];
  /** The first entry becomes the "map" name, e.g. Kubernetes → de_kubernetes. */
  stack: string[];
  role: string;
  /** Company or school the project was built for. */
  org?: string;
  teamSize?: number;
  year?: number;
  category: ProjectCategory;
  featured?: boolean;
  repo?: string;
  live?: string;
  /** Paths under /public, e.g. "projects/foo.png". */
  images?: string[];
}

export interface Skill {
  name: string;
  /** Optional self-rating, 1 Novice → 5 Expert. Without it the buy menu shows where the skill was used. */
  level?: Level;
  note?: string;
}

export interface SkillCategory {
  /** CS buy-menu slot shown next to the real label, e.g. "Pistols". */
  slot: string;
  label: string;
  skills: Skill[];
}

export interface Experience {
  id: string;
  /** "ct" rows are work experience, "t" rows are education. */
  team: 'ct' | 't';
  title: string;
  org: string;
  /** "YYYY-MM" or "YYYY". */
  start: string;
  /** Omit for "Present". */
  end?: string;
  location?: string;
  highlights: string[];
  stack?: string[];
}

export interface ResumeFile {
  lang: string;
  label: string;
  /** Path under /public, e.g. "resume/english_version.pdf". */
  href: string;
  /** File name the browser saves it as. */
  filename: string;
}

export interface Contact {
  email: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  resumes: ResumeFile[];
}

export interface Portfolio {
  profile: Profile;
  projects: Project[];
  skills: SkillCategory[];
  experience: Experience[];
  contact: Contact;
}
