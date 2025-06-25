// Debug the date calculation issue

const testCurrentCode = () => {
  console.log("=== Debugging Date Calculation Issue ===");
  
  const currentStreak = 1;
  console.log("Current streak:", currentStreak);
  console.log("Today's date:", new Date().toISOString());
  
  // This is what our current code does:
  const streakStartDate = new Date();
  streakStartDate.setDate(streakStartDate.getDate() - currentStreak + 1);
  
  console.log("Calculated streak start date:", streakStartDate.toISOString());
  console.log("Expected for 1-day streak: Should be today");
  
  // Let's test with the calculation step by step
  const today = new Date();
  console.log("\nStep by step:");
  console.log("1. Today's date:", today.getDate());
  console.log("2. Current streak:", currentStreak);  
  console.log("3. Formula: today.getDate() - currentStreak + 1");
  console.log("4. Calculation:", today.getDate(), "-", currentStreak, "+ 1 =", today.getDate() - currentStreak + 1);
  
  // The issue might be with setDate() going to previous month
  const testDate = new Date();
  console.log("\nTesting setDate behavior:");
  console.log("Original date:", testDate.toISOString());
  console.log("Setting date to:", today.getDate() - currentStreak + 1);
  testDate.setDate(today.getDate() - currentStreak + 1);
  console.log("Result after setDate:", testDate.toISOString());
  
  // Is today June 25th and we're setting to 25 - 1 + 1 = 25? Should be today.
  // But maybe there's a timezone or month rollover issue?
};

testCurrentCode();
