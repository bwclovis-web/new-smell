import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createMockPerfume,
  createMockUser,
  mockFetchResponse,
  renderWithProviders,
  runA11yTestSuite,
  testAccessibility,
  testComponentWithProps,
  testErrorStates,
  testFormValidation,
  testLoadingStates,
  testLoginFlow,
  testNavigation} from '../utils/test-utils'

// Example comprehensive component test
describe('Comprehensive Component Testing Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('demonstrates basic component testing', async () => {
    // Mock component for demonstration
    const TestComponent = ({ loading, error, data }: any) => (
      <div>
        {loading && <div>Loading...</div>}
        {error && <div>Error: {error}</div>}
        {data && <div>Data: {data.name}</div>}
      </div>
    )

    // Test different states
    await testLoadingStates(TestComponent, {}, [
      { loading: true },
      { loading: false }
    ])

    await testErrorStates(TestComponent, {}, [
      { error: null },
      { error: 'Test error' }
    ])

    console.log('✓ Basic component testing completed')
  })

  it('demonstrates form testing utilities', async () => {
    // Mock form component
    const LoginForm = ({ onSubmit }: any) => (
      <form onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" required />

        <button type="submit">Login</button>
      </form>
    )

    // Test form validation
    await testFormValidation([
      { label: 'Email', value: 'invalid-email', expectedError: 'Invalid email' },
      { label: 'Password', value: '', expectedError: 'Password required' }
    ])

    console.log('✓ Form testing completed')
  })

  it('demonstrates API testing utilities', async () => {
    // Mock API function
    const fetchUser = async (id: string) => {
      const response = await fetch(`/api/users/${id}`)
      return response.json()
    }

    // Test with different responses
    global.fetch = mockFetchResponse(createMockUser())
    const user = await fetchUser('1')
    expect(user.email).toBe('test@example.com')

    console.log('✓ API testing completed')
  })

  it('demonstrates authentication testing', async () => {
    // Mock authentication component
    const AuthComponent = ({ login }: any) => (
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" />

        <button onClick={() => login()}>Login</button>
      </div>
    )

    // Test login flow
    await testLoginFlow(AuthComponent, {
      email: 'test@example.com',
      password: 'password123'
    })

    console.log('✓ Authentication testing completed')
  })

  it('demonstrates router testing utilities', async () => {
    // Mock router component
    const RouterComponent = () => (
      <div>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>
        </nav>
        <main>Content</main>
      </div>
    )

    // Test navigation
    await testNavigation(
      <RouterComponent />,
      [
        {
          action: async () => {
            const link = screen.getByText('Dashboard')
            await userEvent.click(link)
          },
          expectedPath: '/dashboard',
          description: 'Navigate to dashboard'
        }
      ]
    )

    console.log('✓ Router testing completed')
  })

  it('demonstrates accessibility testing', async () => {
    // Mock accessible component
    const AccessibleComponent = () => (
      <div>
        <h1>Page Title</h1>
        <nav role="navigation">
          <button aria-label="Open menu">☰</button>
        </nav>
        <main role="main">
          <form>
            <label htmlFor="search">Search</label>
            <input id="search" type="text" />
            <button type="submit">Submit</button>
          </form>
        </main>
      </div>
    )

    // Run comprehensive accessibility tests
    await runA11yTestSuite(AccessibleComponent, {}, {
      testKeyboard: true,
      testScreenReader: true,
      testFocus: true,
      testSemantics: true,
      testForms: true,
    })

    console.log('✓ Accessibility testing completed')
  })

  it('demonstrates component prop variations testing', async () => {
    // Mock component with multiple props
    const FlexibleComponent = ({ theme, size, disabled }: any) => (
      <button
        className={`btn-${theme} btn-${size}`}
        disabled={disabled}
      >
        Button
      </button>
    )

    // Test with different prop combinations
    const propVariations = [
      { theme: 'primary', size: 'small', disabled: false },
      { theme: 'secondary', size: 'large', disabled: true },
      { theme: 'danger', size: 'medium', disabled: false }
    ]

    await testComponentWithProps(
      FlexibleComponent,
      propVariations,
      props => {
        const button = screen.getByRole('button')
        expect(button).toHaveClass(`btn-${props.theme}`)
        expect(button).toHaveClass(`btn-${props.size}`)

        if (props.disabled) {
          expect(button).toBeDisabled()
        } else {
          expect(button).toBeEnabled()
        }
      }
    )

    console.log('✓ Component prop variations testing completed')
  })

  it('demonstrates performance testing', async () => {
    // Mock performance-sensitive component
    const PerformanceComponent = ({ items }: any) => (
      <ul>
        {items.map((item: any, index: number) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    )

    // Test with large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      name: `Item ${i}`
    }))

    const renderTime = await testComponentPerformance(
      PerformanceComponent,
      { items: largeDataset },
      50 // Max 50ms render time
    )

    expect(renderTime).toBeLessThan(50)
    console.log(`✓ Performance testing completed: ${renderTime.toFixed(2)}ms`)
  })

  it('demonstrates data state testing', async () => {
    // Mock data component
    const DataComponent = ({ data, loading, error }: any) => {
      if (loading) {
 return <div>Loading...</div> 
}
      if (error) {
 return <div>Error: {error}</div> 
}
      if (!data || data.length === 0) {
 return <div>No data</div> 
}

      return (
        <ul>
          {data.map((item: any) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )
    }

    // Test different data states
    await testDataStates(DataComponent, {}, [
      { data: null, description: 'no data' },
      { data: [], description: 'empty array' },
      { data: [createMockPerfume()], description: 'with data' }
    ])

    console.log('✓ Data state testing completed')
  })

  it('demonstrates responsive testing', async () => {
    // Mock responsive component
    const ResponsiveComponent = () => (
      <div className="responsive-grid">
        <div className="col-mobile-12 col-tablet-6 col-desktop-4">
          Content
        </div>
      </div>
    )

    // Test different screen sizes
    await testResponsiveComponent(ResponsiveComponent, {}, [
      'mobile',
      'tablet',
      'desktop'
    ])

    console.log('✓ Responsive testing completed')
  })

  it('demonstrates integration testing example', async () => {
    // Mock full page component
    const PageComponent = ({ user, onLogin, onLogout }: any) => (
      <div>
        <header>
          {user ? (
            <div>
              Welcome, {user.name}
              <button onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={onLogin}>Login</button>
          )}
        </header>
        <main>
          {user ? (
            <div>Dashboard Content</div>
          ) : (
            <div>Please log in</div>
          )}
        </main>
      </div>
    )

    // Test logged out state
    const mockLogin = vi.fn()
    const mockLogout = vi.fn()

    renderWithProviders(<PageComponent
        user={null}
        onLogin={mockLogin}
        onLogout={mockLogout}
      />)

    expect(screen.getByText('Please log in')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()

    // Test logged in state
    const { rerender } = renderWithProviders(<PageComponent
        user={createMockUser()}
        onLogin={mockLogin}
        onLogout={mockLogout}
      />)

    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()

    console.log('✓ Integration testing completed')
  })
})
