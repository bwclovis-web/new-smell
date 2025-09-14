import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders } from './test-utils'

// Authentication Testing Utilities

// Mock user data
export const createMockAuthUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  isAuthenticated: true,
  token: 'mock-jwt-token',
  permissions: ['read', 'write'],
  ...overrides,
})

// Mock authentication states
export const mockAuthStates = {
  authenticated: createMockAuthUser(),
  unauthenticated: {
    id: null,
    email: null,
    name: null,
    role: null,
    isAuthenticated: false,
    token: null,
    permissions: [],
  },
  admin: createMockAuthUser({
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
  }),
  guest: createMockAuthUser({
    role: 'guest',
    permissions: ['read'],
  }),
}

// Mock authentication context
export const mockAuthContext = (authState = mockAuthStates.authenticated) => {
  return {
    user: authState,
    login: vi.fn().mockResolvedValue(authState),
    logout: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(authState),
    updateProfile: vi.fn().mockResolvedValue(authState),
    changePassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
  }
}

// Test login flow
export const testLoginFlow = async (
  Component: React.ComponentType<any>,
  credentials = { email: 'test@example.com', password: 'password123' },
  expectedRedirect = '/dashboard'
) => {
  const mockLogin = vi.fn().mockResolvedValue(mockAuthStates.authenticated)
  const { history } = renderWithProviders(<Component login={mockLogin} />)

  const user = userEvent.setup()

  // Fill login form
  await user.type(screen.getByLabelText(/email/i), credentials.email)
  await user.type(screen.getByLabelText(/password/i), credentials.password)

  // Submit form
  await user.click(screen.getByRole('button', { name: /login/i }))

  // Verify login was called
  expect(mockLogin).toHaveBeenCalledWith(credentials)

  // Verify redirect
  await waitFor(() => {
    expect(history.location.pathname).toBe(expectedRedirect)
  })
}

// Test logout flow
export const testLogoutFlow = async (
  Component: React.ComponentType<any>,
  expectedRedirect = '/login'
) => {
  const mockLogout = vi.fn().mockResolvedValue(undefined)
  const { history } = renderWithProviders(<Component logout={mockLogout} />)

  const user = userEvent.setup()

  // Click logout button
  await user.click(screen.getByRole('button', { name: /logout/i }))

  // Verify logout was called
  expect(mockLogout).toHaveBeenCalled()

  // Verify redirect
  await waitFor(() => {
    expect(history.location.pathname).toBe(expectedRedirect)
  })
}

// Test registration flow
export const testRegistrationFlow = async (
  Component: React.ComponentType<any>,
  userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  }
) => {
  const mockRegister = vi.fn().mockResolvedValue(mockAuthStates.authenticated)
  renderWithProviders(<Component register={mockRegister} />)

  const user = userEvent.setup()

  // Fill registration form
  await user.type(screen.getByLabelText(/name/i), userData.name)
  await user.type(screen.getByLabelText(/email/i), userData.email)
  await user.type(screen.getByLabelText(/^password/i), userData.password)
  await user.type(screen.getByLabelText(/confirm password/i), userData.confirmPassword)

  // Submit form
  await user.click(screen.getByRole('button', { name: /register/i }))

  // Verify registration was called
  expect(mockRegister).toHaveBeenCalledWith(
    expect.objectContaining({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    })
  )
}

// Test authentication guards
export const testAuthGuards = async (
  Component: React.ComponentType<any>,
  guardTests: Array<{
    authState: any
    expectedBehavior: 'allow' | 'redirect' | 'show_error'
    expectedPath?: string
    description: string
  }>
) => {
  for (const test of guardTests) {
    const { history } = renderWithProviders(
      <Component authState={test.authState} />
    )

    switch (test.expectedBehavior) {
      case 'allow':
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
        break
      case 'redirect':
        await waitFor(() => {
          expect(history.location.pathname).toBe(test.expectedPath)
        })
        break
      case 'show_error':
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument()
        break
    }

    console.log(`✓ Auth guard test: ${test.description}`)
  }
}

// Test role-based access
export const testRoleBasedAccess = async (
  Component: React.ComponentType<any>,
  roleTests: Array<{
    role: string
    permissions: string[]
    expectedElements: string[]
    hiddenElements: string[]
    description: string
  }>
) => {
  for (const test of roleTests) {
    const authState = createMockAuthUser({
      role: test.role,
      permissions: test.permissions,
    })

    renderWithProviders(<Component authState={authState} />)

    // Check visible elements
    for (const element of test.expectedElements) {
      expect(screen.getByText(element)).toBeInTheDocument()
    }

    // Check hidden elements
    for (const element of test.hiddenElements) {
      expect(screen.queryByText(element)).not.toBeInTheDocument()
    }

    console.log(`✓ Role test: ${test.description}`)
  }
}

