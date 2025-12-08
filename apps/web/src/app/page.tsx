import Link from 'next/link';
import {
  Cpu,
  Zap,
  ShoppingCart,
  FileText,
  Users,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              VisuCAN
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/marketplace"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Marketplace
            </Link>
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 pcb-grid opacity-50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm text-primary-700 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300">
              <Sparkles className="h-4 w-4" />
              Powered by Claude AI + Altium Designer
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Design PCBs with
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              From concept to manufacturing in hours, not weeks. VisuCAN
              combines conversational AI with professional PCB tools for a
              seamless design experience.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-lg font-medium text-white hover:bg-primary-700"
              >
                Start Designing Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#demo"
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Cpu className="mx-auto h-16 w-16 text-gray-400" />
                  <p className="mt-4 text-gray-500">
                    Interactive PCB Design Interface
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to design PCBs
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              A complete workflow from block diagram to manufactured boards,
              powered by AI.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'Claude AI Assistant',
                description:
                  'Conversational AI that understands your design intent and guides you through every step.',
              },
              {
                icon: Cpu,
                title: 'Block Diagram → PCB',
                description:
                  'Describe your system and let AI generate block diagrams, schematics, and layouts.',
              },
              {
                icon: Zap,
                title: 'DigiKey Integration',
                description:
                  'Real-time component search, pricing, and availability from DigiKey.',
              },
              {
                icon: ShoppingCart,
                title: 'PCBWAY Quoting',
                description:
                  'Instant manufacturing quotes with visual confirmation before ordering.',
              },
              {
                icon: FileText,
                title: 'Draftsman Reports',
                description:
                  'Professional assembly drawings, fab drawings, and BOM reports.',
              },
              {
                icon: Users,
                title: 'Marketplace',
                description:
                  'Buy and sell PCB designs and assembled boards in our community marketplace.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                  <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-20 dark:bg-gray-900 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Lite Plan */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lite
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Perfect for getting started
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  '2 projects',
                  '2-layer PCBs',
                  '10x10cm max board size',
                  '50 AI messages/month',
                  'Basic exports (Gerber)',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="mt-8 block w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-xl border-2 border-primary-500 bg-white p-8 dark:bg-gray-950">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-sm font-medium text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pro
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                For serious makers
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $49
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Unlimited projects',
                  '4-layer PCBs',
                  '30x30cm max board size',
                  '500 AI messages/month',
                  'All export formats',
                  'Logo placement',
                  'Order tracking',
                  'Marketplace selling (5% fee)',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup?plan=pro"
                className="mt-8 block w-full rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Enterprise
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                For teams and organizations
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  Custom
                </span>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Everything in Pro',
                  'Unlimited AI messages',
                  'Custom board size limits',
                  'API access',
                  'SSO / SAML',
                  'Dedicated support',
                  'Custom integrations',
                  'Marketplace selling (3% fee)',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-8 block w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to design your next PCB?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-100">
              Join thousands of engineers and makers who use VisuCAN to bring
              their ideas to life.
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-lg font-medium text-primary-600 hover:bg-primary-50"
            >
              Start Designing Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                VisuCAN
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} VisuCAN. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
