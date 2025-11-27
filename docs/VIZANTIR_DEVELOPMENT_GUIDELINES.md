# 📘 Vizantir Development Guidelines
## 🗓️ Last Updated: December 2024

Welcome to the Vizantir codebase. This document defines how the project is structured, how new features should be added, and how both developers and AI tools (like Cursor or Copilot Agents) should interact with the repository.

The goal: preserve a clean, modular, and predictable architecture — so every developer (or AI agent) knows exactly where to work without breaking the structure.

---

## ⚙️ 1. Core Rules

### System Instruction for AI and Developers:

- Always follow the Vizantir folder structure.
- **Each page has its own folder** with its sections inside.
- **Shared components (Navbar, Footer, etc.) have their own folders** — NOT inside page folders.
- Never bundle unrelated code into one file.
- Preserve naming consistency (e.g., `Hero.tsx`, `Services.tsx`, `Testimonials.tsx`).
- Ensure all imports remain clean, modular, and use the `@/` alias for absolute imports.
- **This is a Next.js App Router project** — use `app/` directory for routes, not `pages/`.

### ⚠️ AI Safety Block (Pin this in Cursor):

```
Do not create, edit, move, or delete any folders or files other than the one explicitly mentioned in this prompt.
Only modify the exact file specified. Do not generate new components, pages, layouts, or assets unless directly instructed.
Preserve the current folder structure, imports, and exports exactly as they are.
Your task is limited strictly to updating the existing code inside the specified file while keeping all other parts of the project untouched.
```

Pin or reference this block inside Cursor or any AI-assisted IDE session before making automated edits.

---

## 🧭 2. Folder Structure Overview

```
vizantir/
 ├─ app/                            # Next.js App Router routes
 │   ├─ layout.tsx                  # Root layout (Navbar, Footer, ThemeProvider)
 │   ├─ page.tsx                    # Homepage route (/)
 │   ├─ globals.css                 # Global styles
 │   ├─ about/
 │   │   └─ page.tsx                # About page route (/about)
 │   ├─ services/
 │   │   └─ page.tsx                # Services page route (/services)
 │   ├─ case-studies/
 │   │   └─ page.tsx                # Case Studies page route (/case-studies)
 │   ├─ blog/
 │   │   └─ page.tsx                # Blog page route (/blog)
 │   └─ contact/
 │       └─ page.tsx                # Contact page route (/contact)
 │
 ├─ components/
 │   │
 │   ├─ navbar/                     # ✅ Shared - NOT inside any page folder
 │   │   └─ Navbar.tsx
 │   │
 │   ├─ footer/                     # ✅ Shared - NOT inside any page folder
 │   │   └─ Footer.tsx
 │   │
 │   ├─ back-to-top/                # ✅ Shared utility component
 │   │   └─ BackToTop.tsx
 │   │
 │   ├─ ui/                         # ✅ UI primitives (shadcn)
 │   │   ├─ button.tsx
 │   │   ├─ card.tsx
 │   │   ├─ input.tsx
 │   │   └─ (other shadcn components)
 │   │
 │   ├─ homepage/                   # 🏠 Homepage sections
 │   │   ├─ Hero.tsx                # Animated blob hero
 │   │   ├─ Story.tsx               # "The Story of Vizantir"
 │   │   ├─ Stats.tsx               # Stats section
 │   │   ├─ Services.tsx            # Services overview
 │   │   ├─ CaseStudies.tsx         # Case studies preview
 │   │   ├─ Testimonials.tsx        # Client testimonials
 │   │   └─ CTA.tsx                 # Call-to-action section
 │   │
 │   ├─ services-page/              # 🛠️ Services page sections
 │   │   ├─ Hero.tsx
 │   │   ├─ SEOService.tsx
 │   │   ├─ WebDesignService.tsx
 │   │   ├─ AIMarketingService.tsx
 │   │   ├─ LocalSEOService.tsx
 │   │   ├─ Pricing.tsx
 │   │   └─ CTA.tsx
 │   │
 │   ├─ about-page/                 # 👥 About page sections
 │   │   ├─ Hero.tsx
 │   │   ├─ Mission.tsx
 │   │   ├─ Team.tsx
 │   │   ├─ Values.tsx
 │   │   └─ CTA.tsx
 │   │
 │   ├─ case-studies-page/          # 📊 Case Studies page sections
 │   │   ├─ Hero.tsx
 │   │   ├─ CaseStudyCard.tsx
 │   │   ├─ CaseStudyGrid.tsx
 │   │   └─ CTA.tsx
 │   │
 │   ├─ blog-page/                  # 📝 Blog page sections
 │   │   ├─ Hero.tsx
 │   │   ├─ BlogCard.tsx
 │   │   ├─ BlogGrid.tsx
 │   │   ├─ Categories.tsx
 │   │   └─ Newsletter.tsx
 │   │
 │   └─ contact-page/               # 📧 Contact page sections
 │       ├─ Hero.tsx
 │       ├─ ContactForm.tsx
 │       ├─ ContactInfo.tsx
 │       └─ Map.tsx
 │
 ├─ contexts/                       # React contexts
 │   └─ ThemeContext.tsx            # Day/Night mode provider
 │
 ├─ hooks/                          # Custom React hooks
 │   └─ use-mobile.tsx
 │
 ├─ lib/                            # Utility functions
 │   └─ utils.ts
 │
 └─ public/                         # Static assets
     └─ assets/
         ├─ images/
         ├─ fonts/
         ├─ logos/
         └─ video/
```

