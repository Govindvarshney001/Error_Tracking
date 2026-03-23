// Mock data for the Error Tracking Dashboard

export interface ErrorGroup {
  id: string
  message: string
  shortMessage: string
  service: string
  severity: 'critical' | 'error' | 'warning' | 'info'
  frequency: number
  lastSeen: Date
  firstSeen: Date
  affectedUsers: number
  stackTrace: string
  metadata: {
    browser?: string
    os?: string
    environment: string
    version?: string
  }
  tags: string[]
  occurrences: { date: Date; count: number }[]
}

export interface Alert {
  id: string
  condition: string
  triggerTime: Date
  status: 'active' | 'resolved' | 'acknowledged'
  service: string
  errorId?: string
  message: string
}

export interface Project {
  id: string
  name: string
  slug: string
  errorCount: number
  status: 'healthy' | 'degraded' | 'critical'
}

// Generate mock error occurrences for the last 24 hours
function generateOccurrences(baseCount: number): { date: Date; count: number }[] {
  const occurrences = []
  const now = new Date()
  for (let i = 24; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    const variance = Math.random() * 0.5 + 0.75
    occurrences.push({
      date,
      count: Math.floor(baseCount * variance / 24)
    })
  }
  return occurrences
}

export const mockErrors: ErrorGroup[] = [
  {
    id: 'err_1',
    message: "TypeError: Cannot read properties of undefined (reading 'map')",
    shortMessage: "TypeError: Cannot read properties of undefined",
    service: 'api-gateway',
    severity: 'critical',
    frequency: 1842,
    lastSeen: new Date(Date.now() - 5 * 60 * 1000),
    firstSeen: new Date(Date.now() - 24 * 60 * 60 * 1000),
    affectedUsers: 523,
    stackTrace: `TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (/app/components/UserList.tsx:24:18)
    at renderWithHooks (/node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (/node_modules/react-dom/cjs/react-dom.development.js:17811:13)
    at beginWork (/node_modules/react-dom/cjs/react-dom.development.js:19049:16)
    at HTMLUnknownElement.callCallback (/node_modules/react-dom/cjs/react-dom.development.js:3945:14)`,
    metadata: {
      browser: 'Chrome 120.0.0',
      os: 'macOS 14.2',
      environment: 'production',
      version: '2.4.1'
    },
    tags: ['react', 'frontend', 'user-list'],
    occurrences: generateOccurrences(1842)
  },
  {
    id: 'err_2',
    message: "Error: ECONNREFUSED - Connection refused to database at 10.0.0.5:5432",
    shortMessage: "ECONNREFUSED - Connection refused to database",
    service: 'auth-service',
    severity: 'critical',
    frequency: 892,
    lastSeen: new Date(Date.now() - 2 * 60 * 1000),
    firstSeen: new Date(Date.now() - 6 * 60 * 60 * 1000),
    affectedUsers: 412,
    stackTrace: `Error: ECONNREFUSED - Connection refused to database at 10.0.0.5:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
    at Protocol._enqueue (/node_modules/pg/lib/protocol.js:95:16)
    at Connection.connect (/node_modules/pg/lib/connection.js:95:18)
    at Pool.connect (/node_modules/pg/lib/pool.js:87:23)
    at AuthService.validateUser (/services/auth/src/auth.service.ts:42:12)`,
    metadata: {
      environment: 'production',
      version: '1.8.3'
    },
    tags: ['database', 'postgres', 'connection'],
    occurrences: generateOccurrences(892)
  },
  {
    id: 'err_3',
    message: "ReferenceError: window is not defined",
    shortMessage: "ReferenceError: window is not defined",
    service: 'web-app',
    severity: 'error',
    frequency: 456,
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
    firstSeen: new Date(Date.now() - 48 * 60 * 60 * 1000),
    affectedUsers: 189,
    stackTrace: `ReferenceError: window is not defined
    at Module.useLocalStorage (/app/hooks/useLocalStorage.ts:8:12)
    at ThemeProvider (/app/providers/ThemeProvider.tsx:15:23)
    at renderWithHooks (/node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (/node_modules/react-dom/cjs/react-dom.development.js:17811:13)`,
    metadata: {
      browser: 'Node.js (SSR)',
      environment: 'production',
      version: '2.4.1'
    },
    tags: ['ssr', 'next.js', 'hydration'],
    occurrences: generateOccurrences(456)
  },
  {
    id: 'err_4',
    message: "Warning: Each child in a list should have a unique 'key' prop",
    shortMessage: "Warning: Missing unique key prop",
    service: 'web-app',
    severity: 'warning',
    frequency: 2341,
    lastSeen: new Date(Date.now() - 1 * 60 * 1000),
    firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    affectedUsers: 1205,
    stackTrace: `Warning: Each child in a list should have a unique "key" prop.
    Check the render method of \`ProductList\`.
    at ProductCard (/app/components/ProductCard.tsx:12:5)
    at ProductList (/app/components/ProductList.tsx:28:9)
    at ShopPage (/app/pages/shop.tsx:45:7)`,
    metadata: {
      browser: 'Firefox 121.0',
      os: 'Windows 11',
      environment: 'production',
      version: '2.4.1'
    },
    tags: ['react', 'performance', 'list-rendering'],
    occurrences: generateOccurrences(2341)
  },
  {
    id: 'err_5',
    message: "HTTP 429: Too Many Requests - Rate limit exceeded for /api/v1/users",
    shortMessage: "HTTP 429: Rate limit exceeded",
    service: 'api-gateway',
    severity: 'warning',
    frequency: 678,
    lastSeen: new Date(Date.now() - 8 * 60 * 1000),
    firstSeen: new Date(Date.now() - 12 * 60 * 60 * 1000),
    affectedUsers: 45,
    stackTrace: `HTTP 429: Too Many Requests - Rate limit exceeded for /api/v1/users
    at RateLimiter.check (/services/gateway/src/middleware/rateLimiter.ts:34:11)
    at processRequest (/services/gateway/src/index.ts:89:23)
    at Layer.handle [as handle_request] (/node_modules/express/lib/router/layer.js:95:5)`,
    metadata: {
      environment: 'production',
      version: '1.5.0'
    },
    tags: ['rate-limiting', 'api', 'throttling'],
    occurrences: generateOccurrences(678)
  },
  {
    id: 'err_6',
    message: "SyntaxError: Unexpected token '<' in JSON at position 0",
    shortMessage: "SyntaxError: Unexpected token in JSON",
    service: 'payment-service',
    severity: 'error',
    frequency: 234,
    lastSeen: new Date(Date.now() - 32 * 60 * 1000),
    firstSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    affectedUsers: 78,
    stackTrace: `SyntaxError: Unexpected token '<' in JSON at position 0
    at JSON.parse (<anonymous>)
    at PaymentService.processWebhook (/services/payments/src/payment.service.ts:156:24)
    at WebhookController.handleStripe (/services/payments/src/webhook.controller.ts:45:18)`,
    metadata: {
      environment: 'production',
      version: '3.2.1'
    },
    tags: ['json', 'parsing', 'webhook'],
    occurrences: generateOccurrences(234)
  },
  {
    id: 'err_7',
    message: "Error: Request timeout after 30000ms - External API unresponsive",
    shortMessage: "Request timeout - External API",
    service: 'notification-service',
    severity: 'error',
    frequency: 156,
    lastSeen: new Date(Date.now() - 45 * 60 * 1000),
    firstSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    affectedUsers: 67,
    stackTrace: `Error: Request timeout after 30000ms - External API unresponsive
    at Timeout._onTimeout (/services/notifications/src/providers/sms.ts:78:15)
    at listOnTimeout (internal/timers.js:554:17)
    at processTimers (internal/timers.js:497:7)`,
    metadata: {
      environment: 'production',
      version: '2.1.0'
    },
    tags: ['timeout', 'external-api', 'sms'],
    occurrences: generateOccurrences(156)
  },
  {
    id: 'err_8',
    message: "Info: Deprecated API endpoint /api/v1/legacy accessed",
    shortMessage: "Deprecated API endpoint accessed",
    service: 'api-gateway',
    severity: 'info',
    frequency: 3421,
    lastSeen: new Date(Date.now() - 1 * 60 * 1000),
    firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    affectedUsers: 234,
    stackTrace: `Info: Deprecated API endpoint /api/v1/legacy accessed
    at DeprecationMiddleware.log (/services/gateway/src/middleware/deprecation.ts:23:8)
    at processRequest (/services/gateway/src/index.ts:67:15)`,
    metadata: {
      environment: 'production',
      version: '1.5.0'
    },
    tags: ['deprecation', 'api', 'migration'],
    occurrences: generateOccurrences(3421)
  }
]

