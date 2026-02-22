// Tasks Controller
const { Task, Category, TimeLog } = require('../models');
const { validateTask, validateTaskUpdate } = require('../utils/validators');
const logger = require('../utils/logger');

class TasksController {
  // Get all tasks for a user
  static async getTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        status,
        priority,
        category_id,
        due_date,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        limit = 20,
      } = req.query;

      const filters = {
        userId,
        status,
        priority,
        categoryId: category_id,
        dueDate: due_date,
        search,
        sortBy: sort_by,
        sortOrder: sort_order,
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const tasks = await Task.findAllWithFilters(filters);
      const totalCount = await Task.countWithFilters(filters);

      res.json({
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      logger.error('Get tasks error:', error);
      next(error);
    }
  }

  // Get single task
  static async getTask(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const task = await Task.findByIdWithDetails(id, userId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ task });
    } catch (error) {
      logger.error('Get task error:', error);
      next(error);
    }
  }

  // Create new task
  static async createTask(req, res, next) {
    try {
      const userId = req.user.id;
      const taskData = { ...req.body, userId };

      // Validation
      const validation = validateTask(taskData);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // Verify category belongs to user
      if (taskData.categoryId) {
        const category = await Category.findById(taskData.categoryId, userId);
        if (!category) {
          return res.status(400).json({ error: 'Invalid category' });
        }
      }

      const task = await Task.create(taskData);

      // Log activity
      logger.info(`Task created: ${task.id} by user ${userId}`);

      res.status(201).json({
        message: 'Task created successfully',
        task,
      });
    } catch (error) {
      logger.error('Create task error:', error);
      next(error);
    }
  }

  // Update task
  static async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Check if task exists and belongs to user
      const existingTask = await Task.findById(id, userId);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Validation
      const validation = validateTaskUpdate(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // Verify category belongs to user
      if (updateData.categoryId) {
        const category = await Category.findById(updateData.categoryId, userId);
        if (!category) {
          return res.status(400).json({ error: 'Invalid category' });
        }
      }

      // Handle status change to completed
      if (updateData.status === 'completed' && existingTask.status !== 'completed') {
        updateData.completedAt = new Date();
        
        // Update actual minutes if time logs exist
        const timeLogs = await TimeLog.findByTaskId(id);
        if (timeLogs.length > 0) {
          const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
          updateData.actualMinutes = totalMinutes;
        }
      }

      const task = await Task.update(id, updateData);

      logger.info(`Task updated: ${id} by user ${userId}`);

      res.json({
        message: 'Task updated successfully',
        task,
      });
    } catch (error) {
      logger.error('Update task error:', error);
      next(error);
    }
  }

  // Delete task
  static async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if task exists and belongs to user
      const task = await Task.findById(id, userId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await Task.delete(id);

      logger.info(`Task deleted: ${id} by user ${userId}`);

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      logger.error('Delete task error:', error);
      next(error);
    }
  }

  // Get today's tasks
  static async getTodayTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      const tasks = await Task.findTodayTasks(userId, today);

      res.json({ tasks });
    } catch (error) {
      logger.error('Get today tasks error:', error);
      next(error);
    }
  }

  // Get upcoming tasks (next 7 days)
  static async getUpcomingTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const tasks = await Task.findUpcomingTasks(userId, today, nextWeek);

      res.json({ tasks });
    } catch (error) {
      logger.error('Get upcoming tasks error:', error);
      next(error);
    }
  }

  // Bulk update tasks
  static async bulkUpdateTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const { taskIds, updates } = req.body;

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: 'Task IDs array is required' });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Updates object is required' });
      }

      // Validate that all tasks belong to user
      const tasks = await Task.findByIds(taskIds, userId);
      if (tasks.length !== taskIds.length) {
        return res.status(400).json({ error: 'Some tasks not found or do not belong to user' });
      }

      const updatedTasks = await Task.bulkUpdate(taskIds, updates);

      logger.info(`Bulk update: ${taskIds.length} tasks by user ${userId}`);

      res.json({
        message: 'Tasks updated successfully',
        tasks: updatedTasks,
      });
    } catch (error) {
      logger.error('Bulk update tasks error:', error);
      next(error);
    }
  }

  // Get task statistics
  static async getTaskStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { period = 'week' } = req.query;

      let startDate, endDate;
      const now = new Date();

      if (period === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
      } else if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.setDate(now.getDate() + 6));
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const stats = await Task.getStats(userId, startDate, endDate);

      res.json({ stats });
    } catch (error) {
      logger.error('Get task stats error:', error);
      next(error);
    }
  }
}

module.exports = TasksController;
