/**
 * Intel sidebar preference. Pure; shared by the server shell (reads the
 * cookie for the first paint) and the client shell (writes it on toggle).
 *
 * A UI preference with no security meaning: not HttpOnly, scoped to /intel,
 * SameSite=Lax, one year. Absent or unrecognised means expanded.
 */

export const SIDEBAR_COOKIE = 'intel_sidebar'
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type SidebarState = 'expanded' | 'collapsed'

export function parseSidebarCookie(value: string | null | undefined): SidebarState {
  return value?.trim() === 'collapsed' ? 'collapsed' : 'expanded'
}

export function sidebarCookie(state: SidebarState, secure = false): string {
  return [
    `${SIDEBAR_COOKIE}=${state}`,
    'Path=/intel',
    `Max-Age=${SIDEBAR_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
  ].join('; ')
}
