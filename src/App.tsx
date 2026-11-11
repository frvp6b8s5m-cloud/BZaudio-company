import { CalculatorSuite } from "./features/calculators/CalculatorSuite";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  AudioLines,
  AudioWaveform,
  Gauge,
  RadioTower,
  Waves,
} from "lucide-react";

const toolGroups = [
  {
    icon: Activity,
    number: "01",
    title: "Analyze",
    description: "See what your system is doing, from spectrum and level to phase and feedback.",
    tools: "RTA · FFT · LUFS · Peak / RMS",
  },
  {
    icon: RadioTower,
    number: "02",
    title: "System design",
    description: "Make informed setup decisions with practical calculations for real rooms and rigs.",
    tools: "Delay · Crossover · Coverage · Alignment",
  },
  {
    icon: AudioWaveform,
    number: "03",
    title: "Generate",
    description: "Create the signals you need for checking, testing, and tuning an audio system.",
    tools: "Pink noise · Test tones · Sweeps",
  },
];

function SignalTrace() {
  return (
    <div className="signal-panel" aria-label="Decorative audio signal visualization">
      <div className="signal-panel__top">
        <span className="eyebrow">SIGNAL / LIVE</span>
        <span className="signal-live"><span /> SYSTEM READY</span>
      </div>
      <svg
        className="signal-visual"
        viewBox="0 0 560 220"
        role="img"
        aria-label="Illustrative audio waveform"
      >
        <defs>
          <linearGradient id="signal-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#4c9eff" />
            <stop offset="100%" stopColor="#70e0d0" />
          </linearGradient>
          <linearGradient id="signal-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4c9eff" stopOpacity=".22" />
            <stop offset="100%" stopColor="#4c9eff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 9 }, (_, index) => (
          <line
            key={index}
            x1="0"
            x2="560"
            y1={20 + index * 22}
            y2={20 + index * 22}
            className="signal-grid"
          />
        ))}
        <path
          d="M0 110 C18 110 20 105 32 110 S50 150 66 110 S86 54 102 110 S122 160 138 110 S158 82 174 110 S194 130 210 110 S230 35 246 110 S266 174 282 110 S302 64 318 110 S338 145 354 110 S374 90 390 110 S410 155 426 110 S446 48 462 110 S482 128 498 110 S518 95 534 110 S550 112 560 110"
          fill="none"
          stroke="url(#signal-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 110 C18 110 20 105 32 110 S50 150 66 110 S86 54 102 110 S122 160 138 110 S158 82 174 110 S194 130 210 110 S230 35 246 110 S266 174 282 110 S302 64 318 110 S338 145 354 110 S374 90 390 110 S410 155 426 110 S446 48 462 110 S482 128 498 110 S518 95 534 110 S550 112 560 110 L560 220 L0 220Z"
          fill="url(#signal-fill)"
        />
        <line x1="280" x2="280" y1="10" y2="210" className="signal-cursor" />
      </svg>
      <div className="signal-panel__bottom">
        <span>INPUT <strong>— dBFS</strong></span>
        <span>FREQUENCY <strong>20 Hz — 20 kHz</strong></span>
        <span>MODE <strong>OVERVIEW</strong></span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="BZaudio home">
          <span className="brand-mark"><AudioLines size={22} strokeWidth={2.2} /></span>
          <span>BZ<span className="brand-accent">audio</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#toolbox">Toolbox</a>
          <a href="#approach">Approach</a>
          <a href="#about">About</a>
          <a href="#admin">Admin</a>
        </nav>
        <a className="header-link" href="#toolbox">
          Explore tools <ArrowUpRight size={15} />
        </a>
      </header>

      <main id="home">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow hero-kicker"><span className="kicker-line" /> THE LIVE SOUND TOOLBOX</div>
            <h1>Tools built<br />for the <span>show.</span></h1>
            <p className="hero-description">
              Practical audio engineering tools for the people behind the sound.
              Built for setup, system tuning, troubleshooting, and the moments
              when every decibel matters.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#toolbox">
                Explore the toolbox <ArrowUpRight size={17} />
              </a>
              <a className="text-link" href="#approach">Why BZaudio <ArrowDownRight size={15} /></a>
            </div>
            <div className="hero-footnote">
              <span className="status-dot" /> BUILT AROUND REAL-WORLD AUDIO WORKFLOWS
            </div>
          </div>
          <div className="hero-visual">
            <SignalTrace />
            <div className="visual-caption">
              <span>FIG. 001</span>
              <span>LISTEN · MEASURE · UNDERSTAND</span>
            </div>
          </div>
        </section>

        <section className="metrics-strip" aria-label="Product scope">
          <div><strong>30</strong><span>TOOLS IN THE ROADMAP</span></div>
          <div><strong>20</strong><span>TOOLS IN FIRST RELEASE</span></div>
          <div><strong>01</strong><span>FOCUS: BETTER SOUND</span></div>
          <div className="metrics-note"><Waves size={19} /> MADE FOR THE WORKFLOW</div>
        </section>

        <section className="toolbox-section section-wrap" id="toolbox">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE TOOLBOX / 001—030</div>
              <h2>Everything starts<br />with a better <span>read.</span></h2>
            </div>
            <p>
              A growing collection of focused tools for analysis, system design,
              and signal generation. Each tool is being built around clear inputs,
              useful outputs, and transparent engineering.
            </p>
          </div>
          <div className="tool-group-grid">
            {toolGroups.map((group) => {
              const Icon = group.icon;
              return (
                <article className="tool-group" key={group.number}>
                  <div className="tool-group__top">
                    <span className="tool-number">{group.number}</span>
                    <Icon size={22} strokeWidth={1.6} />
                  </div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                  <div className="tool-group__tools">{group.tools}</div>
                  <span className="tool-status">IN DEVELOPMENT</span>
                </article>
              );
            })}
          </div>
          <CalculatorSuite />
          <div className="toolbox-note">
            <Gauge size={18} />
            <p><strong>Built for accuracy, not guesswork.</strong> Calculations will show their units, formulas, assumptions, and limitations.</p>
          </div>
        </section>

        <section className="approach-section" id="approach">
          <div className="section-wrap approach-inner">
            <div className="eyebrow">THE BZAUDIO APPROACH</div>
            <h2>Less guesswork.<br /><span>More confidence.</span></h2>
            <div className="approach-bottom">
              <p>
                Good tools should make the technical side of sound easier to
                understand—not hide it behind a number. BZaudio is being designed
                to keep the engineering visible and the workflow straightforward.
              </p>
              <div className="approach-principles">
                <div><span>01</span><strong>Practical first</strong></div>
                <div><span>02</span><strong>Technically transparent</strong></div>
                <div><span>03</span><strong>Made for live sound</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section section-wrap" id="about">
          <div className="about-mark"><AudioWaveform size={28} /></div>
          <div>
            <div className="eyebrow">ABOUT BZAUDIO</div>
            <h2>Tools for people<br />who care about <span>sound.</span></h2>
            <p>
              BZaudio's goal is to make professional audio engineering and live
              sound tools more accessible and useful. The project brings practical,
              technically grounded tools together for audio professionals,
              students, musicians, and enthusiasts.
            </p>
            <p className="creator-credit">CREATED BY <strong>BENTLEY ZERWAS</strong></p>
          </div>
        </section>

        <section className="admin-section section-wrap" id="admin">
          <div>
            <div className="eyebrow">PROJECT ADMINISTRATION</div>
            <h2>Built in the open.<br /><span>Controlled in GitHub.</span></h2>
            <p>
              BZaudio uses GitHub permissions and approved workflows for project
              administration. This public website does not provide private admin
              accounts or privileged controls.
            </p>
          </div>
          <a className="text-link" href="https://github.com/frvp6b8s5m-cloud/BZaudio-company">
            Open project repository <ArrowUpRight size={16} />
          </a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand brand-footer" href="#home">
          <span className="brand-mark"><AudioLines size={19} /></span>
          <span>BZ<span className="brand-accent">audio</span></span>
        </a>
        <span>ENGINEERED FOR THE MOMENT THAT MATTERS.</span>
        <span>© {new Date().getFullYear()} BZAUDIO</span>
      </footer>
    </div>
  );
}
