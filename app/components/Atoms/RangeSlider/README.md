# Range Slider Refactoring

This document explains the refactored range slider architecture that breaks down the complex `useRangeSlider` hook into smaller, reusable utility functions and focused hooks.

## Architecture Overview

### 1. Core Utility Functions (`~/utils/rangeSliderUtils.ts`)

#### `calculatePercentage(value, min, max)`

Calculates the percentage position of a value within a range.

```typescript
const percentage = calculatePercentage(50, 0, 100); // Returns: 50
```

#### `calculateValueFromPosition({ clientX, trackElement, min, max, step })`

Converts a mouse position to a slider value, respecting the step size.

```typescript
const value = calculateValueFromPosition({
  clientX: 250,
  trackElement: trackRef.current,
  min: 0,
  max: 100,
  step: 5,
});
```

#### `getKeyboardValue({ key, currentValue, min, max, step })`

Handles keyboard navigation for the slider.

```typescript
const newValue = getKeyboardValue({
  key: "ArrowRight",
  currentValue: 50,
  min: 0,
  max: 100,
  step: 5,
}); // Returns: 55
```

#### `sliderAnimations`

GSAP animation utilities for smooth slider interactions.

```typescript
sliderAnimations.animatePosition(thumbEl, fillEl, percentage, isDragging);
sliderAnimations.animateScale(thumbEl, 1.2);
```

#### `setupHoverListeners(thumbElement, disabled, isDragging)`

Sets up hover animations and returns cleanup function.

### 2. Drag State Hook (`~/hooks/useDragState.ts`)

Manages the complex drag state logic including:

- Mouse move tracking
- Document event listeners
- Drag start/end animations
- Cleanup on unmount

```typescript
const { isDragging, startDragging } = useDragState({
  onValueChange: updateValue,
  calculateValue: (clientX) => /* calculate value */,
  thumbRef
})
```

### 3. Main Hook (`~/hooks/useRangeSlider.ts`)

Now significantly simplified, focusing on:

- State management
- Orchestrating animations
- Providing event handlers
- Syncing external value changes

## Benefits of This Architecture

### 🔧 **Modularity**

Each function has a single responsibility and can be tested independently.

### 🎯 **Reusability**

Utility functions can be used in other slider implementations or components.

### 🧪 **Testability**

Pure functions are easy to unit test without mocking React hooks.

### 📈 **Maintainability**

Changes to specific behaviors (like animations or calculations) are isolated.

### 🎨 **Customization**

Different slider components can use the same logic with different styling.

## Usage Examples

### Basic Slider

```typescript
const MySlider = () => {
  const slider = useRangeSlider({
    min: 0,
    max: 100,
    value: 50,
    onChange: setValue,
  });

  return (
    <div ref={slider.trackRef} onClick={slider.handleTrackClick}>
      <div ref={slider.fillRef} style={{ width: `${slider.percentage}%` }} />
      <div
        ref={slider.thumbRef}
        onMouseDown={slider.handleMouseDown}
        style={{ left: `${slider.percentage}%` }}
      />
    </div>
  );
};
```

### Price Range Filter

```typescript
const PriceFilter = () => {
  const slider = useRangeSlider({
    min: 0,
    max: 1000,
    step: 10,
    value: 250,
    onChange: (price) => filterProducts(price),
  });

  return <CustomSliderUI {...slider} />;
};
```

### Volume Control

```typescript
const VolumeControl = () => {
  const slider = useRangeSlider({
    min: 0,
    max: 100,
    value: volume,
    onChange: setVolume,
  });

  return <VolumeSliderUI {...slider} />;
};
```

## File Structure

```
app/
├── hooks/
│   ├── useRangeSlider.ts      # Main hook (simplified)
│   └── useDragState.ts        # Drag logic hook
├── utils/
│   └── rangeSliderUtils.ts    # Pure utility functions
└── components/
    ├── Atoms/
    │   └── RangeSlider/
    │       └── RangeSlider.tsx # UI component
    └── Examples/
        └── RangeSliderExamples.tsx # Usage examples
```

## Testing Strategy

### Unit Tests for Utilities

```typescript
describe("calculatePercentage", () => {
  it("should calculate correct percentage", () => {
    expect(calculatePercentage(25, 0, 100)).toBe(25);
    expect(calculatePercentage(0, -50, 50)).toBe(50);
  });
});
```

### Integration Tests for Hooks

```typescript
describe("useRangeSlider", () => {
  it("should update value on mouse interaction", () => {
    // Test hook behavior with React Testing Library
  });
});
```

### E2E Tests for Components

```typescript
describe("RangeSlider Component", () => {
  it("should allow dragging to change value", () => {
    // Test full user interaction flow
  });
});
```

This refactored architecture makes the codebase more maintainable, testable, and reusable while keeping the same functionality and performance characteristics.
