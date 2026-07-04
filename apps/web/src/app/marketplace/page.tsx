import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Marketplace',
};

export default function MarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05070b] px-6 text-center text-white">
      <Link href="/" className="mb-12 flex items-center gap-2.5">
        <span className="block h-2 w-2 rounded-full bg-sky-400" />
        <span className="font-display text-[15px] font-medium tracking-tight">
          VisuCAN
        </span>
      </Link>

      <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-sky-400/80">
        Marketplace
      </p>
      <h1 className="mt-4 font-display text-4xl font-light tracking-[-0.02em] sm:text-5xl">
        Coming soon.
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/45">
        A community marketplace for proven PCB designs and assembled boards.
        Sign up now and you&apos;ll be first in line when it opens.
      </p>

      <Link
        href="/auth/signup"
        className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-80"
      >
        Get early access
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/"
        className="mt-6 text-[13px] text-white/40 transition-colors hover:text-white"
      >
        Back to home
      </Link>
    </div>
  );
}
