import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/*
 * The Intel type utilities (app/globals.css) set the font size, so a later
 * one replaces an earlier text-* size when classes merge: an Intel button's
 * intel-secondary wins over the shared Button's text-sm. Only class names
 * starting with "intel-" are affected; nothing on the public site uses them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ intel: ["number", "title", "body", "secondary", "label", "eyebrow", "th", "nav"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
