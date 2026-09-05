export const ANALYTIR_PATH = '/analytir'
export const ANALYTIR_DATE = '2026-08-06'

export const analytirTitle = 'Analytir | Vizantir Design Studio'
export const analytirDescription =
  'The analytics engine we built in house, and what it says about how we work.'

export const analytirStats = [
  { value: '79', label: 'API routes' },
  { value: '27', label: 'Database tables' },
  { value: '11', label: 'Report archetypes' },
  { value: '9', label: 'Alert types' },
] as const

export const analytirShippedModules = [
  'Square ingestion, with QuickBooks and Stripe connectors built',
  'Merchant-timezone reconciliation views',
  'Natural-language SQL with pre-execution validation',
  'Background job queue with retry',
  'HMAC webhook verification',
  'Encrypted token storage with revoked-credential detection',
  'LLM narrative reports across eleven archetypes',
  'Weekly and monthly PDF generation',
  'Magic-link shared reports',
  'Nine alert types with severity escalation',
  'Per-tier quota enforcement',
  'Stripe Checkout, trials, and webhook handling',
  'Two-factor authentication with recovery codes',
  'Session revocation and login history',
  'Account deletion with grace period',
  'Full user data export',
] as const
