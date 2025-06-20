import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrushingGoal } from '../context/BrushingGoalContext';

/**
 * Hook that syncs the brushing goal from the database when user logs in
 */
export const useBrushingGoalSync = () => {
  const { user } = useAuth();
  const { syncBrushingGoalFromDatabase } = useBrushingGoal();

  useEffect(() => {
    // Sync brushing goal from database when user logs in
    if (user?.id) {
      console.log('🔄 Syncing brushing goal for user:', user.id);
      syncBrushingGoalFromDatabase(user.id);
    }
  }, [user?.id, syncBrushingGoalFromDatabase]);
}; 