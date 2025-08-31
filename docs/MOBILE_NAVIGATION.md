# Mobile Navigation Setup

This document describes the mobile-friendly navigation system implemented for the Shadow and Sillage application.

## Components Created

### 1. MobileNavigation (`app/components/Molecules/MobileNavigation/`)

- **Purpose**: Provides a slide-out hamburger menu for mobile devices
- **Features**:
  - Uses the existing Modal component for consistency
  - Left-side slide-in animation (`animateStart="left"`)
  - Touch-friendly navigation items
  - Integrated with the app's modal system
  - Responsive design with safe area support

### 2. MobileBottomNavigation (`app/components/Molecules/MobileBottomNavigation/`)

- **Purpose**: Fixed bottom navigation bar for quick access to key features
- **Features**:
  - Home, Search, Perfumes, Profile, and Menu buttons
  - Touch-friendly targets (44px minimum)
  - Quick search focus functionality
  - Active state indicators

### 3. Updated GlobalNavigation

- **Changes**: Now hidden on mobile devices (`hidden md:flex`)
- **Purpose**: Maintains desktop navigation experience

## Key Features

### Mobile-First Design

- Responsive breakpoints using Tailwind CSS (`md:` prefix)
- Touch-friendly button sizes (44px minimum)
- Safe area support for modern mobile devices
- Backdrop blur effects with fallbacks

### Integration with Existing Modal System

- **Modal Component**: Uses the app's existing `Modal` component
- **Session Context**: Integrated with the app's modal state management
- **Consistent Behavior**: Same animations and behavior as other modals
- **Accessibility**: Inherits all accessibility features from the Modal component

### Accessibility

- ARIA labels and expanded states
- Keyboard navigation support (inherited from Modal)
- Focus management (inherited from Modal)
- Screen reader friendly

### Performance

- Leverages existing modal infrastructure
- Efficient event handling through session context
- Proper cleanup through modal system

## CSS Utilities Added

### Mobile-Specific Classes

- `.mobile-nav`: Base mobile navigation styles
- `.mobile-safe-top`: Safe area top padding
- `.mobile-safe-bottom`: Safe area bottom padding
- `.mobile-touch-target`: Touch-friendly button sizing
- `.mobile-scrollbar`: Custom mobile scrollbar styling

### Animations

- Inherits Modal component animations
- Left-side slide-in effect (`animateStart="left"`)
- Smooth transitions for all interactive elements

## Usage

The mobile navigation is automatically integrated into the `RootLayout` and provides:

1. **Top Header**: Logo and hamburger menu button
2. **Slide-out Menu**: Full navigation with user section (using Modal component)
3. **Bottom Navigation**: Quick access to key features
4. **Responsive Behavior**: Automatically switches between mobile and desktop

## Modal Integration

The mobile navigation now uses the existing Modal component with:

- **`animateStart="left"`**: Slides in from the left side
- **`background="default"`**: Uses the default backdrop
- **`innerType="dark"`**: Dark theme for the modal content
- **Session Context**: Integrated with the app's modal state management

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Fallbacks for backdrop-filter and safe-area-inset
- Progressive enhancement approach
- Consistent with existing modal system

## Future Enhancements

- Gesture support for swipe-to-open/close
- Haptic feedback on supported devices
- Offline navigation state management
- Deep linking support for mobile apps
- Additional modal variants for different navigation patterns
