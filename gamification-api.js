// FocusFlow Gamification API Controller
const { EventType, UserEvent, UserGamificationProfile, DailyGoal, Reward, UserReward, Achievement, UserAchievement } = require('../models');
const logger = require('../utils/logger');

class GamificationController {
  // ==================== EVENT TYPES ====================
  
  // Get all event types (system defaults + user custom)
  static async getEventTypes(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get system defaults and user's custom event types
      const eventTypes = await EventType.findAll({
        where: {
          [Op.or]: [
            { isSystemDefault: true },
            { userId }
          ],
          isActive: true
        },
        order: [['isSystemDefault', 'DESC'], ['name', 'ASC']]
      });

      res.json({
        eventTypes,
        total: eventTypes.length
      });
    } catch (error) {
      logger.error('Get event types error:', error);
      next(error);
    }
  }

  // Create custom event type
  static async createEventType(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, description, category, defaultPoints, defaultWeightage, icon, color } = req.body;

      // Validation
      if (!name || !category) {
        return res.status(400).json({
          error: 'Name and category are required'
        });
      }

      // Check for duplicate name
      const existing = await EventType.findOne({
        where: { userId, name }
      });

      if (existing) {
        return res.status(409).json({
          error: 'Event type with this name already exists'
        });
      }

      const eventType = await EventType.create({
        userId,
        name,
        description,
        category,
        defaultPoints: defaultPoints || 10,
        defaultWeightage: defaultWeightage || 1.00,
        icon: icon || 'star',
        color: color || '#3B82F6',
        isSystemDefault: false
      });

      logger.info(`Custom event type created: ${name} by user ${userId}`);

      res.status(201).json({
        message: 'Event type created successfully',
        eventType
      });
    } catch (error) {
      logger.error('Create event type error:', error);
      next(error);
    }
  }

  // Update event type (weightage, points, etc.)
  static async updateEventType(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { defaultPoints, defaultWeightage, description, icon, color, isActive } = req.body;

      const eventType = await EventType.findOne({
        where: { id, userId }
      });

      if (!eventType) {
        return res.status(404).json({
          error: 'Event type not found or you do not have permission to modify it'
        });
      }

      // Track weightage changes
      if (defaultWeightage && defaultWeightage !== eventType.defaultWeightage) {
        await EventWeightageHistory.create({
          eventTypeId: id,
          userId,
          oldWeightage: eventType.defaultWeightage,
          newWeightage: defaultWeightage,
          reason: req.body.reason || 'Manual update'
        });
      }

      // Update event type
      await eventType.update({
        defaultPoints: defaultPoints !== undefined ? defaultPoints : eventType.defaultPoints,
        defaultWeightage: defaultWeightage !== undefined ? defaultWeightage : eventType.defaultWeightage,
        description: description !== undefined ? description : eventType.description,
        icon: icon !== undefined ? icon : eventType.icon,
        color: color !== undefined ? color : eventType.color,
        isActive: isActive !== undefined ? isActive : eventType.isActive
      });

      logger.info(`Event type updated: ${id} by user ${userId}`);

      res.json({
        message: 'Event type updated successfully',
        eventType
      });
    } catch (error) {
      logger.error('Update event type error:', error);
      next(error);
    }
  }

  // ==================== USER EVENTS ====================

  // Log a new event
  static async logEvent(req, res, next) {
    try {
      const userId = req.user.id;
      const { eventTypeId, occurredAt, durationMinutes, notes, metadata, relatedEntityId, relatedEntityType } = req.body;

      if (!eventTypeId) {
        return res.status(400).json({
          error: 'Event type ID is required'
        });
      }

      // Get event type to calculate points
      const eventType = await EventType.findById(eventTypeId);
      if (!eventType) {
        return res.status(404).json({
          error: 'Event type not found'
        });
      }

      // Calculate points based on weightage
      let basePoints = eventType.defaultPoints;
      
      // Bonus points for duration-based events
      if (durationMinutes) {
        basePoints += Math.floor(durationMinutes / 15) * 2; // 2 points per 15 minutes
      }

      const pointsEarned = Math.round(basePoints * eventType.defaultWeightage);

      // Create event
      const userEvent = await UserEvent.create({
        userId,
        eventTypeId,
        occurredAt: occurredAt || new Date(),
        durationMinutes,
        pointsEarned,
        weightageApplied: eventType.defaultWeightage,
        notes,
        metadata,
        relatedEntityId,
        relatedEntityType
      });

      // Get updated profile (triggers will have updated it)
      const profile = await UserGamificationProfile.findByUserId(userId);

      logger.info(`Event logged: ${eventType.name} by user ${userId}, earned ${pointsEarned} points`);

      res.status(201).json({
        message: 'Event logged successfully',
        event: userEvent,
        pointsEarned,
        profile: {
          totalPoints: profile.totalPoints,
          currentLevel: profile.currentLevel,
          experiencePoints: profile.experiencePoints,
          pointsToNextLevel: profile.pointsToNextLevel,
          dailyStreak: profile.dailyStreak
        }
      });
    } catch (error) {
      logger.error('Log event error:', error);
      next(error);
    }
  }

  // Get user events with filters
  static async getUserEvents(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        startDate,
        endDate,
        eventTypeId,
        category,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        userId,
        startDate,
        endDate,
        eventTypeId,
        category,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const events = await UserEvent.findAllWithFilters(filters);
      const totalCount = await UserEvent.countWithFilters(filters);

      res.json({
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get user events error:', error);
      next(error);
    }
  }

  // Get today's events summary
  static async getTodayEventsSummary(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      const summary = await UserEvent.getTodaySummary(userId, today);

      res.json({
        date: today,
        summary
      });
    } catch (error) {
      logger.error('Get today events summary error:', error);
      next(error);
    }
  }

  // ==================== GAMIFICATION PROFILE ====================

  // Get user's gamification profile
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      let profile = await UserGamificationProfile.findByUserId(userId);

      // Create profile if doesn't exist
      if (!profile) {
        profile = await UserGamificationProfile.create({ userId });
      }

      // Get additional stats
      const recentAchievements = await UserAchievement.findRecent(userId, 5);
      const activeRewards = await UserReward.findActive(userId);

      res.json({
        profile,
        recentAchievements,
        activeRewards
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  // ==================== DAILY GOALS ====================

  // Get today's daily goals
  static async getTodayGoals(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      const goals = await DailyGoal.findByDate(userId, today);

      res.json({
        date: today,
        goals
      });
    } catch (error) {
      logger.error('Get today goals error:', error);
      next(error);
    }
  }

  // Create daily goal
  static async createDailyGoal(req, res, next) {
    try {
      const userId = req.user.id;
      const { goalDate, goalType, targetValue, rewardId, metadata } = req.body;

      if (!goalType || !targetValue) {
        return res.status(400).json({
          error: 'Goal type and target value are required'
        });
      }

      const goal = await DailyGoal.create({
        userId,
        goalDate: goalDate || new Date().toISOString().split('T')[0],
        goalType,
        targetValue,
        rewardId,
        metadata
      });

      logger.info(`Daily goal created: ${goalType} by user ${userId}`);

      res.status(201).json({
        message: 'Daily goal created successfully',
        goal
      });
    } catch (error) {
      logger.error('Create daily goal error:', error);
      next(error);
    }
  }

  // Update daily goal
  static async updateDailyGoal(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { targetValue, rewardId, metadata } = req.body;

      const goal = await DailyGoal.findOne({
        where: { id, userId }
      });

      if (!goal) {
        return res.status(404).json({
          error: 'Daily goal not found'
        });
      }

      await goal.update({
        targetValue: targetValue !== undefined ? targetValue : goal.targetValue,
        rewardId: rewardId !== undefined ? rewardId : goal.rewardId,
        metadata: metadata !== undefined ? metadata : goal.metadata
      });

      res.json({
        message: 'Daily goal updated successfully',
        goal
      });
    } catch (error) {
      logger.error('Update daily goal error:', error);
      next(error);
    }
  }

  // ==================== REWARDS ====================

  // Get available rewards
  static async getAvailableRewards(req, res, next) {
    try {
      const userId = req.user.id;

      const profile = await UserGamificationProfile.findByUserId(userId);
      const allRewards = await Reward.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
      });

      // Check which rewards are unlockable
      const rewardsWithStatus = allRewards.map(reward => {
        const criteria = reward.unlockCriteria;
        let isUnlockable = true;
        let progress = {};

        if (criteria.points && profile.totalPoints < criteria.points) {
          isUnlockable = false;
          progress.points = {
            current: profile.totalPoints,
            required: criteria.points
          };
        }

        if (criteria.level && profile.currentLevel < criteria.level) {
          isUnlockable = false;
          progress.level = {
            current: profile.currentLevel,
            required: criteria.level
          };
        }

        if (criteria.streak_days && profile.dailyStreak < criteria.streak_days) {
          isUnlockable = false;
          progress.streak = {
            current: profile.dailyStreak,
            required: criteria.streak_days
          };
        }

        return {
          ...reward.toJSON(),
          isUnlockable,
          progress
        };
      });

      res.json({
        rewards: rewardsWithStatus
      });
    } catch (error) {
      logger.error('Get available rewards error:', error);
      next(error);
    }
  }

  // Claim a reward
  static async claimReward(req, res, next) {
    try {
      const { rewardId } = req.params;
      const userId = req.user.id;

      const reward = await Reward.findById(rewardId);
      if (!reward) {
        return res.status(404).json({
          error: 'Reward not found'
        });
      }

      // Check if already claimed
      const existingClaim = await UserReward.findOne({
        where: { userId, rewardId }
      });

      if (existingClaim) {
        return res.status(409).json({
          error: 'Reward already claimed'
        });
      }

      // Verify unlock criteria
      const profile = await UserGamificationProfile.findByUserId(userId);
      const criteria = reward.unlockCriteria;

      if (criteria.points && profile.totalPoints < criteria.points) {
        return res.status(403).json({
          error: 'Insufficient points to claim this reward'
        });
      }

      if (criteria.level && profile.currentLevel < criteria.level) {
        return res.status(403).json({
          error: 'Level requirement not met'
        });
      }

      // Claim reward
      const userReward = await UserReward.create({
        userId,
        rewardId,
        claimedAt: new Date()
      });

      // Update profile
      await profile.update({
        rewardsClaimed: profile.rewardsClaimed + 1
      });

      logger.info(`Reward claimed: ${reward.name} by user ${userId}`);

      res.json({
        message: 'Reward claimed successfully',
        reward: userReward
      });
    } catch (error) {
      logger.error('Claim reward error:', error);
      next(error);
    }
  }

  // Get user's claimed rewards
  static async getUserRewards(req, res, next) {
    try {
      const userId = req.user.id;

      const rewards = await UserReward.findByUserId(userId);

      res.json({
        rewards
      });
    } catch (error) {
      logger.error('Get user rewards error:', error);
      next(error);
    }
  }

  // ==================== ACHIEVEMENTS ====================

  // Get all achievements
  static async getAchievements(req, res, next) {
    try {
      const userId = req.user.id;

      const allAchievements = await Achievement.findAll({
        where: { isActive: true },
        order: [['tier', 'ASC'], ['pointsReward', 'DESC']]
      });

      const userAchievements = await UserAchievement.findByUserId(userId);
      const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

      const achievementsWithStatus = allAchievements.map(achievement => ({
        ...achievement.toJSON(),
        isUnlocked: unlockedIds.has(achievement.id),
        unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt
      }));

      res.json({
        achievements: achievementsWithStatus,
        totalUnlocked: userAchievements.length,
        totalAvailable: allAchievements.length
      });
    } catch (error) {
      logger.error('Get achievements error:', error);
      next(error);
    }
  }

  // Check and unlock achievements (called by background job or manually)
  static async checkAchievements(req, res, next) {
    try {
      const userId = req.user.id;

      const profile = await UserGamificationProfile.findByUserId(userId);
      const allAchievements = await Achievement.findAll({ where: { isActive: true } });
      const userAchievements = await UserAchievement.findByUserId(userId);
      const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

      const newlyUnlocked = [];

      for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement.id)) continue;

        const criteria = achievement.criteria;
        let isUnlocked = true;

        // Check various criteria
        if (criteria.events_count) {
          if (profile.totalEventsLogged < criteria.events_count) {
            isUnlocked = false;
          }
        }

        if (criteria.total_points) {
          if (profile.totalPoints < criteria.total_points) {
            isUnlocked = false;
          }
        }

        if (criteria.streak_days) {
          if (profile.dailyStreak < criteria.streak_days) {
            isUnlocked = false;
          }
        }

        if (criteria.level) {
          if (profile.currentLevel < criteria.level) {
            isUnlocked = false;
          }
        }

        // Unlock if criteria met
        if (isUnlocked) {
          const userAchievement = await UserAchievement.create({
            userId,
            achievementId: achievement.id
          });

          // Award points
          if (achievement.pointsReward > 0) {
            await profile.update({
              totalPoints: profile.totalPoints + achievement.pointsReward,
              experiencePoints: profile.experiencePoints + achievement.pointsReward,
              achievementsUnlocked: profile.achievementsUnlocked + 1
            });
          }

          newlyUnlocked.push({
            achievement,
            pointsAwarded: achievement.pointsReward
          });

          logger.info(`Achievement unlocked: ${achievement.name} by user ${userId}`);
        }
      }

      res.json({
        message: `Checked achievements, ${newlyUnlocked.length} newly unlocked`,
        newlyUnlocked
      });
    } catch (error) {
      logger.error('Check achievements error:', error);
      next(error);
    }
  }

  // ==================== ANALYTICS ====================

  // Get gamification analytics
  static async getAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { period = 'week' } = req.query;

      let startDate, endDate;
      const now = new Date();

      if (period === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
      } else if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
      } else if (period === 'month') {
        startDate = new Date(now.setDate(now.getDate() - 30));
        endDate = new Date();
      }

      const analytics = await UserEvent.getAnalytics(userId, startDate, endDate);

      res.json({
        period,
        startDate,
        endDate,
        analytics
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      next(error);
    }
  }
}

module.exports = GamificationController;
