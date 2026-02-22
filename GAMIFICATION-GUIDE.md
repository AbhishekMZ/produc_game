# FocusFlow Gamification System - Complete Guide

## Overview

The gamification system transforms FocusFlow into an engaging, game-like experience where users earn points, unlock rewards, and track their productivity through micro-events throughout the day. This system is designed to be **highly customizable** with retroactive scoring adjustments and flexible event tracking.

## Core Concepts

### 1. **Event Types** - The Building Blocks

Event types represent any trackable activity in your day. The system comes with 10 default event types, but you can create unlimited custom ones.

**Default Event Types:**
- **Task Completed** (10 pts, 1.0x) - Productivity
- **Deep Work Session** (25 pts, 1.5x) - Productivity  
- **Habit Completed** (15 pts, 1.2x) - Wellness
- **Early Start** (20 pts, 1.3x) - Productivity
- **Exercise** (30 pts, 1.4x) - Wellness
- **Learning** (20 pts, 1.25x) - Learning
- **Break Taken** (5 pts, 0.8x) - Wellness
- **Goal Achieved** (50 pts, 2.0x) - Productivity
- **Meditation** (15 pts, 1.1x) - Wellness
- **No Distractions** (20 pts, 1.35x) - Productivity

**Custom Event Types:**
You can create your own events with:
- Custom name and description
- Base point value (1-100)
- Weightage multiplier (0.1x - 5.0x)
- Category (productivity, wellness, learning, social, custom)
- Icon and color for visual identification

### 2. **Weightage System** - Retroactive Scoring

The weightage system allows you to adjust the importance of events **retroactively**:

**How It Works:**
```
Final Points = (Base Points + Duration Bonus) × Weightage
```

**Example:**
- Base event: "Deep Work" = 25 points
- Duration: 60 minutes = +8 bonus points (2 pts per 15 min)
- Weightage: 1.5x
- **Total: (25 + 8) × 1.5 = 49.5 points**

**Adjusting Weightage:**
- You can change the weightage of any event type at any time
- Changes are tracked in the `event_weightage_history` table
- Future events use the new weightage automatically
- Past events keep their original weightage (but you can see the history)

### 3. **Daily Goals** - Unlock Rewards

Set specific goals for each day to unlock rewards:

**Goal Types:**
1. **Productive Hours** - Track total productive time
   - Example: "Be productive for 3 hours" = 180 minutes target
   
2. **Events Count** - Log a certain number of events
   - Example: "Log 10 events today"
   
3. **Points Target** - Earn a specific number of points
   - Example: "Earn 200 points today"

**Goal Rewards:**
- Each goal can have an associated reward
- When you complete the goal, the reward unlocks automatically
- Rewards can be themes, features, or custom incentives

### 4. **Rewards System** - Incentives for Productivity

Rewards are unlockable features or bonuses that motivate continued engagement:

**Default Rewards:**
- **Dark Theme** - Unlock at 100 points
- **Advanced Analytics** - Unlock at Level 5
- **Custom Categories** - Unlock at 500 points
- **AI Coach** - Unlock at Level 10
- **Points Multiplier** - Unlock after 7-day streak (2x for 24 hours)

**Unlock Criteria:**
Rewards can be unlocked by:
- Total points earned
- Current level achieved
- Streak days maintained
- Specific achievements completed

### 5. **Leveling System** - Progressive Growth

Your level increases as you earn experience points (XP):

**Level Formula:**
```
Level = floor(sqrt(XP / 100)) + 1
Points for Next Level = (Current Level)² × 100
```

**Example Progression:**
- Level 1: 0-99 XP
- Level 2: 100-399 XP (need 100 more)
- Level 3: 400-899 XP (need 400 more)
- Level 4: 900-1599 XP (need 900 more)
- Level 10: 8100-9999 XP

**XP Sources:**
- Every event logged gives points = XP
- Achievement unlocks give bonus XP
- Daily goal completions contribute to XP

### 6. **Achievements** - Milestones

Achievements are special badges earned for reaching milestones:

**Default Achievements:**
- **First Step** (Bronze) - Log your first event (+10 pts)
- **Week Warrior** (Silver) - 7-day streak (+50 pts)
- **Month Master** (Gold) - 30-day streak (+200 pts)
- **Century Club** (Silver) - Log 100 events (+100 pts)
- **Point Collector** (Gold) - Earn 1000 points (+150 pts)
- **Early Bird** (Silver) - Start before 8 AM for 7 days (+75 pts)
- **Deep Focus** (Gold) - Complete 10 deep work sessions (+100 pts)
- **Wellness Champion** (Gold) - Complete 30 wellness events (+150 pts)
- **Level 10** (Platinum) - Reach level 10 (+250 pts)
- **Perfectionist** (Platinum) - Complete all daily goals for 7 days (+300 pts)

**Achievement Tiers:**
- Bronze - Beginner milestones
- Silver - Intermediate achievements
- Gold - Advanced accomplishments
- Platinum - Elite achievements
- Diamond - Legendary status

