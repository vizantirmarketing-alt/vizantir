import 'server-only';

import type { CareTier } from '@/lib/reports/generate';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const CLIENT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CLIENT_COLUMNS = [
  'id',
  'name',
  'slug',
  'site_url',
  'contact_email',
  'care_tier',
  'ga4_property_id',
  'gsc_site_url',
  'crux_origin',
  'uptimerobot_monitor_id',
  'engagement_metrics',
  'reporting_context',
  'active',
].join(', ');

export type IntelClient = {
  id: string;
  name: string;
  slug: string;
  siteUrl: string;
  contactEmail: string;
  careTier: CareTier;
  ga4PropertyId: string | null;
  gscSiteUrl: string | null;
  cruxOrigin: string | null;
  uptimerobotMonitorId: string | null;
  engagementMetrics: unknown;
  reportingContext: string | null;
  active: boolean;
};

export type ClientSources = {
  ga4: boolean;
  gsc: boolean;
  crux: boolean;
  uptime: boolean;
};

export type LoadClientResult =
  | { ok: true; client: IntelClient }
  | { ok: false; reason: 'not_found' | 'malformed' | 'query_failed' };

export type LoadActiveClientsResult =
  | { ok: true; clients: IntelClient[] }
  | { ok: false; reason: 'query_failed' };

export function clientSources(client: IntelClient): ClientSources {
  return {
    ga4: isConfiguredSource(client.ga4PropertyId),
    gsc: isConfiguredSource(client.gscSiteUrl),
    crux: isConfiguredSource(client.cruxOrigin),
    uptime: isConfiguredSource(client.uptimerobotMonitorId),
  };
}

export function isClientId(value: string): boolean {
  return CLIENT_ID_RE.test(value);
}

export async function loadClient(clientId: string): Promise<LoadClientResult> {
  if (!isClientId(clientId)) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    const supabase = createSupabaseServiceRole();
    const result = await supabase
      .from('clients')
      .select(CLIENT_COLUMNS)
      .eq('id', clientId)
      .maybeSingle();

    if (result.error) {
      console.error('Client lookup failed');
      return { ok: false, reason: 'query_failed' };
    }
    if (result.data === null) {
      return { ok: false, reason: 'not_found' };
    }

    const client = parseClientRow(result.data);
    if (client === null) {
      return { ok: false, reason: 'malformed' };
    }

    return { ok: true, client };
  } catch {
    console.error('Client lookup failed');
    return { ok: false, reason: 'query_failed' };
  }
}

export async function loadActiveClients(): Promise<LoadActiveClientsResult> {
  try {
    const supabase = createSupabaseServiceRole();
    const result = await supabase
      .from('clients')
      .select(CLIENT_COLUMNS)
      .eq('active', true)
      .order('name', { ascending: true });

    if (result.error || !Array.isArray(result.data)) {
      console.error('Active clients lookup failed');
      return { ok: false, reason: 'query_failed' };
    }

    const clients: IntelClient[] = [];
    for (const row of result.data) {
      const client = parseClientRow(row);
      if (client !== null) {
        clients.push(client);
      }
    }

    return { ok: true, clients };
  } catch {
    console.error('Active clients lookup failed');
    return { ok: false, reason: 'query_failed' };
  }
}

function parseClientRow(value: unknown): IntelClient | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = asNonEmptyString(value.id);
  const name = asNonEmptyString(value.name);
  const slug = asNonEmptyString(value.slug);
  const siteUrl = asNonEmptyString(value.site_url);
  const contactEmail = asNonEmptyString(value.contact_email);
  const careTier = value.care_tier;
  const ga4PropertyId = asNullableString(value.ga4_property_id);
  const gscSiteUrl = asNullableString(value.gsc_site_url);
  const cruxOrigin = asNullableString(value.crux_origin);
  const uptimerobotMonitorId = asNullableString(value.uptimerobot_monitor_id);
  const reportingContext = asNullableString(value.reporting_context);

  if (
    id === null ||
    name === null ||
    slug === null ||
    siteUrl === null ||
    contactEmail === null ||
    !isCareTier(careTier) ||
    ga4PropertyId === undefined ||
    gscSiteUrl === undefined ||
    cruxOrigin === undefined ||
    uptimerobotMonitorId === undefined ||
    reportingContext === undefined ||
    typeof value.active !== 'boolean'
  ) {
    return null;
  }

  return {
    id,
    name,
    slug,
    siteUrl,
    contactEmail,
    careTier,
    ga4PropertyId,
    gscSiteUrl,
    cruxOrigin,
    uptimerobotMonitorId,
    engagementMetrics: value.engagement_metrics,
    reportingContext,
    active: value.active,
  };
}

function isConfiguredSource(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isCareTier(value: unknown): value is CareTier {
  return value === 'essential' || value === 'care' || value === 'growth';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
