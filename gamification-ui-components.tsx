// FocusFlow Gamification UI Components
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { 
  Star, Trophy, Target, Zap, Gift, Plus, Edit2, 
  TrendingUp, Award, Flame, Crown, Check 
} from 'lucide-react';

// ==================== EVENT LOGGER COMPONENT ====================

interface EventType {
  id: string;
  name: string;
  category: string;
  defaultPoints: number;
  defaultWeightage: number;
  icon: string;
  color: string;
  isSystemDefault: boolean;
}

interface EventLoggerProps {
  eventTypes: EventType[];
  onLogEvent: (eventData: any) => Promise<void>;
  onCreateEventType: (eventTypeData: any) => Promise<void>;
}

export function EventLogger({ eventTypes, onLogEvent, onCreateEventType }: EventLoggerProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLog = async (eventType: EventType) => {
    setLoading(true);
    try {
      await onLogEvent({
        eventTypeId: eventType.id,
        occurredAt: new Date().toISOString(),
      });
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to log event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedLog = async () => {
    if (!selectedEvent) return;

    setLoading(true);
    try {
      await onLogEvent({
        eventTypeId: selectedEvent.id,
        occurredAt: new Date().toISOString(),
        durationMinutes: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
      });
      setSelectedEvent(null);
      setDuration('');
      setNotes('');
      setShowCustomForm(false);
    } catch (error) {
      console.error('Failed to log event:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['productivity', 'wellness', 'learning', 'social', 'custom'];

  return (
    <div className="space-y-6">
      {/* Quick Log Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Log Event</h3>
              <p className="text-sm text-gray-600">Track your daily activities</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories.map(category => {
            const categoryEvents = eventTypes.filter(et => et.category === category);
            if (categoryEvents.length === 0) return null;

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                  {category}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryEvents.map(eventType => (
                    <button
                      key={eventType.id}
                      onClick={() => {
                        setSelectedEvent(eventType);
                        setShowCustomForm(true);
                      }}
                      className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                      style={{ borderColor: eventType.color + '40' }}
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        style={{ backgroundColor: eventType.color + '20' }}
                      >
                        <Star className="w-6 h-6" style={{ color: eventType.color }} />
                      </div>
                      <span className="text-sm font-medium text-center">
                        {eventType.name}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        +{eventType.defaultPoints} pts
                      </span>
                      {eventType.defaultWeightage !== 1.0 && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {eventType.defaultWeightage}x
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detailed Log Modal */}
      {showCustomForm && selectedEvent && (
        <Modal
          isOpen={showCustomForm}
          onClose={() => {
            setShowCustomForm(false);
            setSelectedEvent(null);
            setDuration('');
            setNotes('');
          }}
          title={`Log: ${selectedEvent.name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (minutes) - Optional
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bonus points: +2 per 15 minutes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes - Optional
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this event..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Base Points:</span>
                <span className="font-medium">{selectedEvent.defaultPoints}</span>
              </div>
              {duration && (
                <div className="flex justify-between text-sm mt-1">
                  <span>Duration Bonus:</span>
                  <span className="font-medium">
                    +{Math.floor(parseInt(duration) / 15) * 2}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-1">
                <span>Weightage:</span>
                <span className="font-medium">{selectedEvent.defaultWeightage}x</span>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold">
                <span>Total Points:</span>
                <span className="text-primary-600">
                  {Math.round(
                    (selectedEvent.defaultPoints + 
                    (duration ? Math.floor(parseInt(duration) / 15) * 2 : 0)) * 
                    selectedEvent.defaultWeightage
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomForm(false);
                  setSelectedEvent(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDetailedLog}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Logging...' : 'Log Event'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Custom Event Modal */}
      {showCreateModal && (
        <CreateEventTypeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateEventType}
        />
      )}
    </div>
  );
}

// ==================== DAILY GOALS COMPONENT ====================

interface DailyGoal {
  id: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  reward?: {
    id: string;
    name: string;
    icon: string;
  };
}

interface DailyGoalsProps {
  goals: DailyGoal[];
  onCreateGoal: (goalData: any) => Promise<void>;
}

export function DailyGoals({ goals, onCreateGoal }: DailyGoalsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'productive_hours': return <Target className="w-5 h-5" />;
      case 'events_count': return <Zap className="w-5 h-5" />;
      case 'points_target': return <Star className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getGoalLabel = (goalType: string, targetValue: number) => {
    switch (goalType) {
      case 'productive_hours': 
        return `${Math.floor(targetValue / 60)}h ${targetValue % 60}m productive time`;
      case 'events_count': 
        return `${targetValue} events logged`;
      case 'points_target': 
        return `${targetValue} points earned`;
      default: 
        return `Goal: ${targetValue}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Today's Goals</h3>
            <p className="text-sm text-gray-600">
              Complete goals to unlock rewards
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No goals set for today</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = (goal.currentValue / goal.targetValue) * 100;
              
              return (
                <div
                  key={goal.id}
                  className={`p-4 border-2 rounded-lg ${
                    goal.isCompleted 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        goal.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100'
                      }`}>
                        {goal.isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          getGoalIcon(goal.goalType)
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getGoalLabel(goal.goalType, goal.targetValue)}
                        </p>
                        {goal.reward && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Gift className="w-4 h-4" />
                            Reward: {goal.reward.name}
                          </p>
                        )}
                      </div>
                    </div>
                    {goal.isCompleted && (
                      <Badge variant="success">Completed!</Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span className="font-medium">
                        {goal.currentValue} / {goal.targetValue}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          goal.isCompleted ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateGoal}
        />
      )}
    </Card>
  );
}

// ==================== GAMIFICATION PROFILE WIDGET ====================

interface GamificationProfile {
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  pointsToNextLevel: number;
  dailyStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  rewardsClaimed: number;
}

interface ProfileWidgetProps {
  profile: GamificationProfile;
}

export function GamificationProfileWidget({ profile }: ProfileWidgetProps) {
  const levelProgress = 
    ((profile.experiencePoints - 
      ((profile.currentLevel - 1) ** 2 * 100)) / 
     (profile.currentLevel ** 2 * 100)) * 100;

  return (
    <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-100 text-sm">Your Level</p>
            <h2 className="text-4xl font-bold">{profile.currentLevel}</h2>
          </div>
          <div className="p-4 bg-white/20 rounded-full">
            <Crown className="w-8 h-8" />
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to Level {profile.currentLevel + 1}</span>
            <span className="font-medium">{profile.pointsToNextLevel} XP to go</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Total Points</span>
            </div>
            <p className="text-2xl font-bold">{profile.totalPoints.toLocaleString()}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-sm">Streak</span>
            </div>
            <p className="text-2xl font-bold">{profile.dailyStreak} days</p>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">Achievements</span>
            </div>
            <p className="text-2xl font-bold">{profile.achievementsUnlocked}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4" />
              <span className="text-sm">Rewards</span>
            </div>
            <p className="text-2xl font-bold">{profile.rewardsClaimed}</p>
          </div>
        </div>

        {profile.longestStreak > profile.dailyStreak && (
          <div className="mt-4 text-center text-sm text-primary-100">
            Personal best: {profile.longestStreak} day streak
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== REWARDS SHOWCASE ====================

interface Reward {
  id: string;
  name: string;
  description: string;
  rewardType: string;
  icon: string;
  color: string;
  isUnlockable: boolean;
  progress?: any;
}

interface RewardsShowcaseProps {
  rewards: Reward[];
  onClaimReward: (rewardId: string) => Promise<void>;
}

export function RewardsShowcase({ rewards, onClaimReward }: RewardsShowcaseProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Available Rewards</h3>
        <p className="text-sm text-gray-600">Unlock rewards by achieving goals</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <div
              key={reward.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reward.isUnlockable
                  ? 'border-primary-500 hover:shadow-lg'
                  : 'border-gray-200 opacity-60'
              }`}
              onClick={() => setSelectedReward(reward)}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: reward.color + '20' }}
                >
                  <Gift className="w-6 h-6" style={{ color: reward.color }} />
                </div>
                {reward.isUnlockable && (
                  <Badge variant="success">Ready!</Badge>
                )}
              </div>

              <h4 className="font-semibold mb-1">{reward.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{reward.description}</p>

              {!reward.isUnlockable && reward.progress && (
                <div className="space-y-1">
                  {Object.entries(reward.progress).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-xs text-gray-500">
                      {key}: {value.current} / {value.required}
                    </div>
                  ))}
                </div>
              )}

              {reward.isUnlockable && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaimReward(reward.id);
                  }}
                >
                  Claim Reward
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== HELPER MODALS ====================

function CreateEventTypeModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    defaultPoints: 10,
    defaultWeightage: 1.0,
    icon: 'star',
    color: '#3B82F6'
  });

  const handleSubmit = async () => {
    await onCreate(formData);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Custom Event Type">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Event Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Workout"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Base Points</label>
            <Input
              type="number"
              value={formData.defaultPoints}
              onChange={(e) => setFormData({ ...formData, defaultPoints: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weightage</label>
            <Input
              type="number"
              step="0.1"
              value={formData.defaultWeightage}
              onChange={(e) => setFormData({ ...formData, defaultWeightage: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Multiplier for scoring</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Create Event Type
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateGoalModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    goalType: 'productive_hours',
    targetValue: 180, // 3 hours in minutes
  });

  const handleSubmit = async () => {
    await onCreate(formData);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Daily Goal">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Goal Type</label>
          <select
            value={formData.goalType}
            onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="productive_hours">Productive Hours</option>
            <option value="events_count">Events Count</option>
            <option value="points_target">Points Target</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Target Value
            {formData.goalType === 'productive_hours' && ' (minutes)'}
          </label>
          <Input
            type="number"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) })}
          />
          {formData.goalType === 'productive_hours' && (
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(formData.targetValue / 60)}h {formData.targetValue % 60}m
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Create Goal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
