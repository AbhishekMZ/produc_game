# FocusFlow Testing Strategy

## Testing Pyramid

```
        /\
       /  \
      / E2E \     - User journey tests
     /______\    - Critical path testing
    /        \
   /Integration\  - API integration tests
  /__________\   - Database integration
 /            \
/  Unit Tests  \   - Component tests
/______________\  - Function tests
```

## Unit Testing

### Backend Unit Tests (Jest + Supertest)
```javascript
// tests/unit/auth.controller.test.js
const request = require('supertest');
const { AuthController } = require('../../src/controllers/auth.controller');
const { User } = require('../../src/models');

describe('AuthController', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('Password must be at least 8 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('SecurePass123!', 12),
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
```

### Frontend Unit Tests (Jest + React Testing Library)
```javascript
// tests/unit/components/Dashboard.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';

// Mock hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useTasks');
jest.mock('@/hooks/useHabits');
jest.mock('@/hooks/useAnalytics');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;

describe('Dashboard Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', firstName: 'John', email: 'john@example.com' },
    } as any);

    mockUseTasks.mockReturnValue({
      tasks: [],
      getTodayTasks: jest.fn(),
    } as any);
  });

  it('renders welcome message with user name', () => {
    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows productivity overview when data is loaded', async () => {
    mockUseTasks.mockReturnValue({
      tasks: [
        { id: '1', title: 'Test task', status: 'completed' },
        { id: '2', title: 'Another task', status: 'pending' },
      ],
      getTodayTasks: jest.fn(),
    } as any);

    renderWithQueryClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Today\'s Tasks')).toBeInTheDocument();
      expect(screen.getByText('Test task')).toBeInTheDocument();
    });
  });

  it('displays empty state when no tasks exist', async () => {
    renderWithQueryClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No tasks for today')).toBeInTheDocument();
      expect(screen.getByButtonRole('Create your first task')).toBeInTheDocument();
    });
  });
});
```

### AI Engine Unit Tests
```python
# tests/unit/test_productivity_scorer.py
import pytest
from datetime import datetime
from ai_engine import ProductivityScorer

class TestProductivityScorer:
    def setup_method(self):
        self.scorer = ProductivityScorer()

    def test_calculate_perfect_score(self):
        user_data = {
            'tasks_completed': 10,
            'total_tasks': 10,
            'estimated_minutes': 300,
            'actual_minutes': 300,
            'habits_completed': 5,
            'total_habits': 5,
            'focus_sessions': 4,
            'distraction_events': 0
        }
        
        score = self.scorer.calculate_daily_score(user_data)
        assert score == 100.0

    def test_calculate_zero_score(self):
        user_data = {
            'tasks_completed': 0,
            'total_tasks': 10,
            'estimated_minutes': 300,
            'actual_minutes': 600,
            'habits_completed': 0,
            'total_habits': 5,
            'focus_sessions': 0,
            'distraction_events': 10
        }
        
        score = self.scorer.calculate_daily_score(user_data)
        assert score == 0.0

    def test_calculate_partial_score(self):
        user_data = {
            'tasks_completed': 5,
            'total_tasks': 10,
            'estimated_minutes': 300,
            'actual_minutes': 400,
            'habits_completed': 3,
            'total_habits': 5,
            'focus_sessions': 2,
            'distraction_events': 2
        }
        
        score = self.scorer.calculate_daily_score(user_data)
        assert 0 < score < 100

    def test_score_bounds(self):
        # Test that score is always between 0 and 100
        extreme_data = {
            'tasks_completed': 1000,
            'total_tasks': 1,
            'estimated_minutes': 1,
            'actual_minutes': 10000,
            'habits_completed': 100,
            'total_habits': 1,
            'focus_sessions': 1000,
            'distraction_events': 1000
        }
        
        score = self.scorer.calculate_daily_score(extreme_data)
        assert 0 <= score <= 100
```

## Integration Testing

