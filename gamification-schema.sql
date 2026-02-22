-- FocusFlow Gamification System Schema
-- Extends the core database with gamification features

-- Event Types Table (Default and Custom Events)
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('productivity', 'wellness', 'learning', 'social', 'custom')),
    default_points INTEGER DEFAULT 10,
    default_weightage DECIMAL(3,2) DEFAULT 1.00, -- Multiplier for scoring
    icon VARCHAR(50) DEFAULT 'star',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_system_default BOOLEAN DEFAULT false, -- System-provided vs user-created
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- User Events Table (Actual event occurrences)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER, -- For time-based events
    points_earned INTEGER NOT NULL,
    weightage_applied DECIMAL(3,2) NOT NULL,
    notes TEXT,
    metadata JSONB, -- Additional event-specific data
    related_entity_id UUID, -- Link to task, habit, etc.
    related_entity_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Gamification Profile
CREATE TABLE user_gamification_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    points_to_next_level INTEGER DEFAULT 100,
    daily_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_events_logged INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    rewards_claimed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Goals Table
CREATE TABLE daily_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_date DATE NOT NULL,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('productive_hours', 'events_count', 'points_target', 'specific_events', 'custom')),
    target_value DECIMAL(10,2) NOT NULL, -- e.g., 3 hours = 180 minutes
    current_value DECIMAL(10,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_id UUID REFERENCES rewards(id),
    metadata JSONB, -- Additional goal configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goal_date, goal_type)
);

-- Rewards Table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('feature_unlock', 'theme', 'badge', 'points_bonus', 'custom')),
    unlock_criteria JSONB NOT NULL, -- Conditions to unlock this reward
    value JSONB, -- What the reward provides (e.g., feature name, theme data)
    icon VARCHAR(50) DEFAULT 'gift',
    color VARCHAR(7) DEFAULT '#F59E0B',
    is_system_reward BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Rewards (Unlocked/Claimed Rewards)
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited rewards
    metadata JSONB,
    UNIQUE(user_id, reward_id)
);

-- Achievements Table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN ('streak', 'milestone', 'mastery', 'special', 'hidden')),
    criteria JSONB NOT NULL, -- Conditions to earn achievement
    points_reward INTEGER DEFAULT 0,
    badge_icon VARCHAR(50) DEFAULT 'trophy',
    badge_color VARCHAR(7) DEFAULT '#FFD700',
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    progress JSONB, -- Track progress toward achievement
    is_showcased BOOLEAN DEFAULT false, -- Display on profile
    UNIQUE(user_id, achievement_id)
);

-- Leaderboards Table (Optional - for competitive features)
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    leaderboard_type VARCHAR(50) NOT NULL CHECK (leaderboard_type IN ('daily', 'weekly', 'monthly', 'all_time')),
    metric VARCHAR(50) NOT NULL CHECK (metric IN ('points', 'events', 'streak', 'productivity_score')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard Entries
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leaderboard_id, user_id)
);

-- Event Weightage History (Track custom weightage changes)
CREATE TABLE event_weightage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_weightage DECIMAL(3,2) NOT NULL,
    new_weightage DECIMAL(3,2) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_event_types_user_id ON event_types(user_id);
CREATE INDEX idx_event_types_category ON event_types(category);
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_occurred_at ON user_events(occurred_at);
CREATE INDEX idx_user_events_event_type_id ON user_events(event_type_id);
CREATE INDEX idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX idx_daily_goals_goal_date ON daily_goals(goal_date);
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);

