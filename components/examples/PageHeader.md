# PageHeader Component Documentation

A modern, flexible, and accessible page header component designed for React applications with support for multiple themes, variants, and interactive elements.

## Features

- 🎨 **Multiple Themes**: Default, Primary, Secondary, and Accent color schemes
- 📏 **Three Size Variants**: Compact, Default, and Hero layouts
- 🧭 **Breadcrumb Navigation**: Built-in breadcrumb support with proper accessibility
- 🔒 **Admin Badge**: Automatic role-based badge display
- 🎯 **Action Support**: Flexible action button integration
- ♿ **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- 📱 **Responsive**: Mobile-first design with adaptive layouts
- 🎭 **Subtle Animations**: Performance-optimized micro-interactions
- 🎨 **Design System Integration**: Built with shadcn/ui components

## Installation

The component is already integrated into your project. Make sure you have the required dependencies:

```bash
npm install lucide-react @radix-ui/react-slot class-variance-authority
```

## Basic Usage

### Simple Header

```tsx
import PageHeader from "@/components/custom/shared/PageHeader";
import { Settings } from "lucide-react";

<PageHeader
  icon={Settings}
  title="Settings"
  description="Configure your application preferences"
/>
```

### With Breadcrumbs and Actions

```tsx
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

<PageHeader
  icon={Users}
  title="User Management"
  description="Manage user accounts and permissions"
  breadcrumbs={["Dashboard", "Admin", "Users"]}
  isAdminOnly
  actions={
    <Button>
      <Plus className="size-4 mr-2" />
      Add User
    </Button>
  }
/>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | `undefined` | Icon component from lucide-react |
| `title` | `string` | `undefined` | Main heading text |
| `description` | `string` | `undefined` | Subtitle/description text |
| `isAdminOnly` | `boolean` | `false` | Shows "Admin Only" badge when true |
| `actions` | `React.ReactNode` | `undefined` | Action buttons or other interactive elements |
| `breadcrumbs` | `string[]` | `undefined` | Array of breadcrumb labels |
| `variant` | `"compact" \| "default" \| "hero"` | `"default"` | Size variant |
| `theme` | `"default" \| "primary" \| "secondary" \| "accent"` | `"default"` | Color theme |
| `className` | `string` | `undefined` | Additional CSS classes |

## Variants

### Compact
Perfect for secondary pages or when vertical space is limited.

```tsx
<PageHeader
  variant="compact"
  title="Quick Settings"
  description="Basic configuration options"
/>
```

**Features:**
- Smaller padding and icon size
- Reduced text size
- No breadcrumbs display
- Optimized for mobile

### Default
The standard variant suitable for most pages.

```tsx
<PageHeader
  variant="default"
  icon={Dashboard}
  title="Dashboard"
  description="Overview of your application data"
  breadcrumbs={["Home", "Dashboard"]}
/>
```

**Features:**
- Balanced spacing and typography
- Full breadcrumb support
- Icon and action integration
- Responsive design

### Hero
Eye-catching variant for landing pages and key sections.

```tsx
<PageHeader
  variant="hero"
  icon={Analytics}
  title="Analytics Dashboard"
  description="Comprehensive insights and business intelligence"
  breadcrumbs={["Home", "Analytics"]}
/>
```

**Features:**
- Large typography and icons
- Maximum visual impact
- Extended padding
- Perfect for main pages

## Themes

### Default Theme
Clean, neutral appearance that adapts to light/dark modes.

```tsx
<PageHeader theme="default" title="Default Theme" />
```

### Primary Theme
Uses your brand's primary color for emphasis.

```tsx
<PageHeader theme="primary" title="Primary Theme" />
```

### Secondary Theme
Subtle secondary color variant.

```tsx
<PageHeader theme="secondary" title="Secondary Theme" />
```

### Accent Theme
Vibrant accent color for special sections.

```tsx
<PageHeader theme="accent" title="Accent Theme" />
```

## Advanced Examples

### E-commerce Dashboard

```tsx
<PageHeader
  icon={ShoppingBag}
  title="Sales Dashboard"
  description="Monitor your store performance and revenue metrics"
  variant="hero"
  theme="primary"
  breadcrumbs={["Dashboard", "Sales"]}
  actions={
    <div className="flex gap-2">
      <Button variant="outline">
        <Download className="size-4 mr-2" />
        Export
      </Button>
      <Button>
        <Plus className="size-4 mr-2" />
        New Order
      </Button>
    </div>
  }
