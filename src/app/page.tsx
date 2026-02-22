'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  EventType, UserEvent, DailyGoal, GamificationProfile, Achievement, Reward,
  getEventTypes, saveEventTypes, getUserEvents, saveUserEvents,
  getProfile, saveProfile, getDailyGoals, saveDailyGoals,
  getAchievements, saveAchievements, getRewards, saveRewards,
  calculateLevel, pointsForNextLevel, calculatePoints, getTodayEvents, generateId,
} from '@/lib/store'

// ─── Tabs ──────────────────────────────────────────────
type Tab = 'dashboard' | 'events' | 'goals' | 'achievements' | 'rewards'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [userEvents, setUserEvents] = useState<UserEvent[]>([])
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [todayEvents, setTodayEvents] = useState<UserEvent[]>([])
  const [mounted, setMounted] = useState(false)

  // Modals
  const [showLogEvent, setShowLogEvent] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [logDuration, setLogDuration] = useState('')
  const [logNotes, setLogNotes] = useState('')
  const [notification, setNotification] = useState<string | null>(null)

  // Create event form
  const [newEventName, setNewEventName] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventCategory, setNewEventCategory] = useState<EventType['category']>('custom')
  const [newEventPoints, setNewEventPoints] = useState('10')
  const [newEventWeightage, setNewEventWeightage] = useState('1.0')
  const [newEventIcon, setNewEventIcon] = useState('⭐')

  // Create goal form
  const [newGoalType, setNewGoalType] = useState<DailyGoal['goalType']>('points_target')
  const [newGoalTarget, setNewGoalTarget] = useState('100')
  const [newGoalReward, setNewGoalReward] = useState('')

  // Load data from localStorage
  useEffect(() => {
    setProfile(getProfile())
    setEventTypes(getEventTypes())
    setUserEvents(getUserEvents())
    setDailyGoals(getDailyGoals())
    setAchievements(getAchievements())
    setRewards(getRewards())
    setTodayEvents(getTodayEvents())
    setMounted(true)
  }, [])

  const showNotif = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Check achievements after profile update
  const checkAchievements = useCallback((prof: GamificationProfile, achs: Achievement[]): Achievement[] => {
    let changed = false
    const updated = achs.map(a => {
      if (a.unlocked) return a
      let shouldUnlock = false
      if (a.criteria.startsWith('events >=')) shouldUnlock = prof.eventsLogged >= parseInt(a.criteria.split('>= ')[1])
      else if (a.criteria.startsWith('points >=')) shouldUnlock = prof.totalPoints >= parseInt(a.criteria.split('>= ')[1])
      else if (a.criteria.startsWith('streak >=')) shouldUnlock = prof.dailyStreak >= parseInt(a.criteria.split('>= ')[1])
      else if (a.criteria.startsWith('level >=')) shouldUnlock = prof.currentLevel >= parseInt(a.criteria.split('>= ')[1])
      if (shouldUnlock) {
        changed = true
        return { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
      }
      return a
    })
    if (changed) {
      saveAchievements(updated)
      const newlyUnlocked = updated.filter((a, i) => a.unlocked && !achs[i].unlocked)
      if (newlyUnlocked.length > 0) {
        showNotif(`🏆 Achievement Unlocked: ${newlyUnlocked[0].name}!`)
      }
    }
    return updated
  }, [showNotif])

  // Log an event
  const handleLogEvent = () => {
    if (!selectedEventType || !profile) return
    const dur = logDuration ? parseInt(logDuration) : null
    const pts = calculatePoints(selectedEventType.defaultPoints, selectedEventType.defaultWeightage, dur)

    const newEvent: UserEvent = {
      id: generateId(),
      eventTypeId: selectedEventType.id,
      eventTypeName: selectedEventType.name,
      pointsEarned: pts,
      durationMinutes: dur,
      notes: logNotes,
      occurredAt: new Date().toISOString(),
      category: selectedEventType.category,
      color: selectedEventType.color,
    }

    const updatedEvents = [newEvent, ...userEvents]
    saveUserEvents(updatedEvents)
    setUserEvents(updatedEvents)
    setTodayEvents([newEvent, ...todayEvents])

    // Update profile
    const lastEventDate = profile.eventsLogged > 0
      ? userEvents[0]?.occurredAt.split('T')[0]
      : null
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let newStreak = profile.dailyStreak
    if (lastEventDate === yesterday || (lastEventDate !== today && profile.dailyStreak === 0)) {
      newStreak = profile.dailyStreak + 1
    } else if (lastEventDate !== today && lastEventDate !== yesterday) {
      newStreak = 1
    }

    const newXP = profile.experiencePoints + pts
    const updatedProfile: GamificationProfile = {
      ...profile,
      totalPoints: profile.totalPoints + pts,
      experiencePoints: newXP,
      currentLevel: calculateLevel(newXP),
      eventsLogged: profile.eventsLogged + 1,
      dailyStreak: newStreak,
      longestStreak: Math.max(profile.longestStreak, newStreak),
    }
    saveProfile(updatedProfile)
    setProfile(updatedProfile)

    // Update daily goals
    const updatedGoals = dailyGoals.map(g => {
      if (g.isCompleted) return g
      let newValue = g.currentValue
      if (g.goalType === 'points_target') newValue += pts
      else if (g.goalType === 'events_count') newValue += 1
      else if (g.goalType === 'productive_hours' && dur) newValue += dur
      const completed = newValue >= g.targetValue
      if (completed && !g.isCompleted) showNotif(`🎯 Goal Complete: ${g.rewardDescription || 'Daily goal achieved!'}`)
      return { ...g, currentValue: newValue, isCompleted: completed }
    })
    saveDailyGoals(updatedGoals)
    setDailyGoals(updatedGoals)

    // Check achievements
    const updatedAchs = checkAchievements(updatedProfile, achievements)
    setAchievements(updatedAchs)

    showNotif(`+${pts} points! ${selectedEventType.icon} ${selectedEventType.name}`)
    setShowLogEvent(false)
    setSelectedEventType(null)
    setLogDuration('')
    setLogNotes('')
  }

  // Create custom event type
  const handleCreateEventType = () => {
    if (!newEventName.trim()) return
    const newType: EventType = {
      id: generateId(),
      name: newEventName,
      description: newEventDesc,
      category: newEventCategory,
      defaultPoints: parseInt(newEventPoints) || 10,
      defaultWeightage: parseFloat(newEventWeightage) || 1.0,
      icon: newEventIcon,
      color: categoryColors[newEventCategory],
      isSystem: false,
    }
    const updated = [...eventTypes, newType]
    saveEventTypes(updated)
    setEventTypes(updated)
    setShowCreateEvent(false)
    setNewEventName('')
    setNewEventDesc('')
    setNewEventPoints('10')
    setNewEventWeightage('1.0')
    setNewEventIcon('⭐')
    showNotif(`Created event: ${newEventName}`)
  }

  // Create daily goal
  const handleCreateGoal = () => {
    const newGoal: DailyGoal = {
      id: generateId(),
      goalType: newGoalType,
      targetValue: parseInt(newGoalTarget) || 100,
      currentValue: 0,
      isCompleted: false,
      rewardDescription: newGoalReward || goalTypeLabels[newGoalType],
      date: new Date().toISOString().split('T')[0],
    }
    const allGoals = [...getDailyGoals(), newGoal]
    // Also get goals from other days to preserve them
    const otherGoals = (JSON.parse(localStorage.getItem('focusflow_daily_goals') || '[]') as DailyGoal[])
      .filter(g => g.date !== new Date().toISOString().split('T')[0])
    saveDailyGoals([...otherGoals, ...allGoals])
    setDailyGoals(allGoals)
    setShowCreateGoal(false)
    setNewGoalTarget('100')
    setNewGoalReward('')
    showNotif(`New goal set!`)
  }

  // Claim reward
  const handleClaimReward = (rewardId: string) => {
    if (!profile) return
    const updated = rewards.map(r => {
      if (r.id !== rewardId) return r
      return { ...r, claimed: true }
    })
    saveRewards(updated)
    setRewards(updated)
    const updatedProfile = { ...profile, rewardsClaimed: profile.rewardsClaimed + 1 }
    saveProfile(updatedProfile)
    setProfile(updatedProfile)
    showNotif(`🎁 Reward claimed!`)
  }

  const canClaimReward = (r: Reward): boolean => {
    if (!profile || r.claimed) return false
    if (r.unlockCriteria === 'points') return profile.totalPoints >= r.unlockValue
    if (r.unlockCriteria === 'level') return profile.currentLevel >= r.unlockValue
    if (r.unlockCriteria === 'streak') return profile.dailyStreak >= r.unlockValue
    return false
  }

  const rewardProgress = (r: Reward): number => {
    if (!profile) return 0
    if (r.unlockCriteria === 'points') return Math.min(100, (profile.totalPoints / r.unlockValue) * 100)
    if (r.unlockCriteria === 'level') return Math.min(100, (profile.currentLevel / r.unlockValue) * 100)
    if (r.unlockCriteria === 'streak') return Math.min(100, (profile.dailyStreak / r.unlockValue) * 100)
    return 0
  }

  if (!mounted || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎯</div>
          <p className="text-lg text-gray-500">Loading FocusFlow...</p>
        </div>
      </div>
    )
  }

  const levelProgress = profile.experiencePoints > 0
    ? ((profile.experiencePoints - (profile.currentLevel - 1) * (profile.currentLevel - 1) * 100) /
       (pointsForNextLevel(profile.currentLevel) - (profile.currentLevel - 1) * (profile.currentLevel - 1) * 100)) * 100
    : 0

  const todayPoints = todayEvents.reduce((sum, e) => sum + e.pointsEarned, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in bg-white border border-primary-200 text-primary-700 px-6 py-3 rounded-xl shadow-lg font-medium">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h1 className="text-xl font-bold text-slate-800">FocusFlow</h1>
                <p className="text-xs text-slate-500">AI-Powered Productivity</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm">🔥</span>
                <span className="text-sm font-bold text-primary-700">{profile.dailyStreak} day streak</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm">⭐</span>
                <span className="text-sm font-bold text-amber-700">Lv.{profile.currentLevel}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm">💎</span>
                <span className="text-sm font-bold text-emerald-700">{Math.round(profile.totalPoints)} pts</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── DASHBOARD TAB ─── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Card */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Level {profile.currentLevel}</h2>
                  <p className="text-primary-200 mt-1">{profile.experiencePoints} XP total</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.round(profile.totalPoints)}</p>
                    <p className="text-xs text-primary-200">Total Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.dailyStreak}</p>
                    <p className="text-xs text-primary-200">Day Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.eventsLogged}</p>
                    <p className="text-xs text-primary-200">Events</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Level {profile.currentLevel}</span>
                  <span>Level {profile.currentLevel + 1}</span>
                </div>
                <div className="w-full bg-primary-900/40 rounded-full h-3">
                  <div
                    className="bg-white/90 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
                  />
                </div>
                <p className="text-xs text-primary-200 mt-1">
                  {Math.round(pointsForNextLevel(profile.currentLevel) - profile.experiencePoints)} XP to next level
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Today&apos;s Points</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{Math.round(todayPoints)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Today&apos;s Events</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{todayEvents.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Achievements</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{achievements.filter(a => a.unlocked).length}/{achievements.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Best Streak</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{profile.longestStreak} days</p>
              </div>
            </div>

            {/* Quick Log + Goals Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Log */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Quick Log Event</h3>
                  <button
                    onClick={() => setShowCreateEvent(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Custom Event
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {eventTypes.slice(0, 6).map(et => (
                    <button
                      key={et.id}
                      onClick={() => { setSelectedEventType(et); setShowLogEvent(true) }}
                      className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                    >
                      <span className="text-xl">{et.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{et.name}</p>
                        <p className="text-xs text-slate-400">{et.defaultPoints}pts</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Goals */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Daily Goals</h3>
                  <button
                    onClick={() => setShowCreateGoal(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + New Goal
                  </button>
                </div>
                {dailyGoals.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-3xl mb-2">🎯</p>
                    <p className="text-sm">No goals set for today</p>
                    <button
                      onClick={() => setShowCreateGoal(true)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Create your first goal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyGoals.map(g => (
                      <div key={g.id} className="p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">{g.rewardDescription}</span>
                          {g.isCompleted && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Done</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${g.isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`}
                            style={{ width: `${Math.min(100, (g.currentValue / g.targetValue) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {Math.round(g.currentValue)} / {g.targetValue} {goalTypeUnits[g.goalType]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
              {todayEvents.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">No events logged today. Start tracking!</p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{e.eventTypeName}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(e.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {e.durationMinutes && ` · ${e.durationMinutes} min`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">+{e.pointsEarned}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── EVENTS TAB ─── */}
        {activeTab === 'events' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Event Types</h2>
              <button
                onClick={() => setShowCreateEvent(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                + Create Custom Event
              </button>
            </div>

            {/* Categories */}
            {(['productivity', 'wellness', 'learning', 'social', 'custom'] as const).map(cat => {
              const catEvents = eventTypes.filter(e => e.category === cat)
              if (catEvents.length === 0) return null
              return (
                <div key={cat}>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {categoryIcons[cat]} {cat}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catEvents.map(et => (
                      <div
                        key={et.id}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => { setSelectedEventType(et); setShowLogEvent(true) }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{et.icon}</span>
                          <div>
                            <p className="font-medium text-slate-800">{et.name}</p>
                            <p className="text-xs text-slate-400">{et.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">Points:</span>
                            <span className="text-sm font-bold text-slate-700">{et.defaultPoints}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">Weight:</span>
                            <span className="text-sm font-bold text-slate-700">{et.defaultWeightage}x</span>
                          </div>
                          {!et.isSystem && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full ml-auto">Custom</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Event History */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Event History</h3>
              {userEvents.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">No events logged yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userEvents.slice(0, 50).map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{e.eventTypeName}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(e.occurredAt).toLocaleDateString()} {new Date(e.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {e.durationMinutes && ` · ${e.durationMinutes} min`}
                            {e.notes && ` · ${e.notes}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">+{e.pointsEarned}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── GOALS TAB ─── */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Daily Goals</h2>
              <button
                onClick={() => setShowCreateGoal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                + New Goal
              </button>
            </div>

            {dailyGoals.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
                <p className="text-4xl mb-3">🎯</p>
                <h3 className="text-lg font-semibold text-slate-700">No Goals Set</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">Set daily goals to earn rewards and stay motivated</p>
                <button
                  onClick={() => setShowCreateGoal(true)}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Create Your First Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dailyGoals.map(g => (
                  <div key={g.id} className={`bg-white rounded-xl p-6 shadow-sm border ${g.isCompleted ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{g.isCompleted ? '✅' : '🎯'}</span>
                        <h3 className="font-semibold text-slate-800">{g.rewardDescription}</h3>
                      </div>
                      {g.isCompleted && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Completed!</span>}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      {goalTypeLabels[g.goalType]}: {g.targetValue} {goalTypeUnits[g.goalType]}
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${g.isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`}
                        style={{ width: `${Math.min(100, (g.currentValue / g.targetValue) * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium text-slate-600 mt-2">
                      {Math.round(g.currentValue)} / {g.targetValue} {goalTypeUnits[g.goalType]}
                      <span className="text-slate-400 ml-2">({Math.round((g.currentValue / g.targetValue) * 100)}%)</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ACHIEVEMENTS TAB ─── */}
        {activeTab === 'achievements' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800">
              Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(a => (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${
                    a.unlocked ? 'border-amber-300 shadow-amber-100' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{a.unlocked ? tierIcons[a.tier] : '🔒'}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierStyles[a.tier]}`}>
                      {a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}
                    </span>
                    <span className="text-xs text-slate-400">+{a.bonusPoints} pts</span>
                  </div>
                  {a.unlocked && a.unlockedAt && (
                    <p className="text-xs text-emerald-500 mt-2">
                      Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── REWARDS TAB ─── */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800">Rewards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(r => (
                <div
                  key={r.id}
                  className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${
                    r.claimed ? 'border-emerald-300 bg-emerald-50' : canClaimReward(r) ? 'border-primary-300 shadow-primary-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.description}</p>
                    </div>
                  </div>
                  {!r.claimed && (
                    <>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${rewardProgress(r)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Requires {r.unlockValue} {r.unlockCriteria} ({Math.round(rewardProgress(r))}%)
                      </p>
                    </>
                  )}
                  {r.claimed ? (
                    <span className="inline-block text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">✓ Claimed</span>
                  ) : canClaimReward(r) ? (
                    <button
                      onClick={() => handleClaimReward(r.id)}
                      className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Claim Reward 🎁
                    </button>
                  ) : (
                    <span className="inline-block text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">🔒 Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── LOG EVENT MODAL ─── */}
      {showLogEvent && selectedEventType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLogEvent(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedEventType.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedEventType.name}</h3>
                <p className="text-sm text-slate-400">{selectedEventType.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Duration (minutes, optional)</label>
                <input
                  type="number"
                  value={logDuration}
                  onChange={e => setLogDuration(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="What did you accomplish?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-500">Points preview:</p>
                <p className="text-2xl font-bold text-primary-600">
                  +{calculatePoints(selectedEventType.defaultPoints, selectedEventType.defaultWeightage, logDuration ? parseInt(logDuration) : null)} pts
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedEventType.defaultPoints} base × {selectedEventType.defaultWeightage}x weight
                  {logDuration && ` + ${Math.floor(parseInt(logDuration) / 15) * 2} duration bonus`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogEvent(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogEvent}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Log Event ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE EVENT TYPE MODAL ─── */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateEvent(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Custom Event</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Icon</label>
                  <input
                    type="text"
                    value={newEventIcon}
                    onChange={e => setNewEventIcon(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    placeholder="Event name"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  placeholder="Brief description"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={newEventCategory}
                  onChange={e => setNewEventCategory(e.target.value as EventType['category'])}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="productivity">🚀 Productivity</option>
                  <option value="wellness">💚 Wellness</option>
                  <option value="learning">📚 Learning</option>
                  <option value="social">👥 Social</option>
                  <option value="custom">⭐ Custom</option>
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Base Points</label>
                  <input
                    type="number"
                    value={newEventPoints}
                    onChange={e => setNewEventPoints(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Weightage</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEventWeightage}
                    onChange={e => setNewEventWeightage(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEventType}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE GOAL MODAL ─── */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateGoal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Set Daily Goal</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Goal Type</label>
                <select
                  value={newGoalType}
                  onChange={e => setNewGoalType(e.target.value as DailyGoal['goalType'])}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="points_target">Points Target</option>
                  <option value="events_count">Events Count</option>
                  <option value="productive_hours">Productive Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Target ({goalTypeUnits[newGoalType]})
                </label>
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={e => setNewGoalTarget(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Goal Description / Reward</label>
                <input
                  type="text"
                  value={newGoalReward}
                  onChange={e => setNewGoalReward(e.target.value)}
                  placeholder="e.g. Earn 100 points today"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateGoal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Set Goal 🎯
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// ─── Constants ──────────────────────────────────────────
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'events', label: 'Events', icon: '⚡' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
]

const categoryColors: Record<string, string> = {
  productivity: '#6366F1',
  wellness: '#10B981',
  learning: '#8B5CF6',
  social: '#F59E0B',
  custom: '#EC4899',
}

const categoryIcons: Record<string, string> = {
  productivity: '🚀',
  wellness: '💚',
  learning: '📚',
  social: '👥',
  custom: '⭐',
}

const goalTypeLabels: Record<string, string> = {
  productive_hours: 'Productive Minutes',
  events_count: 'Events Count',
  points_target: 'Points Target',
}

const goalTypeUnits: Record<string, string> = {
  productive_hours: 'min',
  events_count: 'events',
  points_target: 'pts',
}

const tierIcons: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
}

const tierStyles: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-slate-100 text-slate-700',
  gold: 'bg-amber-100 text-amber-700',
  platinum: 'bg-purple-100 text-purple-700',
  diamond: 'bg-cyan-100 text-cyan-700',
}
