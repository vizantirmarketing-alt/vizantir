export default function NewsletterErrorPage() {
  return (
    <main className="font-[Satoshi] mx-auto max-w-xl px-6 py-32 text-stone-900">
      <h1 className="mb-6 text-3xl font-medium tracking-tight">
        Something went wrong.
      </h1>
      <p className="text-[16px] leading-relaxed text-stone-600">
        We couldn't confirm that link. It may have already been used or
        cancelled. Please subscribe again if you'd like to receive emails.
      </p>
    </main>
  );
}
