// Debug the actual filtering issue

const testDateFiltering = () => {
  console.log("=== Testing Date Filtering Issue ===");
  
  const currentStreak = 3;
  const today = new Date();
  
  // This is what our current code does:
  const streakStartDate = new Date();
  streakStartDate.setDate(streakStartDate.getDate() - currentStreak + 1);
  
  console.log("Current calculation:");
  console.log("  Current streak:", currentStreak);
  console.log("  Today:", today.toDateString());
  console.log("  Streak start (current logic):", streakStartDate.toDateString());
  console.log("  Formula: today - streak + 1 =", today.getDate(), "-", currentStreak, "+ 1 =", today.getDate() - currentStreak + 1);
  
  // Let's test if this includes all the days it should
  const dates = [];
  for (let i = 0; i < currentStreak; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toDateString());
  }
  
  console.log("\nExpected streak days (backwards from today):");
  dates.forEach((d, i) => console.log(`  Day ${i + 1}: ${d}`));
  
  console.log("\nDoes our streak start date match the oldest day?");
  console.log("  Streak start:", streakStartDate.toDateString());
  console.log("  Oldest expected day:", dates[dates.length - 1]);
  console.log("  Match:", streakStartDate.toDateString() === dates[dates.length - 1]);
};

testDateFiltering();
