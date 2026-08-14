import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  Check,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Menu,
  Network,
  Server,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const VIDEO_A =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4';
const VIDEO_B =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4';

const SPOTLIGHT_R = 260;
const email = 'shuainicolo8@gmail.com';
const portfolioUrl = 'https://shuai678.github.io/portfolio';
const githubUrl = 'https://github.com/Shuai678';
const linkedinUrl = 'https://www.linkedin.com/in/nicol%C3%B2-shuai-b912a536b/';
const deadlinePilotUrl = 'https://deadlinepilot-seven.vercel.app/';
const mustUrl = 'https://must.cargoway.cloud/';
const liarsBarUrl = 'https://github.com/Shuai678/liars-bar-online';
const itineraryUrl = 'https://itinerari-memoria.github.io';
const easeOut = [0.16, 1, 0.3, 1] as const;

const navLinks = [
  { label: 'About', href: '#about', id: 'about' },
  { label: 'Experience', href: '#foundation', id: 'foundation' },
  { label: 'Projects', href: '#projects', id: 'projects' },
  { label: 'Skills', href: '#toolkit', id: 'toolkit' },
  { label: 'Contact', href: '#contact', id: 'contact' },
] as const;

const lightSectionIds = ['foundation', 'toolkit'] as const;

const schematicLabels = [
  { text: 'C++', className: 'left-[12%] top-[18%]' },
  { text: 'Go', className: 'right-[18%] top-[16%]' },
  { text: 'TCP/IP', className: 'left-[20%] top-[42%]' },
  { text: 'goroutines', className: 'right-[28%] top-[38%]' },
  { text: 'Next.js', className: 'left-[9%] bottom-[28%]' },
  { text: 'JSON/CSV', className: 'right-[16%] bottom-[26%]' },
  { text: 'client-server', className: 'left-[37%] bottom-[16%]' },
  { text: 'REST', className: 'right-[39%] top-[66%]' },
  { text: 'C#', className: 'left-[46%] top-[26%]' },
] as const;

const facts: Array<{ title: string; value: string; icon: LucideIcon }> = [
  { title: 'Based in', value: 'Dalmine (BG), Italy', icon: MapPin },
  { title: 'Languages', value: 'Italian & Chinese (native), English (B2)', icon: Languages },
  { title: 'First industrial code', value: 'shipped at W&H Sterilization, 2025', icon: Briefcase },
  { title: 'Elsewhere', value: 'github.com/Shuai678 · linkedin.com/in/nicolò-shuai', icon: ExternalLink },
];

const timelineEntries = [
  {
    title: 'ITIS Pietro Paleocapa',
    meta: 'Bergamo · 2021-present',
    body:
      'Computer science diploma track (perito informatico, in progress): software development, web development, systems & networks, client-server architectures, TCP/IP protocols, C++, Industry 4.0.',
    icon: GraduationCap,
  },
  {
    title: 'W&H Sterilization',
    meta: 'C++ Developer Intern (school-work program) · June 2025',
    body:
      'Real industrial development environment: built software monitoring the instrument-calibration process; parsed structured JSON and CSV data; designed CLI tools for technical operators; organized files and tracked production processes; wrote maintainable, documented, reliable C++.',
    icon: Briefcase,
  },
] as const;

type Project = {
  name: string;
  statement: string;
  meta: string;
  bullets: readonly string[];
  stack: readonly string[];
  mono: string;
  hue: string;
  useVideo?: boolean;
  link?: string;
};

const projects = [
  {
    name: 'DeadlinePilot',
    statement: 'Turns a pile of PDFs into a study plan.',
    meta: 'AI study-planning platform, 2025-present',
    bullets: [
      'NLP-driven automatic planning from uploaded PDF/Markdown.',
      'Splits material into tasks by knowledge level and resolves calendar conflicts.',
      'Syncs with Google Calendar and Outlook.',
    ],
    stack: ['TypeScript', 'Next.js', 'Google Calendar API'],
    mono: 'DP',
    hue: '#E8702A',
    useVideo: true,
    link: deadlinePilotUrl,
  },
  {
    name: "Liar's Bar Online",
    statement: 'Keeping state honest when every player is lying.',
    meta: 'Real-time distributed multiplayer system, 2026',
    bullets: [
      'Game logic with real-time state synchronization over a TCP client-server architecture.',
      'Concurrency handled with goroutines and mutexes.',
    ],
    stack: ['Go', 'TCP', 'concurrency'],
    mono: 'LB',
    hue: '#4E9AF1',
    link: liarsBarUrl,
  },
  {
    name: 'MUST',
    statement: 'Teaching STEM inside the metaverse.',
    meta: 'Metaverse Use in STEM Teaching, 2025-2026',
    bullets: [
      'Developing immersive, AI-supported teaching methodologies for STEM subjects.',
      'Collaboration across schools in multiple countries.',
      'Work inside an international multidisciplinary team.',
    ],
    stack: ['AI', 'immersive tech', 'collaboration'],
    mono: 'M',
    hue: '#8B6EF6',
    link: mustUrl,
  },
  {
    name: 'Itinerari della Memoria',
    statement: 'Software in service of memory.',
    meta: 'Historical documentation website, 2025-2026',
    bullets: [
      'Built with the Municipality of Bergamo.',
      'Documents nazi-fascist-period sites in the Bergamo area.',
      'Manages historical content, archival sources, and image-usage rights.',
    ],
    stack: ['Web', 'content & archival management'],
    mono: 'IM',
    hue: '#2E9D78',
    link: itineraryUrl,
  },
] as const satisfies readonly Project[];

