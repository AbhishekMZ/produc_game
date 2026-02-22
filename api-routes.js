// FocusFlow API Routes Summary

// Authentication Routes (/api/auth)
// POST   /api/auth/register          - Register new user
// POST   /api/auth/login             - User login
// POST   /api/auth/refresh           - Refresh access token
// POST   /api/auth/logout            - User logout
// GET    /api/auth/verify-email      - Verify email address
// POST   /api/auth/request-reset     - Request password reset
// POST   /api/auth/reset-password    - Reset password

// Tasks Routes (/api/tasks)
// GET    /api/tasks                  - Get all tasks (with filters)
// GET    /api/tasks/:id              - Get single task
// POST   /api/tasks                  - Create new task
// PUT    /api/tasks/:id              - Update task
// DELETE /api/tasks/:id              - Delete task
// GET    /api/tasks/today            - Get today's tasks
// GET    /api/tasks/upcoming         - Get upcoming tasks (7 days)
// PUT    /api/tasks/bulk-update      - Bulk update tasks
// GET    /api/tasks/stats            - Get task statistics

// Habits Routes (/api/habits)
// GET    /api/habits                 - Get all habits
// GET    /api/habits/:id             - Get single habit
// POST   /api/habits                 - Create new habit
// PUT    /api/habits/:id             - Update habit
// DELETE /api/habits/:id             - Delete habit
// POST   /api/habits/:id/log         - Log habit completion
// GET    /api/habits/:id/logs        - Get habit logs
// GET    /api/habits/stats           - Get habit statistics

// Time Logs Routes (/api/time-logs)
// GET    /api/time-logs              - Get time logs
// POST   /api/time-logs              - Create time log
// PUT    /api/time-logs/:id          - Update time log
// DELETE /api/time-logs/:id          - Delete time log
// GET    /api/time-logs/stats        - Get time statistics
// POST   /api/time-logs/start        - Start time tracking
// POST   /api/time-logs/stop         - Stop time tracking

// Analytics Routes (/api/analytics)
// GET    /api/analytics/dashboard    - Get dashboard data
// GET    /api/analytics/productivity - Get productivity analytics
// GET    /api/analytics/time-analysis - Get time analysis
// GET    /api/analytics/trends       - Get trends data
// GET    /api/analytics/heatmap      - Get activity heatmap

// Notifications Routes (/api/notifications)
// GET    /api/notifications          - Get notifications
// PUT    /api/notifications/:id/read - Mark notification as read
// DELETE /api/notifications/:id      - Delete notification
// PUT    /api/notifications/read-all  - Mark all as read

// AI Routes (/api/ai)
// GET    /api/ai/insights            - Get AI insights
// POST   /api/ai/generate-report     - Generate AI report
// GET    /api/ai/patterns            - Get detected patterns
// GET    /api/ai/recommendations     - Get recommendations
// POST   /api/ai/feedback            - Submit AI feedback