### API Integration Tests
```javascript
// tests/integration/api.integration.test.js
const request = require('supertest');
const { app, connectDatabase, disconnectDatabase } = require('../src/app');

describe('API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('User Workflow', () => {
    it('should complete full user registration and task management workflow', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration@example.com',
          password: 'SecurePass123!',
          firstName: 'Integration',
          lastName: 'User',
        })
        .expect(201);

      // 2. Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      authToken = loginResponse.body.accessToken;
      userId = loginResponse.body.user.id;

      // 3. Create category
      const categoryResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Work',
          color: '#3B82F6',
          icon: 'briefcase',
        })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // 4. Create task
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integration Test Task',
          description: 'Testing task creation',
          priority: 'high',
          categoryId,
          estimatedMinutes: 60,
        })
        .expect(201);

      const taskId = taskResponse.body.task.id;

      // 5. Get tasks
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tasks).toHaveLength(1);
          expect(res.body.tasks[0].title).toBe('Integration Test Task');
        });

      // 6. Update task
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in_progress',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.task.status).toBe('in_progress');
        });

      // 7. Complete task
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.task.status).toBe('completed');
          expect(res.body.task.completedAt).toBeDefined();
        });

      // 8. Create habit
      const habitResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Daily Exercise',
          targetFrequency: 1,
          frequencyType: 'daily',
        })
        .expect(201);

      const habitId = habitResponse.body.habit.id;

      // 9. Log habit completion
      await request(app)
        .post(`/api/habits/${habitId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(201);

      // 10. Get analytics
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.stats).toBeDefined();
          expect(res.body.stats.tasksCompleted).toBe(1);
        });
    });
  });
});
```

### Database Integration Tests
```javascript
// tests/integration/database.integration.test.js
const { Task, User, Habit, TimeLog } = require('../../src/models');

describe('Database Integration Tests', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'dbtest@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'DB',
      lastName: 'Test',
    });
  });

  afterEach(async () => {
    await User.delete(testUser.id);
  });

  describe('Task Model', () => {
    it('should create and retrieve task with associations', async () => {
      const task = await Task.create({
        userId: testUser.id,
        title: 'Database Test Task',
        priority: 'high',
        estimatedMinutes: 45,
      });

      const retrievedTask = await Task.findByIdWithDetails(task.id, testUser.id);

      expect(retrievedTask.title).toBe('Database Test Task');
      expect(retrievedTask.user.id).toBe(testUser.id);
    });

    it('should enforce foreign key constraints', async () => {
      await expect(
        Task.create({
          userId: 'non-existent-user-id',
          title: 'Invalid Task',
        })
      ).rejects.toThrow();
    });

    it('should handle cascading deletes correctly', async () => {
      const task = await Task.create({
        userId: testUser.id,
        title: 'Task to Delete',
      });

      await TimeLog.create({
        userId: testUser.id,
        taskId: task.id,
        startTime: new Date(),
        durationMinutes: 30,
      });

      await Task.delete(task.id);

      const timeLogs = await TimeLog.findByTaskId(task.id);
      expect(timeLogs).toHaveLength(0);
    });
  });

  describe('Transaction Tests', () => {
    it('should rollback on transaction failure', async () => {
      const initialTaskCount = await Task.countByUserId(testUser.id);

      try {
        await Task.transaction(async (trx) => {
          await Task.create({
            userId: testUser.id,
            title: 'Task 1',
          }, { transaction: trx });

          await Task.create({
            userId: testUser.id,
            title: 'Task 2',
          }, { transaction: trx });

          // Force an error
          throw new Error('Intentional error');
        });
      } catch (error) {
        // Expected error
      }

      const finalTaskCount = await Task.countByUserId(testUser.id);
      expect(finalTaskCount).toBe(initialTaskCount);
    });
  });
});
```

## End-to-End Testing

### Playwright E2E Tests
```javascript
// tests/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('FocusFlow User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'e2e@example.com');
    await page.fill('[data-testid=password-input]', 'SecurePass123!');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  });

  test('complete task management workflow', async ({ page }) => {
    // Navigate to tasks
    await page.click('[data-testid=tasks-nav]');
    await page.waitForURL('/tasks');

    // Create new task
    await page.click('[data-testid=create-task-button]');
    await page.fill('[data-testid=task-title]', 'E2E Test Task');
    await page.selectOption('[data-testid=task-priority]', 'high');
    await page.fill('[data-testid=task-estimate]', '60');
    await page.click('[data-testid=save-task-button]');

    // Verify task appears in list
    await expect(page.locator('[data-testid=task-list]')).toContainText('E2E Test Task');

    // Start task
    await page.click('[data-testid=start-task-button]');
    await expect(page.locator('[data-testid=timer]')).toBeVisible();

    // Stop timer
    await page.waitForTimeout(2000); // Wait 2 seconds
    await page.click('[data-testid=stop-timer-button]');

    // Complete task
    await page.click('[data-testid=complete-task-button]');
    await expect(page.locator('[data-testid=task-status]')).toContainText('completed');

    // Verify in dashboard
    await page.click('[data-testid=dashboard-nav]');
    await expect(page.locator('[data-testid=tasks-completed]')).toContainText('1');
  });

  test('habit tracking workflow', async ({ page }) => {
    // Navigate to habits
    await page.click('[data-testid=habits-nav]');
    await page.waitForURL('/habits');

    // Create new habit
    await page.click('[data-testid=create-habit-button]');
    await page.fill('[data-testid=habit-name]', 'Daily Reading');
    await page.selectOption('[data-testid=habit-frequency]', 'daily');
    await page.click('[data-testid=save-habit-button]');

    // Mark habit as complete
    await page.click('[data-testid=complete-habit-button]');
    await expect(page.locator('[data-testid=habit-streak]')).toContainText('1');

    // Verify streak increases
    await page.reload();
    await expect(page.locator('[data-testid=habit-streak]')).toContainText('1');
  });

  test('analytics and insights workflow', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid=analytics-nav]');
    await page.waitForURL('/analytics');

    // Verify charts are rendered
    await expect(page.locator('[data-testid=productivity-chart]')).toBeVisible();
    await expect(page.locator('[data-testid=time-analysis-chart]')).toBeVisible();

    // Check AI insights
    await expect(page.locator('[data-testid=ai-insights]')).toBeVisible();
    await page.click('[data-testid=generate-insights-button]');
    await expect(page.locator('[data-testid=insight-card]')).toBeVisible();
  });

  test('responsive design on mobile', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile navigation
    await expect(page.locator('[data-testid=mobile-menu-button]')).toBeVisible();
    await page.click('[data-testid=mobile-menu-button]');
    await expect(page.locator('[data-testid=mobile-nav]')).toBeVisible();

    // Verify mobile task list
    await page.click('[data-testid=tasks-nav]');
    await expect(page.locator('[data-testid=mobile-task-card]')).toBeVisible();
  });
});
```

## Performance Testing

### Load Testing (Artillery)
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  payload:
    path: "tests/performance/users.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "User Dashboard Load"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.accessToken"
              as: "token"
      
      - get:
          url: "/api/tasks"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - get:
          url: "/api/analytics/dashboard"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - get:
          url: "/api/habits"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Task Creation Load"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.accessToken"
              as: "token"
      
      - post:
          url: "/api/tasks"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            title: "Load Test Task"
            priority: "medium"
            estimatedMinutes: 30

  - name: "AI Insights Load"
    weight: 10
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.accessToken"
              as: "token"
      
      - get:
          url: "/api/ai/insights"
          headers:
            Authorization: "Bearer {{ token }}"
```