export const mockAlerts: Alert[] = [
  {
    id: 'alert_1',
    condition: 'Error rate > 5% for 5 minutes',
    triggerTime: new Date(Date.now() - 15 * 60 * 1000),
    status: 'active',
    service: 'api-gateway',
    errorId: 'err_1',
    message: 'Critical: Error rate spike detected in api-gateway'
  },
  {
    id: 'alert_2',
    condition: 'Database connection failures > 10',
    triggerTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active',
    service: 'auth-service',
    errorId: 'err_2',
    message: 'Database connectivity issues in auth-service'
  },
  {
    id: 'alert_3',
    condition: 'Response time p99 > 2000ms',
    triggerTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'resolved',
    service: 'payment-service',
    message: 'High latency resolved in payment-service'
  },
  {
    id: 'alert_4',
    condition: 'Memory usage > 90%',
    triggerTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'acknowledged',
    service: 'notification-service',
    message: 'Memory pressure in notification-service'
  },
  {
    id: 'alert_5',
    condition: 'Error rate > 1% for 10 minutes',
    triggerTime: new Date(Date.now() - 30 * 60 * 1000),
    status: 'active',
    service: 'web-app',
    errorId: 'err_3',
    message: 'Elevated SSR error rate in web-app'
  }
]

export const mockProjects: Project[] = [
  { id: 'proj_1', name: 'API Gateway', slug: 'api-gateway', errorCount: 2520, status: 'critical' },
  { id: 'proj_2', name: 'Auth Service', slug: 'auth-service', errorCount: 892, status: 'critical' },
  { id: 'proj_3', name: 'Web App', slug: 'web-app', errorCount: 2797, status: 'degraded' },
  { id: 'proj_4', name: 'Payment Service', slug: 'payment-service', errorCount: 234, status: 'healthy' },
  { id: 'proj_5', name: 'Notification Service', slug: 'notification-service', errorCount: 156, status: 'healthy' }
]

// Dashboard metrics
export const dashboardMetrics = {
  totalErrors24h: 8943,
  totalErrors7d: 52341,
  affectedUsers24h: 2148,
  errorRate: 2.4,
  errorRateChange: +0.8,
  resolvedAlerts: 12,
  activeAlerts: 3
}

// Error rate data for charts (last 12 hours)
export function generateErrorRateData() {
  const data = []
  const now = new Date()
  for (let i = 12; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      errors: Math.floor(Math.random() * 500 + 200),
      warnings: Math.floor(Math.random() * 200 + 50),
    })
  }
  return data
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
