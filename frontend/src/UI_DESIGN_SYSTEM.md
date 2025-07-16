# AusJobs UI Design System Reference

## 🎨 Color Palette

### Primary Brand Colors
```css
/* Custom Brand Colors */
--main-text: #0D141C           /* Primary text color */
--main-white-bg: #F7FAFC       /* Main background white */
--dark-white: #E8EDF2          /* Light gray/off-white */
--searchbar-text: #4F7396      /* Muted blue-gray for search/secondary text */
--navbar-border: #E8EDF2       /* Border color for navigation */
--pill-bg: #EFF4FF             /* Light blue background for pills/badges */
--pill-text: #2557D6           /* Blue text for pills/badges */
```

### shadcn/ui Design Tokens (Light Theme)
```css
--background: 0 0% 100%          /* Pure white background */
--foreground: 222.2 84% 4.9%     /* Very dark blue-gray text */
--primary: 222.2 47.4% 11.2%     /* Dark blue-gray primary */
--primary-foreground: 210 40% 98% /* Light text on primary */
--secondary: 210 40% 96.1%       /* Very light blue-gray */
--secondary-foreground: 222.2 47.4% 11.2% /* Dark text on secondary */
--muted: 210 40% 96.1%           /* Muted background */
--muted-foreground: 215.4 16.3% 46.9% /* Muted text */
--accent: 210 40% 96.1%          /* Accent color (light blue-gray) */
--destructive: 0 84.2% 60.2%     /* Red for errors/destructive actions */
--border: 214.3 31.8% 91.4%      /* Light border color */
--input: 214.3 31.8% 91.4%       /* Input border color */
--ring: 222.2 84% 4.9%           /* Focus ring color */
```

### Dark Theme Support
```css
/* Dark theme variants available for all tokens above */
--background: 222.2 84% 4.9%     /* Dark background */
--foreground: 210 40% 98%        /* Light text */
/* ... (full dark theme palette defined in index.css) */
```

## 📐 Component Architecture

### Atomic Design Structure
```
components/
├── atoms/          # Basic building blocks (buttons, icons, pills)
├── molecules/      # Simple combinations (cards, form inputs, search)
├── organisms/      # Complex components (headers, forms, job rows)
└── ui/            # shadcn/ui base components (primitives)
```

## 🔤 Typography Patterns

### Text Sizing Scale
- **Large Titles**: `text-2xl` (24px) - Used for card titles and headings
- **Regular Text**: `text-[16px]` - Standard body text and labels
- **Small Text**: `text-sm` (14px) - Descriptions and secondary info
- **Extra Small**: `text-xs` (12px) - Badge text and fine print
- **Micro Text**: `text-[10px]` - Tiny labels and indicators

### Font Weights
- **Semibold**: `font-semibold` - Headings and important text
- **Medium**: `font-medium` - Navigation and emphasis
- **Regular**: Default weight for body text
- **Bold**: `font-bold` - Strong emphasis (rare usage)