---

## 🚨 3. Critical Structure Rules

### ✅ DO:
```
components/
  navbar/Navbar.tsx              ✅ Shared component in own folder
  footer/Footer.tsx              ✅ Shared component in own folder
  homepage/Hero.tsx              ✅ Page-specific section
  homepage/Services.tsx          ✅ Page-specific section
  services-page/Hero.tsx         ✅ Different hero for services page

app/
  page.tsx                       ✅ Homepage route
  about/page.tsx                 ✅ About page route
  services/page.tsx              ✅ Services page route
```

### 🚫 DON'T:
```
components/
  homepage/
    Hero.tsx
    Navbar.tsx                   🚫 NO! Navbar is shared, not homepage-specific
    Footer.tsx                   🚫 NO! Footer is shared, not homepage-specific
  
  Hero.tsx                       🚫 NO! Which page is this for?
  Services.tsx                   🚫 NO! Is this a page or section?

app/
  pages/
    about.tsx                    🚫 NO! Use app/about/page.tsx instead
```

### Why This Structure:

1. **Navbar/Footer are SHARED** — used on every page, so they get their own folders
2. **Each page folder contains ONLY its sections** — easy to find and modify
3. **Same-named files are OK** — `homepage/Hero.tsx` vs `services-page/Hero.tsx` are different
4. **Clear ownership** — you instantly know what belongs where
5. **Next.js App Router** — routes are defined by folder structure in `app/` directory

---

## 🧱 4. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Folders (pages) | kebab-case + "-page" | `services-page/`, `about-page/` |
| Folders (shared) | kebab-case | `navbar/`, `footer/`, `ui/` |
| Components | PascalCase | `Hero.tsx`, `ContactForm.tsx` |
| UI Components | lowercase | `button.tsx`, `card.tsx` |
| Contexts | PascalCase | `ThemeContext.tsx` |
| Hooks | camelCase with "use" | `use-mobile.tsx` |
| Assets | kebab-case | `case-salon.jpg` |
| Routes (App Router) | kebab-case | `app/about/page.tsx`, `app/case-studies/page.tsx` |

### Import Examples:
```tsx
// ✅ Shared components
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";

// ✅ Page-specific sections
import Hero from "@/components/homepage/Hero";
import Story from "@/components/homepage/Story";
import Services from "@/components/homepage/Services";

// ✅ Different page's hero
import ServicesHero from "@/components/services-page/Hero";

// 🚫 DON'T use relative imports
import Hero from "../../../components/homepage/Hero";
```

---

## 📄 5. Page File Structure (Next.js App Router)

Each page file in `/app/[route]/page.tsx` should import its sections:

### Example: `app/page.tsx` (Homepage)
```tsx
import Hero from "@/components/homepage/Hero";
import Story from "@/components/homepage/Story";
import Stats from "@/components/homepage/Stats";
import Services from "@/components/homepage/Services";
import CaseStudies from "@/components/homepage/CaseStudies";
import Testimonials from "@/components/homepage/Testimonials";
import CTA from "@/components/homepage/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Story />
      <Stats />
      <Services />
      <CaseStudies />
      <Testimonials />
      <CTA />
    </>
  );
}
```

