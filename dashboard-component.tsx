// FocusFlow Dashboard Component
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TaskCard } from '@/components/tasks/TaskCard';
import { HabitStreak } from '@/components/habits/HabitStreak';
import { ProductivityChart } from '@/components/analytics/ProductivityChart';
import { AIInsights } from '@/components/analytics/AIInsights';
import { Plus, Clock, Target, TrendingUp } from 'lucide-react';

interface DashboardStats {
  tasksCompleted: number;
  tasksPending: number;
  habitsCompletedToday: number;
  totalHabits: number;
  productivityScore: number;
  weeklyProgress: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, getTodayTasks } = useTasks();
  const { habits, getTodayHabits } = useHabits();
  const { getDashboardStats } = useAnalytics();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load today's tasks and habits
        await Promise.all([
          getTodayTasks(),
          getTodayHabits()
        ]);

        // Get dashboard statistics
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [getTodayTasks, getTodayHabits, getDashboardStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's your productivity overview for today
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tasks Completed
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.tasksCompleted}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Tasks
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.tasksPending}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Habits Today
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.habitsCompletedToday}/{stats.totalHabits}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Productivity Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.productivityScore}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Tasks */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Today's Tasks
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tasks?.length || 0} tasks for today
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <TaskCard key={task.id} task={task} compact />
                    ))}
                    {tasks.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-center"
                      >
                        View all tasks →
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No tasks for today
                    </p>
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Habits & Streaks */}
          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-sm mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daily Habits
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keep your streak alive!
                </p>
              </CardHeader>
              <CardContent>
                {habits && habits.length > 0 ? (
                  <div className="space-y-3">
                    {habits.slice(0, 3).map((habit) => (
                      <HabitStreak key={habit.id} habit={habit} compact />
                    ))}
                    {habits.length > 3 && (
                      <Button
                        variant="ghost"
                        className="w-full text-center"
                      >
                        View all habits →
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No habits yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <AIInsights compact />
          </div>
        </div>

        {/* Productivity Chart */}
        <div className="mt-6">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weekly Progress
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your productivity over the last 7 days
              </p>
            </CardHeader>
            <CardContent>
              <ProductivityChart period="week" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