### 7. **Streaks** - Consistency Tracking

Streaks track consecutive days of activity:

**How Streaks Work:**
- Streak increases by 1 each day you log at least one event
- Streak resets to 1 if you miss a day
- Longest streak is tracked separately
- Streaks unlock special rewards and achievements

**Streak Benefits:**
- Unlocks streak-based rewards
- Contributes to achievements
- Displayed prominently in profile
- Motivates daily engagement

## Usage Examples

### Example 1: Morning Routine Tracking

**Scenario:** You want to track your morning productivity routine.

**Setup:**
1. Create custom event: "Morning Routine Complete"
   - Base points: 30
   - Weightage: 1.5x
   - Category: Wellness
   
2. Set daily goal: "Complete morning routine"
   - Goal type: Specific events
   - Target: 1 occurrence
   - Reward: "Morning Champion Badge"

**Daily Workflow:**
```
7:00 AM - Wake up
7:30 AM - Log "Morning Routine Complete" event
         → Earn 45 points (30 × 1.5)
         → Complete daily goal
         → Unlock reward
```

### Example 2: Deep Work Sessions

**Scenario:** You want to maximize focus time with bonus points.

**Setup:**
1. Use default "Deep Work Session" event (25 pts, 1.5x)
2. Set daily goal: "3 hours of productive time"
   - Goal type: Productive hours
   - Target: 180 minutes
   - Reward: "Focus Master Theme"

**Daily Workflow:**
```
9:00 AM - Start deep work
10:30 AM - Log "Deep Work Session" (90 minutes)
          → Base: 25 pts
          → Duration bonus: +12 pts (6 × 2)
          → Weightage: 1.5x
          → Total: (25 + 12) × 1.5 = 55.5 pts
          → Progress: 90/180 minutes

2:00 PM - Log another session (90 minutes)
         → Earn another 55.5 pts
         → Progress: 180/180 minutes ✓
         → Goal completed!
         → Unlock "Focus Master Theme"
```

### Example 3: Retroactive Weightage Adjustment

**Scenario:** You realize "Exercise" events should be worth more.

**Current State:**
- Exercise: 30 pts, 1.4x weightage
- You've logged 5 exercise events this week

**Adjustment:**
1. Go to Event Types settings
2. Find "Exercise" event
3. Update weightage: 1.4x → 2.0x
4. Add reason: "Prioritizing health more"

**Result:**
- Future exercise events: 30 × 2.0 = 60 points
- Past events remain at their original value
- Weightage history is tracked for reference

### Example 4: Custom Event for Client Calls

**Scenario:** You want to track client interactions.

**Create Event:**
```json
{
  "name": "Client Call",
  "description": "Successful client interaction",
  "category": "custom",
  "defaultPoints": 40,
  "defaultWeightage": 1.8,
  "icon": "phone",
  "color": "#10B981"
}
```

**Log Event with Duration:**
```
Client call lasted 45 minutes
→ Base: 40 pts
→ Duration: +6 pts (3 × 2)
→ Weightage: 1.8x
→ Total: (40 + 6) × 1.8 = 82.8 pts
```

## API Usage

### Log an Event

```javascript
POST /api/gamification/events/log

{
  "eventTypeId": "uuid-of-event-type",
  "occurredAt": "2024-02-22T10:30:00Z",
  "durationMinutes": 60,
  "notes": "Completed project proposal",
  "metadata": {
    "projectId": "proj-123",
    "taskId": "task-456"
  }
}

Response:
{
  "message": "Event logged successfully",
  "event": { ... },
  "pointsEarned": 45,
  "profile": {
    "totalPoints": 1250,
    "currentLevel": 4,
    "experiencePoints": 1250,
    "pointsToNextLevel": 350,
    "dailyStreak": 12
  }
}
```

### Create Custom Event Type

```javascript
POST /api/gamification/event-types

{
  "name": "Code Review",
  "description": "Reviewed teammate's code",
  "category": "productivity",
  "defaultPoints": 15,
  "defaultWeightage": 1.2,
  "icon": "code",
  "color": "#8B5CF6"
}
```

### Create Daily Goal

```javascript
POST /api/gamification/daily-goals

{
  "goalType": "productive_hours",
  "targetValue": 180,  // 3 hours in minutes
  "rewardId": "uuid-of-reward"
}
```

### Update Event Weightage

```javascript
PUT /api/gamification/event-types/:id

{
  "defaultWeightage": 2.0,
  "reason": "Increasing importance of this activity"
}
```

## UI Components

### Event Logger Component

Quick-log events with visual categories:

```tsx
<EventLogger
  eventTypes={eventTypes}
  onLogEvent={handleLogEvent}
  onCreateEventType={handleCreateEventType}
/>
```

**Features:**
- Categorized event display
- Quick-tap logging
- Detailed logging with duration and notes
- Real-time points calculation preview
- Custom event creation modal

### Daily Goals Widget

Track progress toward daily goals:

