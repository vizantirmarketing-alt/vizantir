# VIZANTIR DESIGN SYSTEM — FULL SPEC

## === FONTS ===

### Primary Font: Satoshi (local, from /public/assets/fonts/)

**Font Files:**
- Satoshi-Regular.woff2 (400)
- Satoshi-Medium.woff2 (500)
- Satoshi-Bold.woff2 (700)
- Satoshi-Black.woff2 (900)

**Fallback:** `system-ui, -apple-system, sans-serif`

### Font Weights:
- **Headings (h1, h2):** `font-bold` (700) or `font-black` (900)
- **Subheadings (h3, h4):** `font-bold` (700)
- **Body:** `font-normal` (400) or `font-medium` (500)
- **Labels/Small:** `font-medium` (500)
- **Buttons:** `font-semibold` (use 700 since no 600 exists)

### Font Sizes (Tailwind):

**Headings:**
- `h1`: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight`
- `h2`: `text-3xl md:text-4xl lg:text-5xl leading-tight`
- `h3`: `text-2xl md:text-3xl lg:text-4xl leading-snug`
- `h4`: `text-xl md:text-2xl leading-snug`
- `h5`: `text-lg md:text-xl`
- `h6`: `text-base md:text-lg`

**Body Text:**
- **Body Large:** `text-lg md:text-xl leading-relaxed`
- **Body:** `text-base leading-relaxed`
- **Small text:** `text-sm leading-normal`
- **Labels:** `text-xs tracking-[0.25em] uppercase font-medium`

---

## === COLORS ===

### Backgrounds:
- **Day mode:** `#FAFAFA`
- **Night mode:** `#000000`

### Text Colors:
- **Primary Day:** `#1A1A1A`
- **Primary Night:** `#F8F8F8`
- **Muted Day:** `#6B7280`
- **Muted Night:** `#888888`
- **Subtle Day:** `#9CA3AF`
- **Subtle Night:** `#666666`

### Accent Colors:
- **Day:** `#B45309` (amber-700)
- **Night:** `#FFC64C` (Vizantir gold)

### Card Backgrounds:
- **Day:** `#FFFFFF` with border `rgba(0,0,0,0.08)`
- **Night:** `#0A0A0A` with border `rgba(255,255,255,0.08)`

---

## === SPACING ===

### Section Vertical Padding:
- **Hero sections:** `min-h-screen` with content centered
- **Regular sections:** `py-20 md:py-24`
- **Small sections:** `py-12 md:py-16`

### Horizontal Padding:
- **Mobile:** `px-6`
- **Tablet:** `px-8 md:px-12`
- **Desktop:** `lg:px-20`

### Container:
- **General:** `max-w-7xl mx-auto`
- **Content-focused:** `max-w-5xl mx-auto`
- **Text-heavy:** `max-w-4xl mx-auto`
- **Narrow content:** `max-w-3xl mx-auto`

### Component Padding:
- **Cards:** `p-6 md:p-8`
- **Buttons:** `px-8 py-4` (large), `px-6 py-3` (medium)
- **Accordion items:** `p-6 md:p-8`

---

## === COMPONENTS ===

### Border Radius:
- **Cards:** `rounded-2xl`
- **Buttons (CTA):** `rounded-full`
- **Buttons (secondary):** `rounded-xl`
- **Inputs:** `rounded-xl`
- **Icon containers:** `rounded-xl`
- **Badges:** `rounded-full`

### Shadows:

**Night mode:**
- Cards: shadow not needed, use border
- Buttons: subtle glow on accent buttons

**Day mode:**
- Cards: `shadow-sm` or none, use border
- Elevated cards: `shadow-lg` with low opacity

---

## === TRANSITIONS ===

### Theme transitions:
- **All color properties:** `transition-colors duration-500`
- **Never use `layout` prop on `motion.div` for themed elements**

### Hover transitions:
- **Buttons:** `transition-all duration-300 hover:scale-105`
- **Links:** `transition-transform duration-300`
- **Cards:** `transition-all duration-300 hover:-translate-y-1`

---

## === ANIMATIONS (Framer Motion) ===

### Entry animations:
```tsx
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.5 }}
```

### Stagger children:
```tsx
delay: index * 0.1
```

### Hero scroll fade:
```tsx
const { scrollY } = useScroll()
const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
```

---

## === DIVIDERS ===

### Between sections:
```tsx
<div 
  className="w-full h-px"
  style={{ 
    background: isNightMode 
      ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
      : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)' 
  }}
/>
```

---

## === PAGE STRUCTURE ===

Every page must have:

1. **Hero section** (`min-h-screen`)
2. **Gradient dividers** between sections
3. **Consistent section padding** (`py-20 md:py-24`)
4. **CTA section** before footer
5. **Scroll indicator** in hero (optional)

---

## === NO-GO LIST ===

❌ **Don't use** `text-black` or `text-white` directly  
❌ **Don't use** `bg-black` or `bg-white` directly  
❌ **Don't hardcode colors** without theme support  
❌ **Don't use Inter** — use Satoshi  
❌ **Don't forget** `transition-colors duration-500` on themed elements  
❌ **Don't use** `font-semibold` without mapping to 700 (no 600 in Satoshi)  
❌ **Don't use** odd spacing numbers (5, 7, 9, 11)  
❌ **Don't mix** border radius styles within same component type

---

## === IMPLEMENTATION EXAMPLES ===

### Theme-Aware Component:
```tsx
'use client'

import { useTheme } from '@/contexts/ThemeContext'

const Component = () => {
  const { isNightMode } = useTheme()
  
  const colors = {
    bg: isNightMode ? '#000000' : '#FAFAFA',
    text: isNightMode ? '#F8F8F8' : '#1A1A1A',
    textMuted: isNightMode ? '#888888' : '#6B7280',
    accent: isNightMode ? '#FFC64C' : '#B45309',
  }
  
  return (
    <section 
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: colors.bg }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 transition-colors duration-500"
          style={{ color: colors.text }}
        >
          Heading
        </h2>
        <p 
          className="text-base leading-relaxed transition-colors duration-500"
          style={{ color: colors.textMuted }}
        >
          Body text
        </p>
      </div>
    </section>
  )
}
```

### Section Divider:
```tsx
<div 
  className="w-full h-px"
  style={{ 
    background: isNightMode 
      ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
      : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)' 
  }}
/>
```

### Card Component:
```tsx
<div
  className="p-6 md:p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
  style={{
    background: isNightMode ? '#0A0A0A' : '#FFFFFF',
    borderColor: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    transition: 'background 0.5s ease, border-color 0.5s ease, transform 0.3s ease',
  }}
>
  {/* Card content */}
</div>
```

---

## === QUICK REFERENCE ===

### Color Object Pattern:
```tsx
const colors = {
  bg: isNightMode ? '#000000' : '#FAFAFA',
  text: isNightMode ? '#F8F8F8' : '#1A1A1A',
  textMuted: isNightMode ? '#888888' : '#6B7280',
  textSubtle: isNightMode ? '#666666' : '#9CA3AF',
  accent: isNightMode ? '#FFC64C' : '#B45309',
  cardBg: isNightMode ? '#0A0A0A' : '#FFFFFF',
  cardBorder: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
}
```

### Standard Section:
```tsx
<section 
  className="py-20 md:py-24 transition-colors duration-500"
  style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
>
  <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20">
    {/* Content */}
  </div>
</section>
```



