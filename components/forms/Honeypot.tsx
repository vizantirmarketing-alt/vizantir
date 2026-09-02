type Props = {
  name?: string;
  value: string;
  onChange: (v: string) => void;
};

/**
 * Off-screen honeypot field. Bots that scrape and fill every input will
 * populate this; humans never see it. Server flags a non-empty value as
 * suspect and still returns 200 so bots do not learn.
 *
 * Don't use type="hidden" or display:none — sophisticated bots skip both.
 */
export function Honeypot({ name = 'website', value, onChange }: Props) {
  return (
    <div aria-hidden="true">
      <label htmlFor={name} className="sr-only">
        Website
      </label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