```tsx
<DailyGoals
  goals={todayGoals}
  onCreateGoal={handleCreateGoal}
/>
```

**Features:**
- Visual progress bars
- Real-time progress updates
- Reward display
- Goal completion animations
- Quick goal creation

### Gamification Profile Widget

Display user's gamification stats:

```tsx
<GamificationProfileWidget
  profile={userProfile}
/>
```

**Features:**
- Level display with progress bar
- Total points and streak
- Achievements and rewards count
- Visual gradient design
- Personal best tracking

### Rewards Showcase

Browse and claim available rewards:

```tsx
<RewardsShowcase
  rewards={availableRewards}
  onClaimReward={handleClaimReward}
/>
```

**Features:**
- Visual reward cards
- Unlock progress display
- One-click claiming
- Locked/unlocked states
- Reward details modal

## Database Schema Highlights

### Key Tables

1. **event_types** - Defines trackable events
2. **user_events** - Logs of actual events
3. **user_gamification_profiles** - User stats and progress
4. **daily_goals** - Daily objectives
5. **rewards** - Unlockable incentives
6. **user_rewards** - Claimed rewards
7. **achievements** - Milestone badges
8. **user_achievements** - Earned achievements
9. **event_weightage_history** - Tracks weightage changes

### Automatic Triggers

**On Event Log:**
1. Update user's total points
2. Calculate new level
3. Update daily streak
4. Check daily goal progress
5. Auto-unlock rewards if goals completed
6. Check for new achievements

## Best Practices

### 1. Event Granularity

**Too Broad:**
❌ "Worked" - Not specific enough

**Too Narrow:**
❌ "Opened email #47" - Too granular

**Just Right:**
✅ "Email Inbox Zero" - Meaningful milestone
✅ "Deep Work Session" - Significant activity
✅ "Exercise Complete" - Clear accomplishment

### 2. Weightage Strategy

**Start Conservative:**
- Begin with 1.0x for most events
- Observe patterns for 1-2 weeks
- Adjust based on actual importance

**Adjust Strategically:**
- High-impact activities: 1.5x - 2.0x
- Regular activities: 1.0x - 1.3x
- Small wins: 0.8x - 1.0x

### 3. Goal Setting

**SMART Goals:**
- Specific: "3 hours productive time"
- Measurable: Tracked automatically
- Achievable: Based on your patterns
- Relevant: Aligned with priorities
- Time-bound: Daily reset

**Progressive Difficulty:**
- Week 1: Easy goals (build habit)
- Week 2-3: Moderate goals (establish routine)
- Week 4+: Challenging goals (push limits)

### 4. Reward Design

**Immediate Rewards:**
- Unlock after 1-3 days of effort
- Keep motivation high
- Examples: Themes, badges

**Medium-term Rewards:**
- Unlock after 1-2 weeks
- Sustain engagement
- Examples: Features, analytics

**Long-term Rewards:**
- Unlock after months
- Aspirational goals
- Examples: Premium features, exclusive content

## Advanced Features

### Leaderboards (Optional)

Compare your progress with others:
- Daily leaderboard (resets daily)
- Weekly leaderboard (resets Monday)
- Monthly leaderboard (resets 1st)
- All-time leaderboard (permanent)

### Points Multipliers

Temporary boosts to point earning:
- 2x points for 24 hours (streak reward)
- 1.5x points during focus hours
- 3x points for challenge events

### Challenge Events

Special limited-time events:
- "100 Points in 24 Hours"
- "7-Day Perfect Streak"
- "Deep Work Marathon"

## Troubleshooting

### Issue: Points not updating

**Check:**
1. Event was logged successfully
2. Database triggers are active
3. Profile exists for user
4. No errors in server logs

### Issue: Goals not completing

**Check:**
1. Goal target value is correct
2. Event type matches goal criteria
3. Date is current day
4. Progress calculation is accurate

### Issue: Rewards not unlocking

**Check:**
1. Unlock criteria are met
2. Reward is active
3. Not already claimed
4. Goal completion triggered properly

## Future Enhancements

1. **Team Challenges** - Compete with teammates
2. **Seasonal Events** - Limited-time special events
3. **Custom Badges** - Design your own achievements
4. **Social Sharing** - Share achievements on social media
5. **AI Recommendations** - Smart event suggestions
6. **Habit Stacking** - Link events for bonus points
7. **Time-of-Day Bonuses** - Extra points during peak hours
8. **Combo Multipliers** - Chain events for multipliers

---

## Quick Start Checklist

- [ ] Review default event types
- [ ] Create 2-3 custom events for your workflow
- [ ] Set your first daily goal
- [ ] Log your first event
- [ ] Check your profile stats
- [ ] Adjust event weightages after 1 week
- [ ] Unlock your first reward
- [ ] Earn your first achievement
- [ ] Build a 7-day streak
- [ ] Reach Level 5

**The gamification system is designed to make productivity tracking engaging, flexible, and rewarding. Start small, track what matters to you, and adjust as you learn what motivates you most!**