## Security Testing

### Security Test Suite
```javascript
// tests/security/security.test.js
const request = require('supertest');
const { app } = require('../src/app');

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'password',
        })
        .expect(401);

      // Verify users table still exists
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);
    });

    it('should rate limit authentication attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'wrongpassword',
      };

      // Make 6 failed attempts (limit is 5)
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });

    it('should validate JWT tokens properly', async () => {
      // Test with invalid token
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      // Test with expired token
      const expiredToken = jwt.sign(
        { userId: 'test', type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('prevent XSS in task titles', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      // First, login and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      const token = loginResponse.body.accessToken;

      // Create task with XSS payload
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: xssPayload,
          priority: 'medium',
        })
        .expect(201);

      // Verify XSS payload is escaped
      expect(response.body.task.title).not.toContain('<script>');
      expect(response.body.task.title).toContain('&lt;script&gt;');
    });
  });

  describe('Authorization Tests', () => {
    it('should prevent access to other users data', async () => {
      // Login as user 1
      const user1Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'SecurePass123!',
        });

      const user1Token = user1Login.body.accessToken;

      // Try to access user 2's tasks (should fail)
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ userId: 'user2-id' })
        .expect(403);
    });
  });
});
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Continuous Testing

### GitHub Actions Test Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: focusflow_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

This comprehensive testing strategy ensures FocusFlow maintains high quality, reliability, and security throughout the development lifecycle.