const skillGroups = [
  { title: 'Languages', skills: ['C++', 'C#', 'Go', 'JavaScript/TypeScript', 'SQL'], icon: Code2 },
  { title: 'Web & Frameworks', skills: ['Next.js', 'React', 'Node.js', 'HTML/CSS'], icon: Server },
  { title: 'Networking & Systems', skills: ['TCP/IP', 'VPN', 'VLAN', 'REST APIs'], icon: Network },
  { title: 'Tools', skills: ['Git', 'GitHub', 'Linux', 'CLI', 'JSON/CSV'], icon: Cpu },
] as const;

const contactTopics = ['Internship', 'Project collaboration', 'School / research', 'Just saying hi'] as const;
type ContactTopic = (typeof contactTopics)[number];

function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white/90 antialiased selection:bg-[#E8702A]/25">
      <Navigation />
      <main>
        <Hero />
        <About />
        <Foundation />
        <FilmTransition />
        <Projects />
        <Toolkit />
        <Direction />
        <Contact />
      </main>
    </div>
  );
}

function Navigation() {
  const [open, setOpen] = useState(false);
  const navIds = useMemo(() => navLinks.map((link) => link.id), []);
  const activeSection = useActiveSection(navIds);
  const lightNav = useLightNav(lightSectionIds);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.2 });

  const glassClass = lightNav ? 'liquid-glass-dark' : 'liquid-glass';

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <motion.div
        className="fixed left-0 top-0 z-[120] h-[2px] w-full origin-left bg-[#E8702A]"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />

      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[95] h-28 bg-gradient-to-b from-black/55 to-transparent transition-opacity duration-300 ${
          lightNav ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      <header
        className={`fixed left-0 right-0 top-0 z-[100] px-5 py-4 transition-colors duration-300 sm:px-8 sm:py-5 ${
          lightNav ? 'text-[#111]' : 'text-white'
        }`}
      >
        <nav className="flex items-center justify-between" aria-label="Primary navigation">
          <a href="#top" className="group flex items-center gap-3 focus-ring" aria-label="Nicolò Shuai home">
            <span className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold tracking-[0.2em] ${lightNav ? 'border-black/25' : 'border-white/35'}`}>NS</span>
            <span className="text-[21px] tracking-tight lg:text-[26px]">
              Nicolò <span className="font-playfair italic">Shuai</span>
            </span>
          </a>

          <div className={`${glassClass} !absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full px-1 py-1.5 md:flex lg:px-2 lg:py-2`}>
            {navLinks.map((link) => {
              const active = activeSection === link.id;
              const activeClass = lightNav ? 'bg-black/10 text-[#111]' : 'bg-white/25 text-white';
              const idleClass = lightNav
                ? 'text-black/55 hover:bg-black/10 hover:text-black'
                : 'text-white/75 hover:bg-white/20 hover:text-white';
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-2.5 py-1.5 text-xs transition-colors duration-200 focus-ring lg:px-4 lg:text-sm ${
                    active ? activeClass : idleClass
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <a
            href="#contact"
            className={`${glassClass} hidden rounded-full px-5 py-2 text-sm font-semibold hover:scale-[1.03] focus-ring md:inline-flex ${
              lightNav ? 'text-[#111]' : 'text-white'
            }`}
          >
            Get in touch
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            className={`${glassClass} relative h-11 w-11 rounded-full focus-ring md:hidden`}
          >
            <span
              className={`absolute left-1/2 top-[15px] h-[2px] w-6 -translate-x-1/2 transition duration-300 ${lightNav ? 'bg-[#111]' : 'bg-white'} ${
                open ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-1/2 top-[22px] h-[2px] w-6 -translate-x-1/2 transition duration-300 ${lightNav ? 'bg-[#111]' : 'bg-white'} ${open ? 'opacity-0' : ''}`}
            />
            <span
              className={`absolute left-1/2 top-[29px] h-[2px] w-6 -translate-x-1/2 transition duration-300 ${lightNav ? 'bg-[#111]' : 'bg-white'} ${
                open ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-8 bg-black/95 px-8 text-center text-white backdrop-blur-sm md:hidden"
            initial={{ opacity: 0, pointerEvents: 'none' }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.25, ease: easeOut }}
          >
            {navLinks.map((link, index) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-[32px] font-semibold leading-none tracking-tight focus-ring"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: easeOut }}
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const schematicRef = useRef<HTMLDivElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const [heroVideoReadyToken, setHeroVideoReadyToken] = useState(0);
  const isDesktopPointer = useMediaQuery('(min-width: 1024px) and (pointer: fine)');
  const reducedMotion = useReducedMotion();
  const scrubHeroVideo = !reducedMotion;
  const heroAutoplays = !isDesktopPointer || !scrubHeroVideo;
  useMouseScrub(heroVideoRef, scrubHeroVideo, heroVideoReadyToken, {
    initialProgress: isDesktopPointer ? 0 : 0.38,
    listenOnWindow: isDesktopPointer,
    minSeekInterval: isDesktopPointer ? 90 : 120,
    pauseOnReady: isDesktopPointer,
    sensitivity: isDesktopPointer ? 0.8 : 0.65,
    touchTargetRef: sectionRef,
    useFastSeek: isDesktopPointer,
  });

  useCanvasSpotlight(sectionRef, schematicRef, !reducedMotion, { initialVisible: isDesktopPointer });

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative h-screen touch-pan-y overflow-hidden overscroll-x-contain bg-[#0A0A0B]"
      style={{ height: '100dvh' }}
    >
      <div className="hero-zoom absolute inset-0 z-0" aria-hidden="true">
          <ViewportVideo
            refObject={heroVideoRef}
            src={VIDEO_A}
            autoPlay={heroAutoplays}
            loop={heroAutoplays}
            preload="auto"
            className="h-full w-full"
            videoClassName="object-[70%_center]"
            onVideoMounted={() => setHeroVideoReadyToken((value) => value + 1)}
          />
      </div>
      <div className="absolute inset-0 z-10 bg-black/30" aria-hidden="true" />

      {!reducedMotion && (
        <div ref={schematicRef} className="hero-schematic-layer blueprint-grid pointer-events-none absolute inset-0 z-20 bg-[#0A0A0B]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,rgba(232,112,42,0.13),transparent_28%)]" />
          {schematicLabels.map((label) => (
            <span
              key={label.text}
              className={`hero-schematic-label absolute ${label.className} rounded-full border border-white/15 bg-black/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70`}
            >
              {label.text}
            </span>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-[14%] z-50 px-5 text-center sm:px-8">
        <p className="hero-anim hero-reveal mx-auto mb-4 font-mono text-xs uppercase tracking-[0.2em] text-white/50 [animation-delay:100ms]">
          00 — Hero
        </p>
        <p className="hero-anim hero-reveal mx-auto max-w-4xl text-xs uppercase tracking-[0.25em] text-white/70 sm:text-sm [animation-delay:150ms]">
          NICOLÒ SHUAI — CS STUDENT · C++ / C# / GO DEVELOPER
        </p>
        <h1 className="mx-auto mt-5 max-w-6xl text-white" aria-label="Software that holds under pressure.">
          <span className="hero-anim hero-reveal block font-playfair text-5xl italic leading-[0.95] sm:text-7xl lg:text-8xl [animation-delay:250ms]">
            Software that holds
          </span>
          <span className="hero-anim hero-reveal block text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl lg:text-8xl [animation-delay:420ms]">
            under pressure.
          </span>
        </h1>
      </div>

      <p className="hero-anim hero-fade pointer-events-none absolute inset-x-5 top-[62%] z-50 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 [animation-delay:900ms] sm:hidden">
        swipe sideways — scan the stack
      </p>

      <p className="hero-anim hero-fade absolute bottom-14 left-10 z-50 hidden max-w-[280px] text-sm leading-relaxed text-white/80 [animation-delay:700ms] sm:block">
        From industrial C++ on factory floors to real-time Go servers and AI-powered web apps — I build software meant to keep working.
      </p>

      <div className="hero-anim hero-fade absolute bottom-10 left-5 right-5 z-50 max-w-full text-sm leading-relaxed text-white/80 [animation-delay:850ms] sm:bottom-14 sm:left-auto sm:right-10 sm:max-w-[280px]">
        <p>Currently: incoming Automation Engineering student at Politecnico di Milano — open to internships and collaborations.</p>
        <a href="#projects" className="primary-pill pointer-events-auto mt-4 inline-flex">
          See the work <span aria-hidden="true">↓</span>
        </a>
      </div>

      <div className="absolute bottom-7 left-1/2 z-50 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/55 sm:flex">
        <span>scroll</span>
        <span className="scroll-cue-line h-10 w-px bg-white/40" />
      </div>
    </section>
  );
}

function About() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-15%' });
  const { displayed, done } = useTypewriter(
    'Computer science student in Bergamo, Italy. I write C++ where reliability matters, Go where many things happen at once, and TypeScript where people meet software.',
    38,
    600,
    inView,
  );

  return (
    <section id="about" ref={sectionRef} className="relative bg-[#0A0A0B] px-5 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ChapterLabel number="01" title="About" />
          <MaskedHeading
            segments={[
              { text: "Hi, I'm" },
              { text: 'Nicolò.', accent: true },
            ]}
            className="mt-5 text-5xl leading-[0.95] tracking-[-0.04em] text-white sm:text-7xl md:text-8xl"
          />
          <p className="mt-8 max-w-prose text-base leading-relaxed text-white/72">
            {displayed}
            {!done && inView && <span className="ml-1 inline-block h-[1.1em] w-[2px] translate-y-1 bg-white animate-blink" />}
          </p>
        </div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-15%' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {facts.map((fact) => {
            const Icon = fact.icon;
            return (
              <motion.article
                key={fact.title}
                variants={fadeUpVariant}
                transition={{ duration: 0.65, ease: easeOut }}
                className="rounded-2xl border border-white/10 p-6 transition-colors duration-200 hover:border-white/25"
              >
                <Icon className="h-5 w-5 text-[#E8702A]" aria-hidden="true" />
                <h3 className="mt-8 text-sm uppercase tracking-[0.16em] text-white/45">{fact.title}</h3>
                <p className="mt-3 break-words text-lg leading-snug text-white/88">{fact.value}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function Foundation() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 70%', 'end 35%'] });

  return (
    <section id="foundation" ref={sectionRef} className="relative bg-[#FAFAF8] text-[#111]">
      <div className="mx-auto grid max-w-7xl px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
        <div className="flex py-24 lg:sticky lg:top-0 lg:h-screen lg:items-center">
          <div>
            <ChapterLabel number="02" title="Foundation" light />
            <MaskedHeading
              segments={[
                { text: 'Where the' },
                { text: 'rigor', accent: true },
                { text: 'comes from.' },
              ]}
              className="mt-5 max-w-[9ch] text-5xl leading-[0.95] tracking-[-0.04em] text-[#111] sm:text-7xl md:text-8xl"
            />
          </div>
        </div>

        <div className="relative pb-28 pt-4 lg:py-32">
          <svg className="absolute left-[17px] top-24 hidden h-[calc(100%-12rem)] w-10 overflow-visible lg:block" aria-hidden="true" viewBox="0 0 40 900" preserveAspectRatio="none">
            <path d="M20 0 V900" stroke="rgba(17,17,17,0.12)" strokeWidth="2" />
            <motion.path
              d="M20 0 V900"
              stroke="#E8702A"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength: reducedMotion ? 1 : scrollYProgress }}
            />
          </svg>

          <div className="space-y-10 lg:pl-20">
            {timelineEntries.map((entry, index) => {
              const Icon = entry.icon;
              return (
                <Reveal key={entry.title} delay={index * 0.08}>
                  <article className="relative border-l border-black/10 pb-2 pl-7 lg:border-l-0 lg:pl-0">
                    <span className="absolute -left-[9px] top-1 grid h-4 w-4 place-items-center rounded-full bg-[#FAFAF8] ring-2 ring-[#E8702A] lg:-left-[67px] lg:h-5 lg:w-5" />
                    <div className="flex items-start gap-4">
                      <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-black/40">{entry.meta}</p>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#111]">{entry.title}</h3>
                        <p className="mt-5 max-w-prose text-base leading-relaxed text-black/68">{entry.body}</p>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}

            <Reveal delay={0.1}>
              <blockquote className="border-l-4 border-[#E8702A] bg-white px-6 py-6 text-xl leading-relaxed tracking-tight text-black shadow-[0_20px_70px_rgba(10,10,11,0.08)]">
                “Two weeks inside a real industrial codebase taught me more about writing code other people depend on than any exercise could.”
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilmTransition() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrubFrameRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReadyToken, setVideoReadyToken] = useState(0);
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.55, 1], [0.85, 0.95, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.65], ['24px', '0px']);
  const opacity = useTransform(scrollYProgress, [0, 0.16, 0.9], [0.7, 1, 1]);
  const scrubEnabled = !reducedMotion;
  const scrub = useMouseScrub(videoRef, scrubEnabled, videoReadyToken, {
    minSeekInterval: isDesktop ? 90 : 120,
    sensitivity: isDesktop ? 0.8 : 0.65,
    touchTargetRef: scrubFrameRef,
    useFastSeek: isDesktop,
  });

  return (
    <section id="film" ref={sectionRef} className="relative bg-[#0A0A0B]" style={{ height: isDesktop ? '250vh' : '130vh' }}>
      <div
        ref={scrubFrameRef}
        className="sticky top-0 flex h-screen touch-pan-y items-center justify-center overflow-hidden overscroll-x-contain"
        onMouseMove={scrub.onMouseMove}
        onMouseLeave={scrub.onMouseLeave}
      >
        <motion.div
          className="relative h-full w-full overflow-hidden bg-[#0A0A0B] [contain:paint]"
          style={reducedMotion ? undefined : { scale, borderRadius: radius, opacity }}
        >
          <ViewportVideo
            refObject={videoRef}
            src={VIDEO_B}
            autoPlay={!scrubEnabled || Boolean(reducedMotion)}
            loop
            preload="auto"
            className="h-full w-full"
            onVideoMounted={() => setVideoReadyToken((value) => value + 1)}
          />
          <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
          <div className="absolute left-5 top-24 sm:left-8 lg:left-10">
            <ChapterLabel number="03" title="Film Transition" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
            <MaskedHeading
              segments={[
                { text: 'Four projects. Four' },
                { text: 'different', accent: true },
                { text: 'problems.' },
              ]}
              className="max-w-6xl text-5xl leading-[1.02] tracking-normal text-white sm:text-7xl md:text-8xl"
            />
          </div>
          {isDesktop && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.18em] text-white/50">
              move your mouse — the film follows
            </p>
          )}
          {!isDesktop && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-white/50">
              swipe sideways — the film follows
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Projects() {
  return (
    <section id="projects" className="relative bg-[#0A0A0B] px-5 py-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ChapterLabel number="04" title="Projects" />
        <MaskedHeading
          segments={[
            { text: 'Built, shipped,' },
            { text: 'maintained', accent: true },
            { text: '.' },
          ]}
          className="mt-5 max-w-5xl text-5xl leading-[0.95] tracking-[-0.04em] text-white sm:text-7xl md:text-8xl"
        />
      </div>

      <div className="mx-auto mt-14 max-w-7xl lg:mt-24">
        {projects.map((project, index) => (
          <ProjectCard key={project.name} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const filter = useTransform(scrollYProgress, [0, 1], ['brightness(1)', 'brightness(0.75)']);

  return (
    <motion.article
      ref={cardRef}
      className="mb-8 grid min-h-[auto] overflow-hidden rounded-[28px] border border-white/10 bg-[#101012] shadow-[0_28px_120px_rgba(0,0,0,0.35)] lg:sticky lg:top-0 lg:mb-0 lg:min-h-[100svh] lg:grid-cols-2 lg:rounded-none"
      style={isDesktop && !reducedMotion ? { scale, filter } : undefined}
    >
      <div className="flex min-h-[520px] flex-col justify-center p-6 sm:p-10 lg:min-h-[100svh] lg:p-14">
        <p className="text-8xl font-semibold tracking-[-0.08em] text-white/15">{String(index + 1).padStart(2, '0')}</p>
        <p className="mt-10 font-playfair text-3xl italic leading-tight text-white sm:text-4xl">{project.statement}</p>
        <h3 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">{project.name}</h3>
        <p className="mt-5 max-w-prose text-sm uppercase tracking-[0.18em] text-white/45">{project.meta}</p>
        <ul className="mt-8 max-w-xl space-y-3 text-base leading-relaxed text-white/72">
          {project.bullets.map((bullet) => (
            <li key={bullet} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="mt-[0.72em] h-1.5 w-1.5 rounded-full bg-[#E8702A]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span key={tech} className="secondary-pill border-white/10 bg-white text-black">
              {tech}
            </span>
          ))}
        </div>
        {project.link && (
          <a href={project.link} target="_blank" rel="noreferrer" className="primary-pill mt-8 w-fit">
            Open project <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>

      <ProjectVisual project={project} />
    </motion.article>
  );
}

function ProjectVisual({ project }: { project: Project }) {
  if (project.useVideo) {
    return (
      <div className="relative min-h-[420px] overflow-hidden bg-black lg:min-h-[100svh]">
        <ViewportVideo src={VIDEO_B} autoPlay loop className="h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,10,11,0.18),rgba(10,10,11,0.72))]" aria-hidden="true" />
        <div className="absolute bottom-8 left-8 right-8 font-mono text-xs uppercase tracking-[0.22em] text-white/55">planning / parsing / calendar sync</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[420px] overflow-hidden bg-[#09090A] lg:min-h-[100svh]" style={{ '--project-hue': project.hue } as CSSProperties}>
      <div className="blueprint-grid absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_36%,color-mix(in_srgb,var(--project-hue)_42%,transparent),transparent_28%),radial-gradient(circle_at_20%_78%,rgba(255,255,255,0.08),transparent_34%)]" />
      <span className="absolute left-8 top-8 text-[120px] font-semibold leading-none tracking-[-0.12em] text-white/[0.09] sm:text-[180px] lg:left-12 lg:top-12 lg:text-[220px]">
        {project.mono}
      </span>
      <div className="absolute inset-x-10 bottom-12 h-px bg-white/20" />
      <div className="absolute bottom-12 left-10 h-28 w-px bg-white/20" />
      <div className="absolute bottom-24 left-10 right-16 h-px" style={{ background: `linear-gradient(90deg, ${project.hue}, transparent)` }} />
      <div className="absolute right-10 top-12 h-32 w-32 rounded-full border border-white/15" />
      <div className="absolute right-24 top-28 h-5 w-5 rounded-full" style={{ backgroundColor: project.hue }} />
      <div className="absolute bottom-10 right-10 font-mono text-xs uppercase tracking-[0.22em] text-white/50">{project.stack.join(' · ')}</div>
    </div>
  );
}

function Toolkit() {
  const marquee = 'C++ · C# · Go · TypeScript · SQL · Next.js · React · Node.js · TCP/IP · REST · Git · Linux ·';

  return (
    <section id="toolkit" className="bg-[#FAFAF8] text-[#111]">
      <div className="overflow-hidden bg-[#0A0A0B] py-4 text-white/60">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-mono text-xs uppercase tracking-[0.22em]">
          <span>{marquee}</span>
          <span>{marquee}</span>
          <span>{marquee}</span>
          <span>{marquee}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:px-10">
        <ChapterLabel number="05" title="Toolkit" light />
        <MaskedHeading
          segments={[
            { text: 'The' },
            { text: 'tools', accent: true },
            { text: 'I reach for.' },
          ]}
          className="mt-5 max-w-5xl text-5xl leading-[0.95] tracking-[-0.04em] text-[#111] sm:text-7xl md:text-8xl"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {skillGroups.map((group, groupIndex) => {
            const Icon = group.icon;
            return (
              <Reveal key={group.title} delay={groupIndex * 0.06}>
                <article className="h-full rounded-2xl border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(10,10,11,0.06)]">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-semibold tracking-tight">{group.title}</h3>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#111] text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {group.skills.map((skill, index) => (
                      <motion.span
                        key={skill}
                        className="secondary-pill"
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-15%' }}
                        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: index * 0.04 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Direction() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  // Apple-style: the headline is a window into video. It starts as a big, texture-filled
  // zoom (letters larger than the viewport) and scales down to a readable size — centered,
  // no lateral shift.
  const titleScale = useTransform(scrollYProgress, [0, 0.5], [2.15, 1]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const titleBlur = useTransform(scrollYProgress, [0, 0.16], ['blur(12px)', 'blur(0px)']);
  const eyebrowOpacity = useTransform(scrollYProgress, [0.02, 0.14], [0, 1]);
  const eyebrowY = useTransform(scrollYProgress, [0.02, 0.14], [12, 0]);
  const secondaryOpacity = useTransform(scrollYProgress, [0.48, 0.6, 0.94, 1], [0, 1, 1, 0]);
  const secondaryY = useTransform(scrollYProgress, [0.48, 0.6, 0.94, 1], [24, 0, 0, -8]);
  const bodyOpacity = useTransform(scrollYProgress, [0.68, 0.78, 0.94, 1], [0, 1, 1, 0]);
  const bodyY = useTransform(scrollYProgress, [0.68, 0.78, 0.94, 1], [18, 0, 0, -10]);
  const bodyBlur = useTransform(scrollYProgress, [0.68, 0.76, 0.94, 1], ['blur(6px)', 'blur(0px)', 'blur(0px)', 'blur(4px)']);
  const atmosphereOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 0.68, 0.35]);
  const atmosphereScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section id="direction" ref={sectionRef} className="relative h-[220vh] bg-[#0A0A0B] lg:h-[320vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-5 sm:px-8 lg:px-10">
        <motion.div
          className="direction-atmosphere absolute inset-0"
          style={reducedMotion ? undefined : { opacity: atmosphereOpacity, scale: atmosphereScale }}
          aria-hidden="true"
        />
        <div className="direction-grid absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="direction-stack relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center">
          <div className="absolute left-0 top-24 sm:top-28">
            <ChapterLabel number="06" title="Direction" />
          </div>

          <motion.p
            className="text-center text-sm font-semibold tracking-tight text-white sm:text-base"
            style={reducedMotion ? { opacity: 1, y: 0 } : { opacity: eyebrowOpacity, y: eyebrowY }}
          >
            Starting September 2026
          </motion.p>

          <h2 className="sr-only">From Code to Motion</h2>
          <div className="direction-title-shell flex w-full items-center justify-center">
            <motion.div
              className="direction-video-mask direction-title-window relative will-change-transform"
              style={
                reducedMotion
                  ? undefined
                  : { scale: titleScale, opacity: titleOpacity, filter: titleBlur }
              }
              aria-hidden="true"
            >
              <ViewportVideo
                src={VIDEO_B}
                autoPlay={!reducedMotion}
                loop
                className="absolute inset-0 h-full w-full"
                videoClassName="mix-blend-screen"
              />
            </motion.div>
          </div>

          <motion.p
            className="direction-degree mx-auto max-w-4xl text-center font-semibold tracking-tight text-white"
            style={reducedMotion ? { opacity: 1, y: 0 } : { opacity: secondaryOpacity, y: secondaryY }}
          >
            Automation Engineering <span className="direction-accent">at Politecnico di Milano</span>.
          </motion.p>

          <motion.p
            className="direction-copy mx-auto max-w-2xl text-center text-white/55"
            style={
              reducedMotion
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: bodyOpacity, y: bodyY, filter: bodyBlur }
            }
          >
            Building the bridge between software, machines, and intelligent systems. I come from an{' '}
            <span className="text-white">Informatics background</span>, where code was logic, systems, and shipped projects.
            The direction is clearer now: <span className="text-white">code controls something physical</span> —{' '}
            <span className="text-white">robots, sensors, motors</span>, data, control, and intelligent machines.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [selected, setSelected] = useState<ContactTopic[]>([]);
  const [copied, setCopied] = useState(false);

  const toggleTopic = (topic: ContactTopic) => {
    setSelected((current) => (current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]));
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const subject = encodeURIComponent(`Portfolio — ${selected.join(', ')}`);

  return (
    <footer id="contact" className="bg-[#0A0A0B] px-5 py-32 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ChapterLabel number="07" title="Contact" />
        <MaskedHeading
          segments={[
            { text: "Let's build" },
            { text: 'something', accent: true },
            { text: '.' },
          ]}
          className="mt-5 max-w-5xl text-5xl leading-[0.95] tracking-[-0.04em] text-white sm:text-7xl md:text-8xl"
        />
        <p className="mt-6 max-w-prose text-base leading-relaxed text-white/70">Open to internships, collaborations, and good conversations.</p>

        <div className="mt-10 flex flex-wrap gap-3" aria-label="Contact topics">
          {contactTopics.map((topic) => {
            const active = selected.includes(topic);
            return (
              <motion.button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                whileTap={{ scale: 0.96 }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-200 focus-ring ${
                  active
                    ? 'bg-[#E8702A] text-white shadow-md shadow-[#E8702A]/25'
                    : 'border border-white/15 bg-transparent text-white hover:bg-white/10'
                }`}
                aria-pressed={active}
              >
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {topic}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 min-h-[92px]">
          <AnimatePresence mode="wait">
            {selected.length === 0 ? (
              <motion.p
                key="empty"
                className="text-xs italic text-white/50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                Select one or more topics above.
              </motion.p>
            ) : (
              <motion.div
                key={selected.length}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              >
                <p className="text-sm leading-relaxed text-white/76">Ready to talk about: {selected.join(', ')}</p>
                <a href={`mailto:${email}?subject=${subject}`} className="primary-pill w-fit">
                  Write to me <Mail className="h-4 w-4" aria-hidden="true" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${email}`} className="text-lg font-semibold underline decoration-white/25 underline-offset-8 transition hover:text-white hover:decoration-[#E8702A]">
              {email}
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/80 focus-ring"
              aria-label="Copy email address"
            >
              {copied ? <Check className="h-4 w-4 text-[#E8702A]" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55">
            <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-white">
              GitHub
            </a>
            <span>·</span>
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-white">
              LinkedIn
            </a>
            <span>·</span>
            <a href={portfolioUrl} target="_blank" rel="noreferrer" className="hover:text-white">
              Portfolio
            </a>
            <span>·</span>
            <span>Dalmine (BG), Italy</span>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Shuai Zilong Nicolò</p>
          <a href="#top" className="liquid-glass rounded-full px-4 py-2 text-white/80 hover:text-white focus-ring">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function ViewportVideo({
  src,
  className,
  videoClassName,
  autoPlay,
  loop,
  preload = 'metadata',
  refObject,
  onVideoMounted,
}: {
  src: string;
  className?: string;
  videoClassName?: string;
  autoPlay: boolean;
  loop: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  refObject?: MutableRefObject<HTMLVideoElement | null>;
  onVideoMounted?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = refObject ?? fallbackRef;
  const notifiedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || mounted) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: '420px 0px' },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && autoPlay) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay, mounted, videoRef]);

  useEffect(() => {
    if (!mounted || !videoRef.current || notifiedRef.current) return;
    notifiedRef.current = true;
    onVideoMounted?.();
  }, [mounted, onVideoMounted, videoRef]);

  return (
    <div ref={wrapperRef} className={className}>
      {mounted && (
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${videoClassName ?? ''}`}
          src={src}
          muted
          playsInline
          preload={preload}
          loop={loop}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function MaskedHeading({ segments, className }: { segments: Array<{ text: string; accent?: boolean }>; className: string }) {
  const label = segments
    .map((segment) => segment.text)
    .join(' ')
    .replace(/\s+([.,])/g, '$1');
  const words = segments.flatMap((segment) =>
    segment.text.split(' ').map((word) => ({
      word,
      accent: segment.accent,
    })),
  );

  return (
    <motion.h2
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      aria-label={label}
    >
      {words.map(({ word, accent }, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-[0.08em]" aria-hidden="true">
          <motion.span
            className={`inline-block ${accent ? 'font-playfair italic' : ''}`}
            variants={{ hidden: { y: '100%' }, visible: { y: 0 } }}
            transition={{ duration: 0.72, ease: easeOut }}
          >
            {word}
            {index < words.length - 1 ? '\u00a0' : ''}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

function ChapterLabel({ number, title, light = false }: { number: string; title: string; light?: boolean }) {
  return (
    <p className={`font-mono text-xs uppercase tracking-[0.2em] ${light ? 'text-black/40' : 'text-white/50'}`}>
      {number} — {title}
    </p>
  );
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      variants={fadeUpVariant}
      transition={{ duration: 0.7, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function useTypewriter(text: string, speed = 38, startDelay = 600, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return undefined;
    if (reducedMotion) {
      setDisplayed(text);
      setDone(true);
      return undefined;
    }

    setDisplayed('');
    setDone(false);
    let interval = 0;
    const timeout = window.setTimeout(() => {
      let index = 0;
      interval = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [active, reducedMotion, speed, startDelay, text]);

  return { displayed, done };
}

function useCanvasSpotlight(
  sectionRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  options: { initialVisible?: boolean; radius?: number } = {},
) {
  useEffect(() => {
    const section = sectionRef.current;
    const layer = layerRef.current;
    if (!enabled || !section || !layer) return undefined;

    const radius = options.radius ?? SPOTLIGHT_R;
    const hiddenTarget = { x: -radius * 2, y: -radius * 2 };
    const target = options.initialVisible ?? true ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 } : { ...hiddenTarget };
    const smooth = { ...target };
    let active = options.initialVisible ?? true;
    let raf = 0;

    const applyMask = () => {
      const mask = `radial-gradient(circle ${radius}px at ${smooth.x}px ${smooth.y}px, #000 0%, #000 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`;
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
      layer.style.maskSize = '100% 100%';
      layer.style.webkitMaskSize = '100% 100%';
      layer.style.maskRepeat = 'no-repeat';
      layer.style.webkitMaskRepeat = 'no-repeat';
      layer.style.setProperty('--spotlight-x', `${smooth.x}px`);
      layer.style.setProperty('--spotlight-y', `${smooth.y}px`);
      layer.style.setProperty('--spotlight-ui-opacity', active ? '1' : '0');
    };

    const draw = () => {
      smooth.x += (target.x - smooth.x) * 0.1;
      smooth.y += (target.y - smooth.y) * 0.1;
      applyMask();
      raf = window.requestAnimationFrame(draw);
    };

    const setTarget = (clientX: number, clientY: number) => {
      const rect = section.getBoundingClientRect();
      target.x = clientX - rect.left;
      target.y = clientY - rect.top;
      active = true;
    };

    const move = (event: MouseEvent) => {
      setTarget(event.clientX, event.clientY);
    };

    const touchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      setTarget(touch.clientX, touch.clientY);
    };

    const leave = () => {
      target.x = hiddenTarget.x;
      target.y = hiddenTarget.y;
      active = false;
    };

    section.addEventListener('mousemove', move);
    section.addEventListener('mouseleave', leave);
    section.addEventListener('touchstart', touchMove, { passive: true });
    section.addEventListener('touchmove', touchMove, { passive: true });
    section.addEventListener('touchend', leave, { passive: true });
    section.addEventListener('touchcancel', leave, { passive: true });
    raf = window.requestAnimationFrame(draw);

    return () => {
      section.removeEventListener('mousemove', move);
      section.removeEventListener('mouseleave', leave);
      section.removeEventListener('touchstart', touchMove);
      section.removeEventListener('touchmove', touchMove);
      section.removeEventListener('touchend', leave);
      section.removeEventListener('touchcancel', leave);
      window.cancelAnimationFrame(raf);
    };
  }, [enabled, layerRef, options.initialVisible, options.radius, sectionRef]);
}

type MouseScrubOptions = {
  initialProgress?: number;
  listenOnWindow?: boolean;
  minSeekInterval?: number;
  pauseOnReady?: boolean;
  sensitivity?: number;
  touchTargetRef?: RefObject<HTMLElement | null>;
  useFastSeek?: boolean;
};

type ScrubTouch = {
  clientX: number;
  clientY: number;
};

function useMouseScrub(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  readyToken: number,
  options: MouseScrubOptions = {},
) {
  const previousX = useRef<number | null>(null);
  const touchGesture = useRef<{ startX: number; startY: number; mode: 'pending' | 'scrub' | 'scroll' } | null>(null);
  const targetTime = useRef(0);
  const seeking = useRef(false);
  const queued = useRef(false);
  const rafId = useRef(0);
  const timeoutId = useRef(0);
  const seekFallbackId = useRef(0);
  const lastSeekAt = useRef(0);
  const initialProgress = options.initialProgress ?? 0.35;
  const listenOnWindow = options.listenOnWindow ?? false;
  const minSeekInterval = options.minSeekInterval ?? 90;
  const pauseOnReady = options.pauseOnReady ?? true;
  const sensitivity = options.sensitivity ?? 0.8;
  const touchTargetRef = options.touchTargetRef;
  const useFastSeek = options.useFastSeek ?? true;

  const finishSeek = () => {
    if (seekFallbackId.current) {
      window.clearTimeout(seekFallbackId.current);
      seekFallbackId.current = 0;
    }

    seeking.current = false;
    if (queued.current) {
      queued.current = false;
      scheduleSeek();
    }
  };

  const applySeek = () => {
    const video = videoRef.current;
    if (!enabled || !video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const nextTime = clamp(targetTime.current, 0, video.duration);
    if (Math.abs(video.currentTime - nextTime) < 0.04) {
      if (seeking.current) finishSeek();
      return;
    }

    if (seeking.current) {
      queued.current = true;
      return;
    }

    seeking.current = true;
    lastSeekAt.current = performance.now();
    if (seekFallbackId.current) {
      window.clearTimeout(seekFallbackId.current);
    }

    if (useFastSeek && typeof video.fastSeek === 'function') {
      video.fastSeek(nextTime);
    } else {
      video.currentTime = nextTime;
    }

    seekFallbackId.current = window.setTimeout(finishSeek, Math.max(220, minSeekInterval * 2));
  };

  const scheduleSeek = () => {
    if (rafId.current) return;

    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = 0;
      const elapsed = performance.now() - lastSeekAt.current;

      if (elapsed < minSeekInterval) {
        if (!timeoutId.current) {
          timeoutId.current = window.setTimeout(() => {
            timeoutId.current = 0;
            scheduleSeek();
          }, minSeekInterval - elapsed);
        }
        return;
      }

      applySeek();
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return undefined;

    const onSeeked = () => {
      finishSeek();
    };

    const onLoadedMetadata = () => {
      targetTime.current = video.duration * initialProgress;
      scheduleSeek();
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    if (pauseOnReady) {
      video.pause();
    }
    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
      if (timeoutId.current) window.clearTimeout(timeoutId.current);
      if (seekFallbackId.current) window.clearTimeout(seekFallbackId.current);
      rafId.current = 0;
      timeoutId.current = 0;
      seekFallbackId.current = 0;
      seeking.current = false;
      queued.current = false;
    };
  }, [enabled, initialProgress, minSeekInterval, pauseOnReady, readyToken, useFastSeek, videoRef]);

  const seekFromClientX = (clientX: number) => {
    const video = videoRef.current;
    if (!enabled || !video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    if (previousX.current === null) {
      previousX.current = clientX;
      return;
    }

    const delta = clientX - previousX.current;
    previousX.current = clientX;
    if (Math.abs(delta) < 2) return;

    targetTime.current = clamp(targetTime.current + (delta / window.innerWidth) * sensitivity * video.duration, 0, video.duration);
    scheduleSeek();
  };

  const resetGesture = () => {
    previousX.current = null;
    touchGesture.current = null;
  };

  useEffect(() => {
    if (!enabled || !listenOnWindow) return undefined;

    const onWindowMouseMove = (event: MouseEvent) => {
      seekFromClientX(event.clientX);
    };
    const resetPreviousX = () => {
      resetGesture();
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('blur', resetPreviousX);
    document.addEventListener('mouseleave', resetPreviousX);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('blur', resetPreviousX);
      document.removeEventListener('mouseleave', resetPreviousX);
    };
  }, [enabled, listenOnWindow, readyToken]);

  const onMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    seekFromClientX(event.clientX);
  };

  const onMouseLeave = () => {
    resetGesture();
  };

  const startTouchScrub = (touch: ScrubTouch | undefined) => {
    if (!enabled || !touch) return;

    const video = videoRef.current;
    video?.pause();
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      targetTime.current = video.currentTime;
    }
    previousX.current = touch.clientX;
    touchGesture.current = { startX: touch.clientX, startY: touch.clientY, mode: 'pending' };
  };

  const moveTouchScrub = (touch: ScrubTouch | undefined, preventScroll?: () => void) => {
    const gesture = touchGesture.current;
    if (!enabled || !touch || !gesture) return false;

    const dx = touch.clientX - gesture.startX;
    const dy = touch.clientY - gesture.startY;

    if (gesture.mode === 'pending') {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < 6 && absY < 6) return false;

      if (absX > 10 && absX > absY * 0.65) {
        gesture.mode = 'scrub';
      } else if (absY > 12 && absY > absX * 1.15) {
        gesture.mode = 'scroll';
      } else {
        return false;
      }
    }

    if (gesture.mode !== 'scrub') return false;
    preventScroll?.();
    seekFromClientX(touch.clientX);
    return true;
  };

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    startTouchScrub(event.touches[0]);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    moveTouchScrub(event.touches[0], () => {
      if (event.cancelable) event.preventDefault();
    });
  };

  const onTouchEnd = () => {
    resetGesture();
  };

  const onTouchCancel = () => {
    resetGesture();
  };

  useEffect(() => {
    const touchTarget = touchTargetRef?.current;
    if (!enabled || !touchTarget) return undefined;

    const handleTouchStart = (event: TouchEvent) => {
      startTouchScrub(event.touches[0]);
    };

    const handleTouchMove = (event: TouchEvent) => {
      moveTouchScrub(event.touches[0], () => {
        if (event.cancelable) event.preventDefault();
      });
    };

    const handleTouchEnd = () => {
      resetGesture();
    };

    touchTarget.addEventListener('touchstart', handleTouchStart, { passive: true });
    touchTarget.addEventListener('touchmove', handleTouchMove, { passive: false });
    touchTarget.addEventListener('touchend', handleTouchEnd, { passive: true });
    touchTarget.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      touchTarget.removeEventListener('touchstart', handleTouchStart);
      touchTarget.removeEventListener('touchmove', handleTouchMove);
      touchTarget.removeEventListener('touchend', handleTouchEnd);
      touchTarget.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, minSeekInterval, readyToken, sensitivity, touchTargetRef, useFastSeek]);

  return { onMouseMove, onMouseLeave, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
}

function useLightNav(ids: readonly string[]) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!elements.length) return undefined;

    let ticking = false;
    const update = () => {
      ticking = false;
      const anchorY = 30;
      let isLight = false;
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= anchorY && rect.bottom >= anchorY) {
          isLight = true;
          break;
        }
      }
      setLight(isLight);
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [ids]);

  return light;
}

function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!elements.length) return undefined;

    let ticking = false;
    const update = () => {
      ticking = false;
      const anchorY = window.innerHeight * 0.44;
      let next = elements[0].id;

      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= anchorY && rect.bottom >= anchorY) {
          next = element.id;
          break;
        }
        if (rect.top <= anchorY) {
          next = element.id;
        }
      }

      setActive(next);
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [ids]);

  return active;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default App;
