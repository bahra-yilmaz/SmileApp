// Debug script to test the streak brushing calculation logic

const testStreakLogic = () => {
  console.log("=== Testing Streak Brushing Logic ===");
  
  // Simulate a 3-day streak
  const currentStreak = 3;
  const today = new Date();
  
  // Calculate streak start date
  const streakStartDate = new Date();
  streakStartDate.setDate(streakStartDate.getDate() - currentStreak + 1);
  
  console.log("Current streak:", currentStreak);
  console.log("Today:", today.toDateString());
  console.log("Streak start date:", streakStartDate.toDateString());
  console.log("Days difference:", Math.ceil((today - streakStartDate) / (1000 * 60 * 60 * 24)));
  
  // Simulate brushing sessions
  const sessions = [
    { date: getDateString(today), sessions: 2 },
    { date: getDateString(new Date(today.getTime() - 24 * 60 * 60 * 1000)), sessions: 1 },
    { date: getDateString(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)), sessions: 2 },
    { date: getDateString(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)), sessions: 1 }, // Outside streak
  ];
  
  console.log("\nAll sessions:");
  sessions.forEach(s => console.log(`  ${s.date}: ${s.sessions} sessions`));
  
  // Filter sessions within streak period
  const sessionsInStreak = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= streakStartDate && sessionDate <= today;
  });
  
  console.log("\nSessions within streak period:");
  sessionsInStreak.forEach(s => console.log(`  ${s.date}: ${s.sessions} sessions`));
  
  const totalBrushings = sessionsInStreak.reduce((sum, s) => sum + s.sessions, 0);
  console.log("\nTotal brushings in current streak:", totalBrushings);
};

function getDateString(date) {
  return date.toISOString().slice(0, 10);
}

testStreakLogic();