-- Triggers for updated_at
CREATE TRIGGER update_event_types_updated_at BEFORE UPDATE ON event_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_profiles_updated_at BEFORE UPDATE ON user_gamification_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON daily_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate level from experience points
CREATE OR REPLACE FUNCTION calculate_level(exp_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Level formula: level = floor(sqrt(exp_points / 100)) + 1
    RETURN FLOOR(SQRT(exp_points::FLOAT / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate points needed for next level
CREATE OR REPLACE FUNCTION points_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Points needed = (level^2) * 100
    RETURN (current_level * current_level) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update gamification profile when events are logged
CREATE OR REPLACE FUNCTION update_gamification_profile()
RETURNS TRIGGER AS $$
DECLARE
    current_profile RECORD;
    new_level INTEGER;
    new_exp INTEGER;
BEGIN
    -- Get current profile
    SELECT * INTO current_profile 
    FROM user_gamification_profiles 
    WHERE user_id = NEW.user_id;

    -- Update experience and points
    new_exp := current_profile.experience_points + NEW.points_earned;
    new_level := calculate_level(new_exp);

    -- Update profile
    UPDATE user_gamification_profiles
    SET 
        total_points = total_points + NEW.points_earned,
        experience_points = new_exp,
        current_level = new_level,
        points_to_next_level = points_for_next_level(new_level) - (new_exp - ((new_level - 1) * (new_level - 1) * 100)),
        total_events_logged = total_events_logged + 1,
        last_activity_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;

    -- Update daily streak
    IF current_profile.last_activity_date IS NULL OR 
       current_profile.last_activity_date < CURRENT_DATE THEN
        IF current_profile.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Continue streak
            UPDATE user_gamification_profiles
            SET 
                daily_streak = daily_streak + 1,
                longest_streak = GREATEST(longest_streak, daily_streak + 1)
            WHERE user_id = NEW.user_id;
        ELSE
            -- Reset streak
            UPDATE user_gamification_profiles
            SET daily_streak = 1
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gamification_profile
    AFTER INSERT ON user_events
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_profile();

-- Trigger to check and complete daily goals
CREATE OR REPLACE FUNCTION check_daily_goal_completion()
RETURNS TRIGGER AS $$
DECLARE
    goal RECORD;
    goal_progress DECIMAL(10,2);
BEGIN
    -- Find active goals for today
    FOR goal IN 
        SELECT * FROM daily_goals 
        WHERE user_id = NEW.user_id 
        AND goal_date = CURRENT_DATE 
        AND is_completed = false
    LOOP
        -- Calculate progress based on goal type
        CASE goal.goal_type
            WHEN 'productive_hours' THEN
                SELECT COALESCE(SUM(duration_minutes), 0) INTO goal_progress
                FROM user_events
                WHERE user_id = NEW.user_id
                AND DATE(occurred_at) = CURRENT_DATE;
                
            WHEN 'events_count' THEN
                SELECT COUNT(*) INTO goal_progress
                FROM user_events
                WHERE user_id = NEW.user_id
                AND DATE(occurred_at) = CURRENT_DATE;
                
            WHEN 'points_target' THEN
                SELECT COALESCE(SUM(points_earned), 0) INTO goal_progress
                FROM user_events
                WHERE user_id = NEW.user_id
                AND DATE(occurred_at) = CURRENT_DATE;
        END CASE;

        -- Update goal progress
        UPDATE daily_goals
        SET current_value = goal_progress
        WHERE id = goal.id;

        -- Check if goal is completed
        IF goal_progress >= goal.target_value THEN
            UPDATE daily_goals
            SET 
                is_completed = true,
                completed_at = CURRENT_TIMESTAMP
            WHERE id = goal.id;

            -- Unlock reward if associated
            IF goal.reward_id IS NOT NULL THEN
                INSERT INTO user_rewards (user_id, reward_id, unlocked_at)
                VALUES (NEW.user_id, goal.reward_id, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, reward_id) DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_daily_goal_completion
    AFTER INSERT ON user_events
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_goal_completion();

-- Insert default system event types
INSERT INTO event_types (id, user_id, name, description, category, default_points, default_weightage, icon, color, is_system_default) VALUES
    (uuid_generate_v4(), NULL, 'Task Completed', 'Completed a task', 'productivity', 10, 1.00, 'check-circle', '#10B981', true),
    (uuid_generate_v4(), NULL, 'Deep Work Session', '1 hour of focused work', 'productivity', 25, 1.50, 'brain', '#3B82F6', true),
    (uuid_generate_v4(), NULL, 'Habit Completed', 'Completed a daily habit', 'wellness', 15, 1.20, 'heart', '#EF4444', true),
    (uuid_generate_v4(), NULL, 'Early Start', 'Started work before 8 AM', 'productivity', 20, 1.30, 'sunrise', '#F59E0B', true),
    (uuid_generate_v4(), NULL, 'Exercise', 'Physical activity session', 'wellness', 30, 1.40, 'activity', '#10B981', true),
    (uuid_generate_v4(), NULL, 'Learning', 'Completed a learning session', 'learning', 20, 1.25, 'book-open', '#8B5CF6', true),
    (uuid_generate_v4(), NULL, 'Break Taken', 'Took a proper break', 'wellness', 5, 0.80, 'coffee', '#6B7280', true),
    (uuid_generate_v4(), NULL, 'Goal Achieved', 'Achieved a set goal', 'productivity', 50, 2.00, 'target', '#F59E0B', true),
    (uuid_generate_v4(), NULL, 'Meditation', 'Mindfulness or meditation', 'wellness', 15, 1.10, 'sparkles', '#8B5CF6', true),
    (uuid_generate_v4(), NULL, 'No Distractions', '1 hour without distractions', 'productivity', 20, 1.35, 'shield', '#3B82F6', true);

-- Insert default achievements
INSERT INTO achievements (id, name, description, achievement_type, criteria, points_reward, badge_icon, badge_color, tier) VALUES
    (uuid_generate_v4(), 'First Step', 'Log your first event', 'milestone', '{"events_count": 1}', 10, 'flag', '#CD7F32', 'bronze'),
    (uuid_generate_v4(), 'Week Warrior', 'Maintain a 7-day streak', 'streak', '{"streak_days": 7}', 50, 'flame', '#C0C0C0', 'silver'),
    (uuid_generate_v4(), 'Month Master', 'Maintain a 30-day streak', 'streak', '{"streak_days": 30}', 200, 'crown', '#FFD700', 'gold'),
    (uuid_generate_v4(), 'Century Club', 'Log 100 events', 'milestone', '{"events_count": 100}', 100, 'star', '#C0C0C0', 'silver'),
    (uuid_generate_v4(), 'Point Collector', 'Earn 1000 points', 'milestone', '{"total_points": 1000}', 150, 'gem', '#FFD700', 'gold'),
    (uuid_generate_v4(), 'Early Bird', 'Start work before 8 AM for 7 days', 'mastery', '{"early_starts": 7}', 75, 'sunrise', '#F59E0B', 'silver'),
    (uuid_generate_v4(), 'Deep Focus', 'Complete 10 deep work sessions', 'mastery', '{"deep_work_count": 10}', 100, 'brain', '#8B5CF6', 'gold'),
    (uuid_generate_v4(), 'Wellness Champion', 'Complete 30 wellness events', 'mastery', '{"wellness_events": 30}', 150, 'heart', '#EF4444', 'gold'),
    (uuid_generate_v4(), 'Level 10', 'Reach level 10', 'milestone', '{"level": 10}', 250, 'zap', '#E11D48', 'platinum'),
    (uuid_generate_v4(), 'Perfectionist', 'Complete all daily goals for 7 days', 'special', '{"perfect_days": 7}', 300, 'trophy', '#FFD700', 'platinum');

-- Insert default rewards
INSERT INTO rewards (id, user_id, name, description, reward_type, unlock_criteria, value, icon, color, is_system_reward) VALUES
    (uuid_generate_v4(), NULL, 'Dark Theme', 'Unlock the premium dark theme', 'theme', '{"points": 100}', '{"theme_id": "dark_premium"}', 'moon', '#1E293B', true),
    (uuid_generate_v4(), NULL, 'Advanced Analytics', 'Unlock advanced analytics dashboard', 'feature_unlock', '{"level": 5}', '{"feature": "advanced_analytics"}', 'chart-bar', '#3B82F6', true),
    (uuid_generate_v4(), NULL, 'Custom Categories', 'Create unlimited custom categories', 'feature_unlock', '{"points": 500}', '{"feature": "unlimited_categories"}', 'folder-plus', '#8B5CF6', true),
    (uuid_generate_v4(), NULL, 'AI Coach', 'Unlock AI productivity coach', 'feature_unlock', '{"level": 10}', '{"feature": "ai_coach"}', 'sparkles', '#F59E0B', true),
    (uuid_generate_v4(), NULL, 'Points Multiplier', '2x points for 24 hours', 'points_bonus', '{"streak_days": 7}', '{"multiplier": 2, "duration_hours": 24}', 'zap', '#EF4444', true);

-- Row Level Security
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_event_types ON event_types FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY users_own_user_events ON user_events FOR ALL USING (user_id = auth.uid());
CREATE POLICY users_own_gamification_profile ON user_gamification_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY users_own_daily_goals ON daily_goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY users_own_user_rewards ON user_rewards FOR ALL USING (user_id = auth.uid());
CREATE POLICY users_own_user_achievements ON user_achievements FOR ALL USING (user_id = auth.uid());
