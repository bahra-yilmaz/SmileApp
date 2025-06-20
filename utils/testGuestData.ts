import { GuestUserService } from '../services/GuestUserService';

/**
 * Helper function to test guest user functionality
 * This can be removed once testing is complete
 */
export const testGuestUserData = async () => {
  console.log('🧪 Testing Guest User Data...');
  
  try {
    // Add a test brushing log
    const result = await GuestUserService.insertGuestBrushingLog({
      actualTimeInSec: 150, // 2:30
      targetTimeInSec: 120, // 2:00 goal
      aimedSessionsPerDay: 2,
    });
    
    console.log('✅ Guest log saved:', result);
    
    // Get dashboard stats
    const stats = await GuestUserService.getGuestDashboardStats(2); // 2 minutes goal
    console.log('📊 Dashboard stats:', stats);
    
    // Get calendar data
    const calendar = await GuestUserService.getGuestCalendarData();
    console.log('📅 Calendar data:', calendar);
    
    return { success: true, result, stats, calendar };
  } catch (error) {
    console.error('❌ Guest user test failed:', error);
    return { success: false, error };
  }
};

// Export for use in development/testing
if (__DEV__) {
  (global as any).testGuestData = testGuestUserData;
} 