/>
```

### Admin Settings Page

```tsx
<PageHeader
  icon={Settings}
  title="System Configuration"
  description="Manage global system settings and preferences"
  variant="default"
  theme="secondary"
  breadcrumbs={["Admin", "System", "Config"]}
  isAdminOnly
  actions={
    <Button variant="destructive">
      <Save className="size-4 mr-2" />
      Save Changes
    </Button>
  }
/>
```

### User Profile

```tsx
<PageHeader
  icon={User}
  title="Profile Settings"
  description="Update your personal information and preferences"
  variant="compact"
  breadcrumbs={["Account", "Profile"]}
  actions={
    <Button variant="outline" size="sm">
      Edit Profile
    </Button>
  }
/>
```

## Accessibility Features

- **Semantic HTML**: Uses proper `<header>`, `<nav>`, and heading elements
- **ARIA Labels**: Breadcrumb navigation includes `aria-label="Breadcrumb"`
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper heading hierarchy and descriptive text
- **Focus Management**: Visible focus indicators for all interactive elements
- **Reduced Motion**: Respects user's motion preferences

## Styling Guidelines

### Custom Styling

You can extend the component with additional styles:

```tsx
<PageHeader
  className="mb-12 border-2 border-dashed"
  title="Custom Styled Header"
/>
```

### Theme Customization

The component uses CSS custom properties and can be themed through your design system:

```css
:root {
  --primary: 220 14% 96%;
  --primary-foreground: 220.9 39.3% 11%;
  /* ... other theme variables */
}
```

## Performance Considerations

- **Optimized Animations**: Uses CSS transforms and opacity for smooth performance
- **Minimal Re-renders**: Pure component design with stable prop references
- **Lazy Loading**: Icons are imported only when needed
- **Responsive Images**: Background patterns scale efficiently

## Browser Support

- Chrome 91+
- Firefox 90+
- Safari 14+
- Edge 91+

## Changelog

### v2.0.0 (Current)
- Complete rewrite with improved performance
- Better accessibility support
- Cleaner, more maintainable code
- Enhanced responsive design
- New theme system
- Reduced motion support
- TypeScript improvements

### v1.0.0 (Legacy)
- Initial implementation with heavy animations
- Basic theme support
- Complex visual effects

## Migration Guide

If upgrading from v1.0.0:

1. **Theme Changes**: Update `theme="glass"` to `theme="default"`
2. **Gradient Classes**: Remove any custom gradient overrides
3. **Animation Props**: Remove any animation-related props (now handled automatically)
4. **CSS Dependencies**: Remove any custom CSS related to the old component

## Troubleshooting

### Common Issues

**Icons not displaying:**
- Ensure `lucide-react` is installed
- Check import statement: `import { IconName } from "lucide-react"`

**Styles not applying:**
- Verify Tailwind CSS is properly configured
- Check if custom CSS conflicts with component styles

**Breadcrumbs not showing:**
- Ensure `variant` is not set to `"compact"`
- Verify `breadcrumbs` prop is an array with at least one item

### Performance Issues

If you notice performance problems:
- Minimize the number of action elements
- Use `React.memo` for complex action components
- Avoid frequently changing props

## Examples in Action

See the component in use throughout the application:

- **Payroll Settings**: `/payroll/settings`
- **Holiday Management**: `/payroll/holidays`
- **Expense Tracking**: `/expenses`

For a comprehensive showcase of all variants and themes, check out the `PageHeaderShowcase` component.
