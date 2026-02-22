# FocusFlow Backend Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── tasks.controller.js
│   │   ├── habits.controller.js
│   │   ├── timeLogs.controller.js
│   │   ├── analytics.controller.js
│   │   ├── notifications.controller.js
│   │   └── ai.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Task.model.js
│   │   ├── Habit.model.js
│   │   ├── TimeLog.model.js
│   │   └── AIReport.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── tasks.routes.js
│   │   ├── habits.routes.js
│   │   ├── timeLogs.routes.js
│   │   ├── analytics.routes.js
│   │   ├── notifications.routes.js
│   │   └── ai.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── ai.service.js
│   │   ├── analytics.service.js
│   │   └── notification.service.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   ├── email.js
│   │   └── ai.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   └── api.md
├── package.json
├── .env.example
├── Dockerfile
└── README.md
```
