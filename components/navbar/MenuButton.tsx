"use client";

type MenuButtonProps = {
  open: boolean;
  onClick: () => void;
};

export function MenuButton({ open, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="site-menu"
      className="xl:hidden -ml-1 flex h-11 w-11 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3]"
    >
      <span className="relative block h-[13px] w-[26px]">
        <span
          className={`absolute left-0 top-0 block h-[1.5px] bg-foreground transition-all duration-300 ease-out ${
            open ? "w-[26px] translate-y-[5.75px] rotate-45" : "w-[26px]"
          }`}
        />
        <span
          className={`absolute left-0 top-[5.75px] block h-[1.5px] bg-foreground transition-all duration-300 ease-out ${
            open ? "w-0 opacity-0" : "w-[20px] opacity-100"
          }`}
        />
        <span
          className={`absolute left-0 top-[11.5px] block h-[1.5px] bg-foreground transition-all duration-300 ease-out ${
            open ? "w-[26px] -translate-y-[5.75px] -rotate-45" : "w-[14px]"
          }`}
        />
      </span>
    </button>
  );
}
