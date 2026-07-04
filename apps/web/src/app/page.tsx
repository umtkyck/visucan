import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroCanvas } from '@/components/landing/hero-canvas';

const FEATURES = [
  {
    index: '01',
    title: 'Claude AI Assistant',
    description:
      'Describe your circuit in plain language. The AI turns intent into block diagrams, schematics, and layout decisions.',
  },
  {
    index: '02',
    title: 'Block Diagram to PCB',
    description:
      'One continuous workflow from system sketch to routed board. No tool switching, no file juggling.',
  },
  {
    index: '03',
    title: 'DigiKey Sourcing',
    description:
      'Live component search with real pricing and stock. Every part in your BOM is orderable.',
  },
  {
    index: '04',
    title: 'PCBWAY Quoting',
    description:
      'Instant manufacturing quotes with visual confirmation before anything goes to fab.',
  },
  {
    index: '05',
    title: 'Draftsman Reports',
    description:
      'Assembly drawings, fab drawings, and BOM documentation generated to professional standards.',
  },
  {
    index: '06',
    title: 'Marketplace',
    description:
      'Sell finished designs or assembled boards. Buy proven reference designs from other engineers.',
  },
];

const PLANS = [
  {
    name: 'Lite',
    price: '$0',
    period: '/mo',
    tagline: 'For getting started',
    features: [
      '2 projects',
      '2-layer boards',
      '10 × 10 cm max size',
      '50 AI messages / month',
      'Gerber export',
    ],
    cta: 'Get started',
    href: '/auth/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    tagline: 'For serious makers',
    features: [
      'Unlimited projects',
      '4-layer boards',
      '30 × 30 cm max size',
      '500 AI messages / month',
      'All export formats',
      'Logo placement & order tracking',
      'Marketplace selling — 5% fee',
    ],
    cta: 'Start free trial',
    href: '/auth/signup?plan=pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For teams',
    features: [
      'Everything in Pro',
      'Unlimited AI messages',
      'Custom board limits',
      'API access & SSO',
      'Dedicated support',
      'Marketplace selling — 3% fee',
    ],
    cta: 'Contact sales',
    href: 'mailto:sales@visucan.io',
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white antialiased selection:bg-sky-400/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#05070b]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="block h-2 w-2 rounded-full bg-sky-400" />
            <span className="font-display text-[15px] font-medium tracking-tight">
              VisuCAN
            </span>
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            <Link
              href="#features"
              className="text-[13px] text-white/50 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-[13px] text-white/50 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/marketplace"
              className="text-[13px] text-white/50 transition-colors hover:text-white"
            >
              Marketplace
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/auth/signin"
              className="text-[13px] text-white/50 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-opacity hover:opacity-80"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <HeroCanvas />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#05070b_78%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-8 text-[13px] font-medium uppercase tracking-[0.25em] text-sky-400/80">
            AI-native PCB design
          </p>
          <h1 className="font-display text-5xl font-light leading-[1.05] tracking-[-0.03em] sm:text-7xl">
            From idea to
            <br />
            <span className="font-medium text-sky-300">manufactured board.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-md text-[15px] leading-relaxed text-white/45">
            VisuCAN pairs conversational AI with professional PCB tooling.
            Describe the circuit — get schematics, layout, and a fab quote.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-80"
            >
              Start designing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              Learn more
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="h-10 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/[0.06] md:grid-cols-4">
          {[
            ['Hours', 'concept to quote'],
            ['4-layer', 'board support'],
            ['Live', 'DigiKey pricing'],
            ['Zero', 'installs required'],
          ].map(([value, label]) => (
            <div key={label} className="px-6 py-10 text-center">
              <div className="font-display text-2xl font-light tracking-tight text-white">
                {value}
              </div>
              <div className="mt-1 text-[12px] uppercase tracking-[0.15em] text-white/35">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-32">
        <div className="max-w-xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-sky-400/80">
            Capabilities
          </p>
          <h2 className="mt-4 font-display text-3xl font-light tracking-[-0.02em] sm:text-4xl">
            The whole workflow,
            <br />
            one surface.
          </h2>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.index}
              className="group bg-[#05070b] p-8 transition-colors hover:bg-[#080b12]"
            >
              <span className="font-mono text-[12px] text-sky-400/60">
                {feature.index}
              </span>
              <h3 className="mt-6 text-[15px] font-medium text-white">
                {feature.title}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/40">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-32">
          <div className="max-w-xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-sky-400/80">
              Pricing
            </p>
            <h2 className="mt-4 font-display text-3xl font-light tracking-[-0.02em] sm:text-4xl">
              Start free. Scale when
              <br />
              the boards do.
            </h2>
          </div>

          <div className="mt-20 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-sky-400/40 bg-sky-400/[0.04]'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[15px] font-medium">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="rounded-full border border-sky-400/40 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-sky-300">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-white/35">{plan.tagline}</p>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-light tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-[13px] text-white/35">{plan.period}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-[13.5px] text-white/55"
                    >
                      <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-sky-400/70" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-10 block rounded-full py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-80 ${
                    plan.highlighted
                      ? 'bg-white text-black'
                      : 'border border-white/15 text-white/80'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-32 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-light leading-tight tracking-[-0.02em] sm:text-5xl">
            Your next board is a
            <span className="text-sky-300"> conversation </span>
            away.
          </h2>
          <Link
            href="/auth/signup"
            className="group mt-12 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-opacity hover:opacity-80"
          >
            Start designing free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="block h-2 w-2 rounded-full bg-sky-400" />
                <span className="font-display text-[15px] font-medium tracking-tight">
                  VisuCAN
                </span>
              </div>
              <div className="mt-4 space-y-1.5 text-center text-[13px] leading-relaxed text-white/35 sm:text-left">
                <p>
                  <a
                    href="tel:+12246299664"
                    className="transition-colors hover:text-white"
                  >
                    +1 (224) 629-9664
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:support@visucan.io"
                    className="transition-colors hover:text-white"
                  >
                    support@visucan.io
                  </a>
                </p>
                <p>
                  1109 W Bauer Rd, Naperville, IL 60563, US
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/privacy"
                className="text-[13px] text-white/35 transition-colors hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-[13px] text-white/35 transition-colors hover:text-white"
              >
                Terms
              </Link>
              <a
                href="mailto:support@visucan.io"
                className="text-[13px] text-white/35 transition-colors hover:text-white"
              >
                Contact
              </a>
            </div>
          </div>
          <p className="mt-10 text-center text-[12px] text-white/25 sm:text-left">
            © {new Date().getFullYear()} VisuCAN. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
