// Hardcoded homepage project cards (was fetched from GET /api/project/).
// Kept in the same shape as ProjectModel/fetchProjectList so this can be swapped
// back to the live fetch later without touching ProjectsDirectory.
export const projectsData = [
  {
    id: 1,
    strName: 'Verisphere',
    strDescription: 'Social media where everyday posts and verified discussion exist side by side.',
    strTechStack: 'React,Django,PostgreSQL',
    strLiveUrl: null,
    strGithubUrl: 'https://github.com/Viveksapam',
    strImageUrl: 'https://res.cloudinary.com/ycw7kcyb/image/upload/v1786479345/synapse/qvata9bv6tai6xjexe2y.png',
    boolIsFeatured: true,
    strKickerLabel: 'TRUST-BASED DISCOURSE',
    strCtaText: 'Experience Verisphere',
    strCtaRoute: '/verisphere',
  },
  {
    id: 2,
    strName: 'Credential Assessment System',
    strDescription: 'CBE based proctored examination service.',
    strTechStack: 'React,django,postgresql',
    strLiveUrl: null,
    strGithubUrl: 'https://github.com/Viveksapam',
    strImageUrl: 'https://res.cloudinary.com/ycw7kcyb/image/upload/v1786481402/synapse/qlcgtrdbgtzvt6gx7tea.png',
    boolIsFeatured: true,
    strKickerLabel: 'VERIFIABLE LEARNING',
    strCtaText: 'Open CAS',
    strCtaRoute: '/credentials',
  },
  {
    id: 3,
    strName: 'Classroom',
    strDescription: 'An interactive learning space with AI powered features.',
    strTechStack: 'React, Django, PostgreSQL',
    strLiveUrl: null,
    strGithubUrl: 'https://github.com/Viveksapam',
    strImageUrl: 'https://res.cloudinary.com/ycw7kcyb/image/upload/v1786479380/synapse/eos5qooqug6m6tnsvhck.png',
    boolIsFeatured: true,
    strKickerLabel: 'CLASSROOM',
    strCtaText: 'Open Classroom',
    strCtaRoute: '/sle',
  },
];