// Test permission-based features
export const testPermissionBasedFeatures = async (
  Component: React.ComponentType<any>,
  permissionTests: Array<{
    permissions: string[]
    expectedActions: string[]
    disabledActions: string[]
    description: string
  }>
) => {
  for (const test of permissionTests) {
    const authState = createMockAuthUser({
      permissions: test.permissions,
    })

    renderWithProviders(<Component authState={authState} />)

    // Check enabled actions
    for (const action of test.expectedActions) {
      const button = screen.getByRole('button', { name: action })
      expect(button).toBeEnabled()
    }

    // Check disabled actions
    for (const action of test.disabledActions) {
      const button = screen.queryByRole('button', { name: action })
      if (button) {
        expect(button).toBeDisabled()
      }
    }

    console.log(`✓ Permission test: ${test.description}`)
  }
}

// Test session management
export const testSessionManagement = async (
  Component: React.ComponentType<any>,
  sessionTests: Array<{
    sessionState: 'valid' | 'expired' | 'invalid'
    expectedBehavior: 'maintain' | 'redirect' | 'refresh'
    description: string
  }>
) => {
  for (const test of sessionTests) {
    const mockSessionCheck = vi.fn().mockImplementation(() => {
      switch (test.sessionState) {
        case 'valid':
          return Promise.resolve(mockAuthStates.authenticated)
        case 'expired':
          return Promise.reject(new Error('Session expired'))
        case 'invalid':
          return Promise.reject(new Error('Invalid session'))
      }
    })

    renderWithProviders(<Component checkSession={mockSessionCheck} />)

    // Test session behavior based on expected outcome
    switch (test.expectedBehavior) {
      case 'maintain':
        await waitFor(() => {
          expect(screen.getByText(/welcome/i)).toBeInTheDocument()
        })
        break
      case 'redirect':
        await waitFor(() => {
          expect(screen.getByText(/login/i)).toBeInTheDocument()
        })
        break
      case 'refresh':
        await waitFor(() => {
          expect(mockSessionCheck).toHaveBeenCalledTimes(2)
        })
        break
    }

    console.log(`✓ Session test: ${test.description}`)
  }
}

// Test password requirements
export const testPasswordRequirements = async (
  Component: React.ComponentType<any>,
  passwordTests: Array<{
    password: string
    expectedValid: boolean
    expectedErrors: string[]
    description: string
  }>
) => {
  for (const test of passwordTests) {
    renderWithProviders(<Component />)

    const user = userEvent.setup()
    const passwordField = screen.getByLabelText(/password/i)

    await user.clear(passwordField)
    await user.type(passwordField, test.password)

    // Trigger validation (usually on blur or form submit)
    await user.tab()

    if (test.expectedValid) {
      expect(screen.queryByText(/password/i)).not.toHaveClass('error')
    } else {
      for (const error of test.expectedErrors) {
        expect(screen.getByText(error)).toBeInTheDocument()
      }
    }

    console.log(`✓ Password test: ${test.description}`)
  }
}

// Test two-factor authentication
export const test2FA = async (
  Component: React.ComponentType<any>,
  code = '123456'
) => {
  const mockVerify2FA = vi.fn().mockResolvedValue({ verified: true })
  renderWithProviders(<Component verify2FA={mockVerify2FA} />)

  const user = userEvent.setup()

  // Enter 2FA code
  await user.type(screen.getByLabelText(/verification code/i), code)
  await user.click(screen.getByRole('button', { name: /verify/i }))

  // Verify 2FA was called
  expect(mockVerify2FA).toHaveBeenCalledWith(code)

  // Check success state
  await waitFor(() => {
    expect(screen.getByText(/verified/i)).toBeInTheDocument()
  })
}

// Mock JWT token utilities
export const mockJWT = {
  encode: (payload: any) => `mock.${btoa(JSON.stringify(payload))}.signature`,
  decode: (token: string) => {
    const [, payload] = token.split('.')
    return JSON.parse(atob(payload))
  },
  isExpired: (token: string) => {
    const decoded = mockJWT.decode(token)
    return decoded.exp < Date.now() / 1000
  },
}

// Test token refresh
export const testTokenRefresh = async (
  Component: React.ComponentType<any>
) => {
  const mockRefreshToken = vi.fn().mockResolvedValue({
    token: 'new-mock-token',
    refreshToken: 'new-refresh-token',
  })

  renderWithProviders(<Component refreshToken={mockRefreshToken} />)

  // Simulate token expiry
  await waitFor(() => {
    expect(mockRefreshToken).toHaveBeenCalled()
  })

  // Verify new token is used
  expect(localStorage.getItem('token')).toBe('new-mock-token')
}
