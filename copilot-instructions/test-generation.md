# Test Generation Guidelines

## Testing Philosophy

Testing in AtomLab ensures scientific accuracy and reliability in instrument control and data analysis. Your tests should provide confidence that critical laboratory operations work correctly under all conditions.

## Test Structure & Organization

### File Organization

```
component/
├── Component.tsx
├── Component.test.tsx          # Unit tests
├── Component.stories.tsx       # Storybook stories (visual tests)
└── component-variants.ts       # CVA variants
```

### Test Categories

#### 1. Unit Tests

Essential for every component, hook, and utility function - the foundation of reliable code.

#### 2. Integration Tests

Test component interactions and user workflows.

#### 3. Visual Tests

Storybook stories that prevent UI regressions.

#### 4. E2E Tests (Future Consideration)

For critical scientific workflows like calibration sequences.

## Component Testing Patterns

### Basic Component Test Template

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ComponentName from './ComponentName'

describe('ComponentName', () => {
  it('renders the component with default props', () => {
    render(<ComponentName />)
    expect(screen.getByText('ComponentName')).toBeInTheDocument()
  })

  it('applies correct CSS classes for variants', () => {
    render(<ComponentName variant="primary" size="lg" />)
    const element = screen.getByRole('button') // or appropriate role
    expect(element).toHaveClass('expected-classes')
  })

  it('handles user interactions correctly', async () => {
    const mockHandler = vi.fn()
    render(<ComponentName onClick={mockHandler} />)

    await user.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalledOnce()
  })
})
```

### CVA Variant Testing

Test all your Class Variance Authority variants:

```typescript
describe('ComponentName variants', () => {
  it.each([
    ['default', 'default-classes'],
    ['primary', 'primary-classes'],
    ['secondary', 'secondary-classes']
  ])('applies correct classes for %s variant', (variant, expectedClasses) => {
    render(<ComponentName variant={variant} />)
    expect(screen.getByRole('button')).toHaveClass(expectedClasses)
  })

  it('handles compound variants correctly', () => {
    render(<ComponentName variant="destructive" size="sm" />)
    expect(screen.getByRole('button')).toHaveClass('destructive-sm-classes')
  })
})
```

## Scientific Domain Testing

### Temperature & Measurement Testing

```typescript
describe('TemperatureDisplay', () => {
  it('displays temperature with correct precision', () => {
    render(<TemperatureDisplay value={25.4567} precision={3} />)
    expect(screen.getByText('25.457°C')).toBeInTheDocument()
  })

  it('handles invalid temperature readings', () => {
    render(<TemperatureDisplay value={NaN} />)
    expect(screen.getByText('Invalid Reading')).toBeInTheDocument()
  })

  it('applies correct styling for out-of-range values', () => {
    render(<TemperatureDisplay value={150} maxValue={100} />)
    expect(screen.getByText('150.0°C')).toHaveClass('text-red-600')
  })
})
```

### Calibration Workflow Testing

```typescript
describe('CalibrationWizard', () => {
  it('progresses through calibration steps', async () => {
    render(<CalibrationWizard />)

    // Initial step
    expect(screen.getByText('Step 1: Prepare Standards')).toBeInTheDocument()

    // Progress to next step
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Step 2: Measure Standards')).toBeInTheDocument()
  })

  it('validates calibration data accuracy', async () => {
    render(<CalibrationWizard />)

    const input = screen.getByLabelText(/temperature standard/i)
    await user.type(input, '25.000')

    expect(screen.queryByText(/invalid temperature/i)).not.toBeInTheDocument()
  })
})
```

## Form Testing Patterns

### Conform.js + Zod Validation Testing

```typescript
describe('InstrumentConfigForm', () => {
  it('validates required fields', async () => {
    render(<InstrumentConfigForm />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Port is required')).toBeInTheDocument()
  })

  it('submits valid form data', async () => {
    const mockSubmit = vi.fn()
    render(<InstrumentConfigForm onSubmit={mockSubmit} />)

    await user.type(screen.getByLabelText(/name/i), 'TRIOS-001')
    await user.type(screen.getByLabelText(/port/i), 'COM3')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'TRIOS-001',
      port: 'COM3'
    })
  })
})
```

## Real-time Data Testing

### SignalR Integration Testing

```typescript
describe('InstrumentStatus with SignalR', () => {
  beforeEach(() => {
    // Mock SignalR connection
    vi.mocked(useSignalR).mockReturnValue({
      connection: mockConnection,
      isConnected: true,
      lastMessage: null
    })
  })

  it('updates status when receiving SignalR messages', async () => {
    render(<InstrumentStatus instrumentId="TRIOS-001" />)

    // Simulate receiving SignalR message
    act(() => {
      mockConnection.emit('InstrumentStatusUpdate', {
        instrumentId: 'TRIOS-001',
        status: 'calibrating',
        temperature: 25.4
      })
    })

    expect(screen.getByText('Calibrating')).toBeInTheDocument()
    expect(screen.getByText('25.4°C')).toBeInTheDocument()
  })
})
```

## Hook Testing Patterns

### React Query Hook Testing

```typescript
describe("useInstrumentData", () => {
  it("fetches instrument data successfully", async () => {
    const mockData = { id: "1", name: "TRIOS-001", status: "online" };
    server.use(
      rest.get("/api/instruments/1", (req, res, ctx) => {
        return res(ctx.json(mockData));
      })
    );

    const { result } = renderHook(() => useInstrumentData("1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it("handles error states gracefully", async () => {
    server.use(
      rest.get("/api/instruments/1", (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: "Server error" }));
      })
    );

    const { result } = renderHook(() => useInstrumentData("1"));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Zustand Store Testing

```typescript
describe("instrumentStore", () => {
  beforeEach(() => {
    useInstrumentStore.getState().reset();
  });

  it("adds instruments to the store", () => {
    const instrument = { id: "1", name: "TRIOS-001" };

    act(() => {
      useInstrumentStore.getState().addInstrument(instrument);
    });

    expect(useInstrumentStore.getState().instruments).toContain(instrument);
  });

  it("updates instrument status", () => {
    const instrument = { id: "1", name: "TRIOS-001", status: "offline" };

    act(() => {
      useInstrumentStore.getState().addInstrument(instrument);
      useInstrumentStore.getState().updateInstrumentStatus("1", "online");
    });

    const updatedInstrument = useInstrumentStore.getState().instruments[0];
    expect(updatedInstrument.status).toBe("online");
  });
});
```

## Mock Patterns & MSW Integration

### API Mocking with MSW

```typescript
// handlers.ts
export const handlers = [
  rest.get("/api/instruments", (req, res, ctx) => {
    return res(
      ctx.json([
        { id: "1", name: "TRIOS-001", status: "online" },
        { id: "2", name: "TRIOS-002", status: "calibrating" },
      ])
    );
  }),

  rest.post("/api/calibration/start", (req, res, ctx) => {
    return res(ctx.json({ success: true, calibrationId: "cal-123" }));
  }),
];
```

### Component Dependency Mocking

```typescript
// Mock complex dependencies
vi.mock('@/components/Atoms/Button/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}))

vi.mock('@/hooks/useSignalR', () => ({
  useSignalR: vi.fn(() => ({
    connection: null,
    isConnected: false,
    lastMessage: null
  }))
}))
```

## Accessibility Testing

### ARIA and Keyboard Navigation

```typescript
describe('Modal accessibility', () => {
  it('manages focus correctly', async () => {
    render(<Modal><input aria-label="Test input" /></Modal>)

    // Focus should be trapped within modal
    const input = screen.getByLabelText('Test input')
    expect(input).toHaveFocus()

    // Tab navigation should stay within modal
    await user.tab()
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()
  })

  it('supports keyboard navigation', async () => {
    const mockClose = vi.fn()
    render(<Modal onClose={mockClose} />)

    await user.keyboard('{Escape}')
    expect(mockClose).toHaveBeenCalled()
  })
})
```

## Performance Testing

### React Optimization Testing

```typescript
describe('TemperatureChart performance', () => {
  it('memoizes expensive calculations', () => {
    const mockCalculation = vi.fn()
    render(<TemperatureChart data={largeDataSet} onCalculate={mockCalculation} />)

    // Re-render with same data
    render(<TemperatureChart data={largeDataSet} onCalculate={mockCalculation} />)

    // Should only calculate once due to memoization
    expect(mockCalculation).toHaveBeenCalledTimes(1)
  })
})
```

## Test Coverage Guidelines

### Coverage Targets

- **Components**: >90% line coverage
- **Hooks**: >95% line coverage
- **Utils**: >95% line coverage
- **Critical paths**: 100% (calibration, data acquisition)

### Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
npm run test:coverage:ui
```

## Common Testing Pitfalls

### Don't Do This (Anti-patterns)

```typescript
// ❌ Testing implementation details
expect(component.find('.internal-class')).toHaveLength(1)

// ❌ Snapshot testing everything
expect(component).toMatchSnapshot()

// ❌ Not testing user interactions
render(<Button />)
expect(screen.getByRole('button')).toBeInTheDocument()
```

### Do This Instead (Good patterns)

```typescript
// ✅ Test user-visible behavior
expect(screen.getByRole('button', { name: /save configuration/i })).toBeInTheDocument()

// ✅ Test actual interactions
await user.click(screen.getByRole('button', { name: /calibrate/i }))
expect(screen.getByText('Calibration started')).toBeInTheDocument()

// ✅ Test edge cases and error states
render(<TemperatureDisplay value={null} />)
expect(screen.getByText('No data available')).toBeInTheDocument()
```

## Test Naming Conventions

### Descriptive Test Names

```typescript
// ✅ Good: Describes what and when
it("displays error message when calibration fails");
it("enables save button after all required fields are filled");
it("updates temperature display when new reading is received");

// ❌ Bad: Vague or implementation-focused
it("works correctly");
it("handles click");
it("renders properly");
```

## Debugging Tests

### Common Issues & Solutions

```typescript
// Issue: Component not rendering
// Solution: Check for missing providers
render(
  <SessionContext.Provider value={mockContext}>
    <Component />
  </SessionContext.Provider>
)

// Issue: Async operations not completing
// Solution: Use waitFor with proper conditions
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
}, { timeout: 3000 })

// Issue: State updates after component unmount
// Solution: Wrap in act() or cleanup properly
act(() => {
  // State updates here
})
```

## Storybook Integration

### Stories as Visual Tests

```typescript
// Component.stories.tsx
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Component variant="default" />
      <Component variant="primary" />
      <Component variant="destructive" />
    </div>
  )
}

export const InteractiveTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByText('Clicked!')).toBeInTheDocument()
  }
}
```

## Remember

Good tests are the foundation of maintainable code. They give us confidence to refactor, catch regressions early, and serve as living documentation of how our code should behave.

Write tests that are clear, comprehensive, and focused on the user experience. When a test fails, it's telling you something important about your code.
