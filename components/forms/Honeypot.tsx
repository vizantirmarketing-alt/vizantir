type Props = {
  name?: string;
  value: string;
  onChange: (v: string) => void;
};

/**
 * Off-screen honeypot field. Bots that scrape and fill every input will
 * populate this; humans never see it. Server treats any non-empty value
 * as a silent failure (return 200 without writing).
 *
 * Don't use type="hidden" or display:none — sophisticated bots skip both.
 */
export function Honeypot({ name = 'website', value, onChange }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor={name}>Leave this field empty</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
