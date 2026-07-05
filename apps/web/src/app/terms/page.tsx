import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-[13px] text-white/35">
          Last updated: July 2026
        </p>

        <div className="mt-12 space-y-10 text-[14px] leading-relaxed text-white/55">
          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              The service
            </h2>
            <p>
              VisuCAN is an AI-assisted PCB design platform. We provide design
              tools, AI assistance, component sourcing data, and manufacturing
              quote integrations. The service is provided &quot;as is&quot; and
              may change as the product evolves.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Your content
            </h2>
            <p>
              You own the designs you create. By using the platform you grant us
              the limited rights needed to store, process, and display your
              content in order to operate the service. Designs you publish on
              the marketplace are governed by the license terms you select at
              listing time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Acceptable use
            </h2>
            <p>
              Don&apos;t abuse the service: no unauthorized access attempts, no
              reselling of API access, no uploading content you don&apos;t have
              rights to, and no use of the platform to design products that are
              illegal in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Engineering disclaimer
            </h2>
            <p>
              AI-generated designs, schematics, and manufacturing outputs are
              starting points, not certified engineering work. You are
              responsible for validating any design before manufacturing or
              deployment, especially for safety-critical applications.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Billing
            </h2>
            <p>
              VisuCAN is operated by Melis Electronics LLC, and all invoices are
              payable to Melis Electronics LLC. Payments are accepted by card
              and by bank transfer (ACH or wire — remittance details are shown
              on your invoice and in the billing section of your account). Paid
              plans renew monthly until cancelled. You can cancel at any time
              and keep access until the end of the billing period.
              Manufacturing orders placed through partner fabs are subject to
              the partner&apos;s own terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-normal text-white">
              Contact
            </h2>
            <p>
              Questions about these terms:{' '}
              <a
                href="mailto:support@visucan.io"
                className="text-sky-300 hover:text-sky-200"
              >
                support@visucan.io
              </a>{' '}
              or{' '}
              <a
                href="tel:+12246299664"
                className="text-sky-300 hover:text-sky-200"
              >
                +1 (224) 629-9664
              </a>
              . Mailing address: 1109 W Bauer Rd, Naperville, IL 60563, US.
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
