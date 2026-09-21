export const SPAM_SCORE_THRESHOLD = 2;

const LONG_MESSAGE_CHARS = 800;

const SIGNAL_WEIGHTS = {
  urlOrDomain: 1,
  outreachPhrase: 1,
  emailDomainInMessage: 1,
  longMessage: 1,
  invalidUsPhone: 1,
} as const;

const OUTREACH_PHRASES = [
  'free audit',
  'health check',
  'no obligation',
  'our engineers',
  'we help',
  'production-ready',
  'warm regards',
  'attention to ceo',
  'outsourcing',
  'offshore',
  'dedicated developers',
  'white label',
  'software development company',
  'our team specializes',
] as const;

const URL_OR_BARE_DOMAIN =
  /(?:https?:\/\/|www\.)[^\s<>()]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/i;

const US_NATIONAL_NUMBER = /^[2-9]\d{2}[2-9]\d{6}$/;

export type LeadSpamInput = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
};

export type LeadSpamScore = {
  score: number;
  reasons: string[];
};

type Tally = {
  score: number;
  reasons: string[];
};

function add(
  tally: Tally,
  weight: number,
  reason: string,
  matched: boolean
): void {
  if (!matched || weight <= 0) return;
  tally.score += weight;
  tally.reasons.push(reason);
}

function messageHasUrlOrDomain(message: string): boolean {
  return URL_OR_BARE_DOMAIN.test(message);
}

function messageHasOutreachPhrase(message: string): boolean {
  const haystack = message.toLowerCase();
  return OUTREACH_PHRASES.some((phrase) => haystack.includes(phrase));
}

function emailDomainAppearsInMessage(email: string, message: string): boolean {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) return false;
  return message.toLowerCase().includes(domain);
}

function isValidUsPhone(phone: string | null): boolean {
  if (phone == null) return false;
  const digits = phone.replace(/\D/g, '');
  const national =
    digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return US_NATIONAL_NUMBER.test(national);
}

export function scoreLead(input: LeadSpamInput): LeadSpamScore {
  const tally: Tally = { score: 0, reasons: [] };

  add(
    tally,
    SIGNAL_WEIGHTS.urlOrDomain,
    'message contains a url or domain',
    messageHasUrlOrDomain(input.message)
  );
  add(
    tally,
    SIGNAL_WEIGHTS.outreachPhrase,
    'message contains an outreach phrase',
    messageHasOutreachPhrase(input.message)
  );
  add(
    tally,
    SIGNAL_WEIGHTS.emailDomainInMessage,
    'email domain appears in the message',
    emailDomainAppearsInMessage(input.email, input.message)
  );
  add(
    tally,
    SIGNAL_WEIGHTS.longMessage,
    'message exceeds 800 characters',
    input.message.length > LONG_MESSAGE_CHARS
  );
  add(
    tally,
    SIGNAL_WEIGHTS.invalidUsPhone,
    'phone is not a valid us number',
    !isValidUsPhone(input.phone)
  );

  return tally;
}
