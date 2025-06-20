-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR SMILE APP
-- ============================================================================
-- Run these commands in your Supabase SQL editor to fix authentication issues

-- Enable RLS on brushing_logs table if not already enabled
ALTER TABLE brushing_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert their own brushing logs
CREATE POLICY "Users can insert their own brushing logs" ON brushing_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to select their own brushing logs  
CREATE POLICY "Users can view their own brushing logs" ON brushing_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Optional: Policy to allow authenticated users to update their own brushing logs
CREATE POLICY "Users can update their own brushing logs" ON brushing_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Optional: Policy to allow authenticated users to delete their own brushing logs
CREATE POLICY "Users can delete their own brushing logs" ON brushing_logs
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the policies are working:

-- 1. Check if RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'brushing_logs';

-- 2. List all policies on brushing_logs:
-- SELECT * FROM pg_policies WHERE tablename = 'brushing_logs';

-- 3. Test insert (should work when authenticated):
-- INSERT INTO brushing_logs (user_id, "duration-seconds", date, earned_points) 
-- VALUES (auth.uid(), 120, CURRENT_DATE, 100); 