import { requireIntelUser } from '@/lib/auth/allowlist'

export default async function IntelOverviewPage() {
  await requireIntelUser()

  return (
    <div className="max-w-2xl">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
        Intel
      </p>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground md:text-4xl">
        Overview
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-body">
        Data surfaces for this workspace are coming.
      </p>
    </div>
  )
}
