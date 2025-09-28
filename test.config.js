/**
 * Comprehensive Test Configuration
 * 
 * This file provides centralized configuration for all testing activities
 * in the new-smell application.
 */

module.exports = {
  // Test environment configuration
  environments: {
    unit: {
      type: 'unit',
      timeout: 5000,
      retries: 2,
      parallel: true,
      maxWorkers: 4,
      coverage: {
        enabled: true,
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        }
      }
    },
    integration: {
      type: 'integration',
      timeout: 30000,
      retries: 1,
      parallel: false,
      maxWorkers: 1,
      coverage: {
        enabled: true,
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80
        }
      }
    },
    e2e: {
      type: 'e2e',
      timeout: 60000,
      retries: 2,
      parallel: true,
      maxWorkers: 2,
      browsers: ['chromium', 'firefox', 'webkit'],
      coverage: {
        enabled: false
      }
    },
    performance: {
      type: 'performance',
      timeout: 30000,
      retries: 1,
      parallel: false,
      maxWorkers: 1,
      coverage: {
        enabled: false
      }
    }
  },

  // Test data configuration
  testData: {
    users: {
      admin: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        name: 'Test Admin'
      },
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        name: 'Test User'
      }
    },
    perfumes: {
      sample: {
        id: 'perfume-1',
        name: 'Test Perfume',
        brand: 'Test Brand',
        description: 'A test perfume for testing purposes',
        price: 100,
        size: '50ml'
      }
    },
    houses: {
      sample: {
        id: 'house-1',
        name: 'Test House',
        description: 'A test perfume house',
        website: 'https://test.com'
      }
    }
  },

  // Database configuration for tests
  database: {
    test: {
      url: 'postgresql://test:test@localhost:5432/test_db',
      reset: true,
      seed: true
    }
  },

  // Coverage configuration
  coverage: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    components: {
      atoms: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      },
      molecules: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85
      },
      organisms: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      },
      utils: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85
      }
    }
  },

  // Performance thresholds
  performance: {
    thresholds: {
      renderTime: 100, // ms
      memoryUsage: 50, // MB
      bundleSize: 1000, // KB
      apiResponseTime: 500 // ms
    }
  },

  // E2E test configuration
  e2e: {
    baseUrl: 'http://localhost:2112',
    viewport: {
      width: 1280,
      height: 720
    },
    devices: [
      'Desktop Chrome',
      'Desktop Firefox',
      'Desktop Safari',
      'Mobile Chrome',
      'Mobile Safari'
    ],
    criticalPaths: [
      'user-registration',
      'user-login',
      'perfume-browsing',
      'perfume-details',
      'admin-dashboard',
      'perfume-creation'
    ]
  },

  // Test reporting
  reporting: {
    formats: ['json', 'html', 'junit', 'lcov'],
    outputDir: './test-results',
    coverageDir: './coverage',
    artifacts: {
      screenshots: true,
      videos: true,
      traces: true
    }
  },

  // Alerting configuration
  alerts: {
    enabled: true,
    channels: {
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.EMAIL_ALERTS,
      github: process.env.GITHUB_TOKEN
    },
    thresholds: {
      failureRate: 10, // percentage
      coverageDrop: 5, // percentage
      performanceRegression: 20 // percentage
    }
  },

  // Test utilities configuration
  utilities: {
    mockData: {
      enabled: true,
      autoGenerate: true,
      seed: 12345
    },
    fixtures: {
      enabled: true,
      path: './test/fixtures'
    },
    helpers: {
      enabled: true,
      path: './test/utils'
    }
  }
};
