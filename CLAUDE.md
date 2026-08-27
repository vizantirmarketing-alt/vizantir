# Vizantir

Next.js 16, Supabase, Vercel, Sanity. Deploys from `main`.

## Client onboarding

Every new client needs a row in `public.clients` plus access grants on each
external source. The grants are the slow part. Both Google surfaces have
non-obvious failure modes documented below.

### Required column values

- `ga4_property_id` — numeric property ID, no prefix
- `gsc_site_url` — `sc-domain:example.com` for a domain property, or the full URL
  with trailing slash for a URL-prefix property. Wrong format returns empty rather
  than erroring
- `crux_origin` — scheme and host, no trailing slash. Must match the site's
  canonical host. Check with `curl -sI https://example.com/` and follow any
  redirect
- `uptimerobot_monitor_id` — numeric ID from the monitor URL
- `care_tier` — `essential` or `care` only. This is a check constraint. It does not
  map one to one onto the three published retainer tiers: `essential` is Essential
  Care, `care` covers both Website Care and Growth Partner. The distinction drives
  whether the monthly report includes Search Console data

All four source columns are nullable. A null column means the dashboard omits that
section rather than rendering an empty one.

### GA4 access

Grant the service account at the **account** level, not per property. GA4 Admin,
Account settings, Account access management, add with Viewer.

The property-level Add User form rejects the service account address with "This
email doesn't match a Google Account" even though the same address is already
listed at the account level. Do not spend time on that form. Account-level access
covers every property under the account.

### Search Console access

The Search Console Add User form also rejects the service account address, with
"Failed to add user: email not found". This happens regardless of browser session,
Google account, or whether the property is domain or URL-prefix. There is no
permissions endpoint in the Search Console API either.

The working path is DNS verification through the Site Verification API. The service
account verifies itself as an owner, then adds the site to its own list.
Verification and site membership are two separate steps; doing only the first
leaves `sites.list` empty.

1. Enable the Site Verification API on the `vizantir-intel` Cloud project. It is
   off by default and the error message includes the activation link.
2. `siteVerification.webResource.getToken` with
   `{ site: { type: 'INET_DOMAIN', identifier: 'example.com' },
   verificationMethod: 'DNS_TXT' }`, scope
   `https://www.googleapis.com/auth/siteverification`. Returns a
   `google-site-verification=` value.
3. Add that value as a TXT record at the registrar, host `@`. Multiple
   verification TXT records coexist with each other and with SPF. Confirm with
   `dig +short TXT example.com` before proceeding.
4. `siteVerification.webResource.insert` with the same site object and
   `verificationMethod: 'DNS_TXT'`. Returns an `owners` array that should include
   the service account.
5. `webmasters.sites.add` with the `siteUrl`, scope
   `https://www.googleapis.com/auth/webmasters` (not `.readonly`, which cannot
   write).
6. Confirm with `webmasters.sites.list`. The property should appear with
   `permissionLevel: siteOwner`.

Service account credentials are in `GSC_SERVICE_ACCOUNT_KEY`, base64-encoded JSON.
Extract fields with targeted commands; never print the whole value.

### What to expect after onboarding

- GA4 returns data immediately if the property has history
- Search Console returns no rows for several days after a property is first
  verified. The dashboard renders an explanatory line rather than zeros
- CrUX often has no field data at all for low-traffic sites. This is not a
  misconfiguration and does not resolve on its own
- Uptime shows a mid-window message until the monitor has 28 days of history
