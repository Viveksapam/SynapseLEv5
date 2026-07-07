import { FrontendIcon, CssIcon, BackendIcon, LxdIcon, StateIcon, IntegrationIcon } from './skillIcons';

export const arrSkillsData = [
  {
    strId: 'frontend',
    strTitle: 'Frontend Architecture & React',
    icon: FrontendIcon,
    strThemeColor: '#2563eb',
    strThemeLight: '#eff6ff',
    strShortDesc: 'Building scalable, modular web applications with modern state management.',
    arrMicroSkills: [
      'React modular component design & custom hooks',
      'Advanced state management (Redux Toolkit, Context API)',
      'Performance optimization (Code splitting, Memoization)',
    ],
    objDetails: {
      strAnimations: 'Framer Motion for layout transitions, GSAP for complex timeline orchestrations.',
      strThreeD: 'Three.js integrated via React Three Fiber for interactive canvas backgrounds.',
      arrBooksCerts: [
        'Egghead.io - Advanced React Component Patterns',
        'Book: "Eloquent JavaScript" by Marijn Haverbeke',
        'Meta Front-End Developer Professional Certificate',
      ],
      strDebugStory: 'CSS Problem Solving: Deep mastery of Chrome DevTools. Inspecting elements, debugging box-models, and testing flexbox layers.',
    },
  },
  {
    strId: 'css',
    strTitle: 'UI Engineering & Styling',
    icon: CssIcon,
    strThemeColor: '#7c3aed',
    strThemeLight: '#f5f3ff',
    strShortDesc: 'Crafting responsive, pixel-perfect user interfaces with a focus on maintainability.',
    arrMicroSkills: [
      'Tailwind CSS configuration & design tokens',
      'CSS Modules & BEM methodology for scoping',
      'Responsive layouts using CSS Grid & Flexbox layouts',
    ],
    objDetails: {
      strAnimations: 'Keyframe UI micro-interactions, CSS-only hardware-accelerated transitions.',
      strThreeD: 'CSS 3D transforms (perspective, rotate3d) for lightweight UI card flips.',
      arrBooksCerts: [
        'CSS for JS Developers - Josh W. Comeau',
        'Book: "Designing User Interfaces" by Michal Malewicz',
      ],
      strDebugStory: 'Structural Integrity: Using strict naming conventions and component-driven styles to eliminate global CSS pollution.',
    },
  },
  {
    strId: 'backend',
    strTitle: 'Backend Development & FastAPI',
    icon: BackendIcon,
    strThemeColor: '#059669',
    strThemeLight: '#ecfdf5',
    strShortDesc: 'Developing robust API services and managing database schemas.',
    arrMicroSkills: [
      'FastAPI REST Framework implementation',
      'JWT Authentication & token handling',
      'SQLite & PostgreSQL database management',
    ],
    objDetails: {
      strAnimations: 'N/A (API responses only)',
      strThreeD: 'N/A',
      arrBooksCerts: [
        'FastAPI for Professionals - William S. Vincent',
        'DRF Documentation and Best Practices',
      ],
      strDebugStory: 'Debugging Database Queries: Resolving N+1 query problems in DRF using select_related and prefetch_related optimizations.',
    },
  },
  {
    strId: 'lxd',
    strTitle: 'Learning Experience Design',
    icon: LxdIcon,
    strThemeColor: '#e11d48',
    strThemeLight: '#fff1f2',
    strShortDesc: 'Applying instructional design methods to build effective educational software.',
    arrMicroSkills: ['Cognitive load theory application', 'Scaffolding & feedback loops', 'User educational testing'],
    objDetails: {
      strAnimations: 'Animated feedback alerts for user responses.',
      strThreeD: 'Spatial mental models visual representation.',
      arrBooksCerts: ['Design for How People Learn - Julie Dirksen', 'Cognitive Load Theory - John Sweller'],
      strDebugStory: 'Reducing Friction: Analyzing user drop-off during onboarding steps to simplify and chunk the cognitive requirements.',
    },
  },
  {
    strId: 'state',
    strTitle: 'State Management',
    icon: StateIcon,
    strThemeColor: '#d97706',
    strThemeLight: '#fffbeb',
    strShortDesc: 'Managing global app states cleanly and predictably across render layers.',
    arrMicroSkills: ['Redux Toolkit slices & thunks', 'Zustand lightweight stores', 'Context API for scoping'],
    objDetails: {
      strAnimations: 'Render triggers and store event notifications.',
      strThreeD: 'Syncing state data parameters with canvas rendering loops.',
      arrBooksCerts: ['Redux Best Practices and Architecture Guides', 'React Hooks in Action - John Larsen'],
      strDebugStory: 'Tracking State Updates: Identifying performance bottlenecks caused by excessive component re-renders from un-memoized selectors.',
    },
  },
  {
    strId: 'integration',
    strTitle: 'APIs & Data Syncing',
    icon: IntegrationIcon,
    strThemeColor: '#0891b2',
    strThemeLight: '#ecfeff',
    strShortDesc: 'Establishing clean, real-time channels between React clients and server backend APIs.',
    arrMicroSkills: [
      'Fetch API and error handling modules',
      'WebSocket integrations for live feeds',
      'API query serialization policies',
    ],
    objDetails: {
      strAnimations: 'Real-time loading transitions and skeleton structures.',
      strThreeD: 'N/A',
      arrBooksCerts: [
        'RESTful API Design Rules - Mark Masse',
        'Designing Data-Intensive Applications - Martin Kleppmann',
      ],
      strDebugStory: 'Resolving Sync Issues: Building network reconnection strategies using exponential backoff to handle dynamic disconnection states.',
    },
  },
];

export const arrMarqueeSkills = [...arrSkillsData, ...arrSkillsData];
