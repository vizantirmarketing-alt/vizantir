type Props = {
  name?: string;
  value: string;
  onChange: (v: string) => void;
};

/**
 * Off-screen honeypot field. Bots that scrape and fill every input will
 * populate this; humans never see it. The server stores a submission with
 * this field filled as spam, sends no notification, and still returns the
 * normal success response so bots do not learn.
 *
 * Don't use type="hidden" or display:none — sophisticated bots skip both.
 *
 * The default name and the hidden label avoid words browser autofill and
 * password managers look for (website, url, name, email, phone, address),
 * and the data attributes ask common password managers to skip the field,
 * so a real visitor's browser never fills it. The form sends its value
 * under its own key, independent of this name.
 */
export function Honeypot({ name = 'vz_hp_field', value, onChange }: Props) {
  return (
    <div aria-hidden="true">
      <label htmlFor={name} className="sr-only">
        Leave this field empty
      </label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
