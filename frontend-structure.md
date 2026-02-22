# FocusFlow Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── habits/
│   │   ├── analytics/
│   │   ├── settings/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskFilters.tsx
│   │   │   └── TaskDetails.tsx
│   │   ├── habits/
│   │   │   ├── HabitList.tsx
│   │   │   ├── HabitCard.tsx
│   │   │   ├── HabitForm.tsx
│   │   │   ├── HabitStreak.tsx
│   │   │   └── HabitCalendar.tsx
│   │   ├── analytics/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProductivityChart.tsx
│   │   │   ├── TimeAnalysis.tsx
│   │   │   ├── Heatmap.tsx
│   │   │   └── AIInsights.tsx
│   │   ├── time/
│   │   │   ├── Timer.tsx
│   │   │   ├── TimeLog.tsx
│   │   │   └── Pomodoro.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── PasswordReset.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   ├── useHabits.ts
│   │   ├── useTimeLogs.ts
│   │   ├── useAnalytics.ts
│   │   └── useNotifications.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── taskStore.ts
│   │   ├── habitStore.ts
│   │   ├── analyticsStore.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   ├── habits.ts
│   │   ├── analytics.ts
│   │   └── index.ts
│   └── styles/
│       ├── globals.css
│       ├── components.css
│       └── themes.css
├── public/
│   ├── icons/
│   ├── images/
│   └── favicon.ico
├── tests/
│   ├── __mocks__/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── docs/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```