**Note:** Navbar and Footer are in `app/layout.tsx`, so they don't need to be imported in each page.

### Example: `app/services/page.tsx`
```tsx
'use client' // Add if using hooks/contexts

import Hero from "@/components/services-page/Hero";
import SEOService from "@/components/services-page/SEOService";
import Pricing from "@/components/services-page/Pricing";
import CTA from "@/components/services-page/CTA";

export default function ServicesPage() {
  return (
    <>
      <Hero />
      <SEOService />
      <Pricing />
      <CTA />
    </>
  );
}
```

### Root Layout: `app/layout.tsx`
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 🎨 6. Styling & Theming

### Design Tokens:

| Token | Day Mode | Night Mode |
|-------|----------|------------|
| Background | `#FFFFFF` / `#FAFAFA` | `#000000` / `#0A0A0A` |
| Text Primary | `#1A1A1A` | `#F8F8F8` |
| Text Secondary | `#6B6B6B` | `#A0A0A0` / `#C0C0C0` |
| Primary/CTA | `#FFC64C` (Gold) | `#FFC64C` (Gold) |

### Theme Usage:
```tsx
'use client' // Required when using hooks/contexts

import { useTheme } from "@/contexts/ThemeContext";

const Component = () => {
  const { isNightMode } = useTheme();
  
  return (
    <section style={{
      background: isNightMode ? '#0A0A0A' : '#FFFFFF',
      color: isNightMode ? '#F8F8F8' : '#1A1A1A'
    }}>
      {/* content */}
    </section>
  );
};
```

**Important:** In Next.js App Router, components using hooks or contexts must have `'use client'` directive at the top.

---

## 🧠 7. AI Usage & Safeguards

When using Cursor or any AI tool:

1. **Pin this document** before making edits
2. **Only modify the specified file**
3. **Respect the folder structure** — never put Navbar inside a page folder
4. **Maintain theme support** — always support day/night modes
5. **Remember Next.js App Router** — routes are in `app/`, not `pages/`
6. **Add 'use client'** when using hooks, contexts, or browser APIs

### Cursor Prompts Examples:
```
✅ "Update the hero text in components/homepage/Hero.tsx"
✅ "Add a new section to components/services-page/ called Pricing.tsx"
✅ "Fix the navbar blur in components/navbar/Navbar.tsx"
✅ "Create a new route at app/portfolio/page.tsx"

🚫 "Move Navbar.tsx into the homepage folder"
🚫 "Create a new file structure"
🚫 "Put Footer inside the contact-page folder"
🚫 "Create pages/about.tsx" (use app/about/page.tsx instead)
```

---

## 🧰 8. Debugging Hierarchy

| Problem Type | Check File/Folder |
|--------------|-------------------|
| Navbar issues | `components/navbar/Navbar.tsx` |
| Footer issues | `components/footer/Footer.tsx` |
| Homepage hero | `components/homepage/Hero.tsx` |
| Services page | `components/services-page/` |
| Theme/dark mode | `contexts/ThemeContext.tsx` |
| Page routing | `app/[route]/page.tsx` |
| Root layout | `app/layout.tsx` |
| UI components | `components/ui/` |
| Global styles | `app/globals.css` |

---

## 🚀 9. Git & Deployment

### Commit Format:
```
feat(homepage): add testimonials section
fix(navbar): resolve night mode visibility
style(services-page): update hero gradient
```

### Deployment:
- Push to `main` → auto-deploys to Vercel
- Next.js App Router is fully supported on Vercel

---

## 📝 10. Quick Reference

### Adding a new section to a page:
1. Create file in `components/[page-name]-page/NewSection.tsx`
2. Import in `app/[route]/page.tsx`
3. Add to JSX

### Adding a new shared component:
1. Create folder `components/[component-name]/`
2. Create file `ComponentName.tsx` inside
3. Import where needed

### Adding a new page:
1. Create folder `app/[route-name]/`
2. Create `page.tsx` inside the folder
3. Create sections in `components/[page-name]-page/`
4. Import sections in the page file
5. Add nav link in `components/navbar/Navbar.tsx`

### Next.js App Router Notes:
- Routes are created by folder structure: `app/about/page.tsx` → `/about`
- Use `'use client'` directive for components using hooks, contexts, or browser APIs
- Server components are default (no directive needed)
- Metadata can be exported from page files or layout files

---

*Vizantir - Smart Strategies. Real Growth.*

