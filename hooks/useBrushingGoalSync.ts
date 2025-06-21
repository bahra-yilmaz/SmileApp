import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrushingGoal } from '../context/BrushingGoalContext';

/**
 * Hook that syncs the brushing goal from the database when user logs in
 */
export const useBrushingGoalSync = () => {
  const { user } = useAuth();
  const { syncWithDatabase } = useBrushingGoal();

  useEffect(() => {
    // Sync brushing goal from database when user logs in
    if (user?.id) {
      console.log('🔄 Syncing brushing goals for user:', user.id);
      syncWithDatabase(user.id);
    }
  }, [user?.id]); // Only re-run when user changes
}; 