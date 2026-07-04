import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <Link href="/" className="mb-16 flex items-center gap-2.5">
          <span className="block h-2 w-2 rounded-full bg-sky-400" />
          <span className="font-display text-[15px] font-medium tracking-tight">
            VisuCAN
          </span>
        </Link>

        <h1 className="font-display text-3xl font-light tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[13px] text-white/35">
          Last updated: July 2026
        </p>

        <div className="mt-12 space-y-10 text-[14px] leading-relaxed text-white/55">
          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              What we collect
            </h2>
            <p>
              We collect the information you give us when you create an account
              (name, email address) and the content you create on the platform
              (projects, designs, messages to the AI assistant). We also collect
              basic usage data such as log records and device information to keep
              the service secure and reliable.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              How we use it
            </h2>
            <p>
              Your data is used to operate the service: storing your designs,
              processing AI requests, generating manufacturing quotes, and
              improving the product. We do not sell your personal data to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Third-party services
            </h2>
            <p>
              To provide core functionality we share limited data with service
              providers: AI processing (Anthropic Claude), component sourcing
              (DigiKey), manufacturing quotes (PCBWAY), payments (Stripe), and
              hosting (Vercel). Each provider only receives the data needed for
              its function.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Your rights
            </h2>
            <p>
              You can access, correct, or delete your personal data at any time.
              Deleting your account removes your projects and personal
              information from our systems. For any privacy request, contact us
              at{' '}
              <a
                href="mailto:support@visucan.io"
                className="text-sky-300 hover:text-sky-200"
              >
                support@visucan.io
              </a>
              .
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-16 inline-block text-[13px] text-white/40 transition-colors hover:text-white"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
