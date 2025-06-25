// Test the database query logic locally

const testDBQuery = () => {
  console.log("=== Testing Database Query Logic ===");
  
  // Simulate what would happen with a 3-day streak
  const currentStreak = 3;
  const today = new Date();
  
  // Calculate streak start date (same logic as our code)
  const streakStartDate = new Date();
  streakStartDate.setDate(streakStartDate.getDate() - currentStreak + 1);
  
  console.log("Query parameters:");
  console.log("  Current streak:", currentStreak);
  console.log("  Today:", today.toISOString());
  console.log("  Streak start date:", streakStartDate.toISOString());
  console.log("  Query: gte('created_at', startDate.toISOString())");
  
  // Simulate some database records
  const mockDBRecords = [
    { date: '2025-06-25', created_at: '2025-06-25T10:30:00.000Z', 'duration-seconds': 120 },
    { date: '2025-06-25', created_at: '2025-06-25T20:15:00.000Z', 'duration-seconds': 90 },
    { date: '2025-06-24', created_at: '2025-06-24T08:45:00.000Z', 'duration-seconds': 150 },
    { date: '2025-06-23', created_at: '2025-06-23T19:20:00.000Z', 'duration-seconds': 110 },
    { date: '2025-06-22', created_at: '2025-06-22T07:30:00.000Z', 'duration-seconds': 95 },  // Should be excluded
  ];
  
  console.log("\nMock database records:");
  mockDBRecords.forEach(record => {
    console.log(`  ${record.date} (${record.created_at}): ${record['duration-seconds']}s`);
  });
  
  // Filter records based on our query logic
  const filteredRecords = mockDBRecords.filter(record => {
    const recordDate = new Date(record.created_at);
    return recordDate >= streakStartDate;
  });
  
  console.log("\nFiltered records (should match streak period):");
  filteredRecords.forEach(record => {
    console.log(`  ${record.date} (${record.created_at}): ${record['duration-seconds']}s`);
  });
  
  console.log("\nResult:");
  console.log("  Total sessions in streak period:", filteredRecords.length);
  console.log("  Expected: Sessions from June 23, 24, 25");
  console.log("  Actual: Sessions from", 
    filteredRecords.map(r => r.date).filter((date, i, arr) => arr.indexOf(date) === i).join(', '));
};

testDBQuery();