### Text Colors
- **Primary**: `text-main-text` (#0D141C) - Main content
- **Secondary**: `text-searchbar-text` (#4F7396) - Muted content
- **Muted**: `text-muted-foreground` - Very subtle text
- **Brand**: `text-pill-text` (#2557D6) - Brand-colored text

## 🧱 Layout & Spacing

### Spacing Scale
- **Tight**: `space-y-1.5` (6px) - Card headers
- **Standard**: `my-[12px]`, `py-[12px]` - General vertical spacing
- **Comfortable**: `my-[15px]`, `p-6` - Card content padding
- **Loose**: `px-6 py-4` - Page-level padding

### Container Patterns
- **Page Headers**: `px-6 py-4` with `h-[60px]` fixed height
- **Card Content**: `p-6` with `pt-0` for subsequent sections
- **Form Elements**: `px-[16px] py-[12px]` for inputs
- **Pills/Badges**: `px-[20px] py-[10px]` for category pills

## 🎛️ Component Patterns

### Button Variants
```jsx
// Primary action button
<Button variant="default" size="default">
  
// Secondary/outline button  
<Button variant="outline" size="default">

// Destructive action
<Button variant="destructive" size="default">

// Ghost/minimal button
<Button variant="ghost" size="default">

// Link-style button
<Button variant="link" size="default">

// Size variants: sm, default, lg, icon
```

### Card Patterns
```jsx
// Standard card structure
<Card className="rounded-lg border bg-card shadow-sm">
  <CardHeader className="flex flex-col space-y-1.5 p-6">
    <CardTitle className="text-2xl font-semibold">
    <CardDescription className="text-sm text-muted-foreground">
  </CardHeader>
  <CardContent className="p-6 pt-0">
  <CardFooter className="flex items-center p-6 pt-0">
</Card>

// Job card specific pattern
<div className="flex flex-col my-[15px]">
  <div className="w-[223px] h-[125px] rounded-[12px]">
    <img className="h-full w-full object-cover rounded-[12px]" />
  </div>
  <div className="text-[16px] mt-[12px]">{title}</div>
  <div className="text-searchbar-text">{salary}</div>
</div>
```

### Form Input Patterns
```jsx
// Standard input with shadcn/ui
<Input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />

// Custom search input
<input className="text-searchbar-text text-[16px] pl-[8px] outline-none bg-dark-white w-full" />

// Input container with icon
<div className="flex flex-row rounded-lg items-center bg-dark-white shadow-lg py-[12px] px-[16px] h-[48px]">
  <div className="text-searchbar-text h-full py-[12px] flex items-center text-[20px] font-medium">
    <Icon />
  </div>
  <input className="..." />
</div>
```

### Pill/Badge Patterns
```jsx
// Category pill with hover effect
<button className="w-max h-max bg-pill-bg text-pill-text px-[20px] py-[10px] rounded-full hover:border-red-500 hover:border relative">
  {/* Removable indicator on hover */}
  <div className="absolute right-0 top-0 font-bold text-[10px] flex border border-red-700 text-red-500 bg-red-300 rounded-full w-4 h-4 p-1 items-center justify-center">
    X
  </div>
  <span>{name}</span>
</button>

// shadcn/ui badge variants
<Badge variant="default">    // Primary blue
<Badge variant="secondary">  // Light gray
<Badge variant="destructive"> // Red
<Badge variant="outline">    // Outlined
```

## 🧭 Navigation Patterns

### Header Structure
```jsx
<header className="flex items-center justify-between px-6 py-4 bg-gray-100 h-[60px]">
  <div className="flex items-center space-x-2 cursor-pointer">
    <div className="object-cover rounded-full h-[30px] w-[30px]">
      <img src={logo} />
    </div>
    <span className="text-xl font-semibold text-gray-800">Brand</span>
  </div>
  <nav className="space-x-4 flex flex-row">
    {/* Navigation items with active indicators */}
  </nav>
</header>
```

### Active Navigation Indicator
```jsx
<div className="flex relative">
  <Link className="text-sm font-medium text-gray-600 hover:text-blue-500">
    Nav Item
  </Link>
  {isActive && (
    <div className="w-full border border-blue-500 absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" />
  )}
</div>
```

## 🎯 Border Radius Scale

```css
--radius: 0.5rem (8px)           /* Base radius */

/* Calculated variants */
border-radius: var(--radius)      /* lg - 8px */
border-radius: calc(var(--radius) - 2px)  /* md - 6px */
border-radius: calc(var(--radius) - 4px)  /* sm - 4px */

/* Common usage */
rounded-lg      /* 8px - Cards, inputs, buttons */
rounded-md      /* 6px - Smaller elements */
rounded-full    /* Pills, badges, profile images */
rounded-[12px]  /* 12px - Job card images */
```

## 🌊 Animation & Transitions

### Standard Transitions
```css
transition-colors    /* Color changes on hover/focus */
hover:bg-primary/90  /* 90% opacity on hover */
hover:text-blue-500  /* Color transitions */
focus-visible:ring-2 focus-visible:ring-ring /* Focus rings */
```

### Interactive States
- **Hover Effects**: Color transitions, border additions, opacity changes
- **Focus States**: Ring-2 focus indicators with ring-offset-2
- **Active States**: Blue underline borders for navigation
- **Disabled States**: `disabled:opacity-50 disabled:pointer-events-none`

## 📦 Icon Usage

### Icon Libraries
- **React Icons**: Primary icon library (`react-icons/gr`, etc.)
- **Lucide React**: Secondary icon option (part of shadcn/ui)

### Icon Sizing
- **Small**: `text-[16px]` - Form inputs, small buttons  
- **Medium**: `text-[20px]` - Search bars, navigation
- **Large**: Icon buttons and prominent features

## 🔧 Utility Patterns

### Common Class Combinations
```css
/* Flex centering */
"flex items-center justify-center"
"flex flex-col space-y-1.5"

/* Card shadows */
"shadow-sm"  /* Subtle card shadows */
"shadow-lg"  /* Search boxes and elevated elements */

/* Background patterns */
"bg-gray-100"     /* Header backgrounds */
"bg-dark-white"   /* Input backgrounds */  
"bg-card"         /* Card backgrounds */

/* Text truncation and sizing */
"whitespace-nowrap"
"object-cover"
"w-full h-full"
```

### Responsive Patterns
- Mobile-first approach with Tailwind
- Flexible layouts using `flex-col` and `flex-row`
- Responsive spacing and sizing as needed

## 🎨 Design Principles

### Visual Hierarchy
1. **Primary**: Main actions use `bg-primary` with high contrast
2. **Secondary**: Supporting elements use muted colors
3. **Accent**: Brand blue (`#2557D6`) for highlights and categories

### Consistency Rules
- **Spacing**: Use 12px increments for consistent vertical rhythm
- **Typography**: Maintain scale relationship between sizes
- **Colors**: Stick to defined palette, avoid arbitrary colors
- **Borders**: Consistent radius and color usage
- **Shadows**: Minimal, consistent shadow depths

### Accessibility
- Focus rings on all interactive elements
- Sufficient color contrast ratios
- Semantic HTML structure with proper headings
- Screen reader friendly components from Radix UI

## 📝 Usage Guidelines

### When Creating New Components
1. **Follow atomic design**: Start with atoms, compose into molecules/organisms
2. **Use design tokens**: Reference CSS variables instead of hardcoded values
3. **Implement variants**: Use `class-variance-authority` for component variants
4. **Add accessibility**: Include proper ARIA labels and keyboard navigation
5. **Match patterns**: Follow established spacing, typography, and color patterns

### Component Naming Convention
- **Atoms**: Single-word descriptive names (`Button`, `Input`, `Badge`)
- **Molecules**: Compound descriptive names (`JobCard`, `SearchBox`, `CategoryChooser`)  
- **Organisms**: Complex descriptive names (`MainHeader`, `PaymentForm`, `JobRow`)

This design system ensures consistency across the AusJobs platform while maintaining flexibility for future development. 