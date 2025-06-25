# Streak Service Architecture

This directory contains the modular streak service architecture, designed for clean separation of concerns and high maintainability.

## Architecture Overview

### 🏗️ **Modular Design**
The streak functionality is split into focused, single-responsibility services:

```
services/streak/
├── StreakService.ts          # Main orchestrator - unified API
├── StreakDataService.ts      # Data access and caching
├── StreakCalculationService.ts # Business logic and calculations
├── StreakDisplayService.ts   # UI logic and formatting
├── StreakEventService.ts     # Event management
├── StreakConfig.ts          # Configuration and constants
├── StreakTypes.ts           # TypeScript interfaces
├── StreakServiceFactory.ts  # Service creation utilities
└── index.ts                 # Clean exports
```

## Services

### 🎯 **StreakService** (Main API)
The primary interface for all streak operations. Orchestrates other services.

```typescript
import { StreakService } from './services/streak';

// Get comprehensive streak data
const data = await StreakService.getStreakData(userId);

// Get display information
const displayInfo = StreakService.getStreakDisplayInfo(streakDays, brushings, t);

// Subscribe to events
const unsubscribe = StreakService.on('streak-updated', (data) => {
  console.log('Streak updated:', data);
});
```

### 💾 **StreakDataService** (Data Layer)
Handles all data access, caching, and persistence operations.

**Responsibilities:**
- Database queries (Supabase)
- Guest user data (AsyncStorage)  
- Intelligent caching with TTL
- Data validation and transformation

### 🧮 **StreakCalculationService** (Business Logic)
Pure business logic for streak calculations and metrics.

**Responsibilities:**
- Current streak calculation
- Streak history analysis
- Daily goal status checking
- Milestone progress tracking

### 🎨 **StreakDisplayService** (UI Logic)
Manages all UI-related logic and display formatting.

**Responsibilities:**
- Responsive titles based on streak phases
- Icon selection for different phases
- Color themes and visual indicators
- Localization key management
- Celebration logic

### 📡 **StreakEventService** (Events)
Handles event management and notifications.

**Responsibilities:**
- Event subscription/unsubscription
- Type-safe event emission
- Error handling in callbacks
- Memory leak prevention

### ⚙️ **Configuration & Types**
- **StreakConfig.ts**: All constants, thresholds, and configuration
- **StreakTypes.ts**: Complete TypeScript interfaces and types

## Key Benefits

### ✅ **Separation of Concerns**
Each service has a single, well-defined responsibility:
- **Data** ↔ **Business Logic** ↔ **Presentation** ↔ **Events**

### ✅ **Type Safety**
Comprehensive TypeScript interfaces for all data structures and operations.

### ✅ **Testability**
Each service can be unit tested independently with clear boundaries.

### ✅ **Maintainability**
Changes to one concern (e.g., caching strategy) don't affect others.

### ✅ **Reusability**
Services can be used independently in different parts of the app.

### ✅ **Configuration Driven**
All constants and thresholds centralized in `StreakConfig.ts`.

## Usage Examples

### Basic Usage
```typescript
import { StreakService } from './services/StreakService'; // Main service
import { createStreakService } from './services/streak';   // Factory utilities

// Initialize the service ecosystem once
await createStreakService({
  enableCaching: true,
  enableEvents: true,
  enableDebugLogging: false
});

// Use the main service
const currentStreak = await StreakService.getCurrentStreak(userId);
const streakData = await StreakService.getStreakData(userId, {
  forceRefresh: true
});
```

### Advanced Usage with Individual Services
```typescript
import { 
  StreakDisplayService, 
  StreakCalculationService,
  StreakDataService 
} from './services/streak';

// Use display service for UI logic
const phase = StreakDisplayService.getStreakPhase(15); // "TWO_WEEKS"
const icon = StreakDisplayService.getStreakIcon(15);   // "trophy-outline"
const colors = StreakDisplayService.getStreakColorTheme(15);

// Use calculation service for business logic
const progress = StreakCalculationService.calculateMilestoneProgress(15);

// Use data service for low-level data access
const cachedData = StreakDataService.getCachedStreakData(userId);
```

### Event-Driven Updates
```typescript
import { StreakService } from './services/StreakService';
import { createStreakServiceWithDebug } from './services/streak';

// Initialize with debug logging
await createStreakServiceWithDebug();

// Subscribe to streak updates
const unsubscribe = StreakService.on('streak-updated', (eventData) => {
  const { userId, previousStreak, newStreak } = eventData;
  
  if (StreakService.shouldCelebrate(previousStreak, newStreak)) {
    const message = StreakService.getCelebrationMessage(newStreak, t);
    showCelebration(message);
  }
});

// Clean up when component unmounts
return unsubscribe;
```

## Migration Notes

The new architecture maintains **100% backward compatibility**. Existing imports continue to work:

```typescript
// ✅ Main service - continues to work
import { StreakService } from './services/StreakService';

// ✅ Individual services - new modular imports
import { 
  StreakDisplayService, 
  StreakCalculationService,
  createStreakService 
} from './services/streak';

// ✅ Initialize the ecosystem
await createStreakService();
```

## Future Extensions

The modular architecture makes it easy to add new features:

- **StreakAnalyticsService**: Advanced analytics and insights
- **StreakSyncService**: Multi-device synchronization
- **StreakGamificationService**: Points, badges, and achievements
- **StreakNotificationService**: Smart notification scheduling

Each can be added without affecting existing services. 