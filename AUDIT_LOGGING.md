# Audit Logging Documentation

## Overview

The Audit Logging system provides centralized logging for user actions, errors, security events, and navigation throughout the application. Events are stored locally in `localStorage` and can be exported for analysis.

## Implementation

### AuditLogger Service

**Location:** `client/src/shared/services/AuditLogger.js`

The AuditLogger is a singleton service that provides:
- Automatic session tracking
- User ID extraction from JWT
- Sensitive data sanitization
- Storage management with auto-cleanup
- Development mode console output

### Usage

```javascript
import auditLogger from '../../shared/services/AuditLogger';

// Basic logging
auditLogger.log({
  category: auditLogger.CATEGORIES.GOAL,
  action: 'goal_created',
  level: auditLogger.LEVELS.INFO,
  details: { goalId: 123, title: 'My Goal' }
});
```

## Log Categories

| Category | Code | Description |
|----------|------|-------------|
| AUTH | `auth` | Authentication events (login, logout, session) |
| NAVIGATION | `navigation` | Page/view transitions |
| COACHING | `coaching` | Coaching app lifecycle events |
| GOAL | `goal` | Goal create/update/delete/complete |
| HABIT | `habit` | Habit create/toggle/update/delete |
| PROGRAM | `program` | Program enrollment and completion |
| CHAT | `chat` | AI chat interactions |
| DATA | `data` | Generic data operations |
| ERROR | `error` | Errors and exceptions |
| SECURITY | `security` | Security-related events |

## Log Levels

| Level | Code | Usage |
|-------|------|-------|
| DEBUG | `debug` | Fine-grained development info |
| INFO | `info` | Normal application events |
| WARN | `warn` | Warning conditions |
| ERROR | `error` | Error conditions |
| CRITICAL | `critical` | Critical failures |

## Logged Events by Module

### Coaching App (`CoachingApp.js`)

| Event | Category | Level | Details |
|-------|----------|-------|---------|
| `app_opened` | COACHING | INFO | userId |
| `coaching_view_changed` | NAVIGATION | DEBUG | from, to |

### GoalManager

| Event | Category | Level | Details |
|-------|----------|-------|---------|
| `goal_created` | GOAL | INFO | goalId, title, category |
| `goal_updated` | GOAL | INFO | goalId, title, category, progress |
| `goal_completed` | GOAL | INFO | goalId, title, category |
| `goal_progress_updated` | GOAL | DEBUG | goalId, newValue, title |
| `goal_deleted` | GOAL | WARN | goalId, title, category |

### HabitTracker

| Event | Category | Level | Details |
|-------|----------|-------|---------|
| `habit_created` | HABIT | INFO | habitId, name, frequency |
| `habit_updated` | HABIT | INFO | habitId, name |
| `habit_completed` | HABIT | INFO | habitId, name, streak |
| `habit_uncompleted` | HABIT | INFO | habitId, name |
| `habit_deleted` | HABIT | WARN | habitId, name, bestStreak |

### Programs

| Event | Category | Level | Details |
|-------|----------|-------|---------|
| `program_enrolled` | PROGRAM | INFO | programId, name |
| `program_unenrolled` | PROGRAM | WARN | programId, name, previousProgress |
| `module_completed` | PROGRAM | INFO | programId, moduleId, moduleName, programName |
| `module_reset` | PROGRAM | DEBUG | programId, moduleId, moduleName |
| `program_completed` | PROGRAM | INFO | programId, name |

### CoachingChat

| Event | Category | Level | Details |
|-------|----------|-------|---------|
| `message_sent` | CHAT | INFO | messageLength |
| `response_received` | CHAT | DEBUG | responseLength |
| `chat_response_failed` | ERROR | ERROR | error |

## Log Entry Structure

```javascript
{
  id: "1699123456789_abc123",     // Unique identifier
  timestamp: "2024-11-04T12:00:00.000Z",
  sessionId: "session_1699123456_xyz789",
  userId: "user_123" | "anonymous",
  category: "goal",
  action: "goal_created",
  level: "info",
  details: { ... },              // Sanitized event data
  url: "/coaching"               // Current page
}
```

## Storage Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| `STORAGE_KEY` | `audit_log` | localStorage key |
| `MAX_ENTRIES` | 500 | Maximum stored entries |

When `MAX_ENTRIES` is exceeded, oldest entries are automatically removed.

## Sensitive Data Handling

The following fields are automatically sanitized (replaced with `[REDACTED]`):
- password
- token
- secret
- apiKey
- creditCard

Long strings (>500 chars) are automatically truncated.

## API Reference

### Methods

#### `log(event)`
Main logging method.
```javascript
auditLogger.log({
  category: string,  // From CATEGORIES
  action: string,    // Event name
  level: string,     // From LEVELS (optional, default: INFO)
  details: object,   // Event data (optional)
  userId: string     // Override user ID (optional)
});
```

#### `getLogs()`
Retrieve all stored log entries.
```javascript
const logs = auditLogger.getLogs();
```

#### `getLogsByCategory(category)`
Filter logs by category.
```javascript
const goalLogs = auditLogger.getLogsByCategory('goal');
```

#### `getLogsByLevel(level)`
Filter logs by severity level.
```javascript
const errorLogs = auditLogger.getLogsByLevel('error');
```

#### `clearLogs()`
Clear all stored logs.
```javascript
auditLogger.clearLogs();
```

#### `exportLogs()`
Export logs as JSON string.
```javascript
const json = auditLogger.exportLogs();
```

## Development Mode

In development (`NODE_ENV === 'development'`), logs are also output to the browser console with color-coded formatting based on severity level.

## Testing

Run audit logger tests:
```bash
node client/src/shared/services/__tests__/AuditLogger.test.js
```

Run coaching integration tests (includes audit logging):
```bash
node client/src/modules/coaching/__tests__/sanity.test.js
node client/src/modules/coaching/__tests__/integration.test.js
```

## Best Practices

1. **Use appropriate levels**: DEBUG for development, INFO for normal events, WARN for user-initiated destructive actions, ERROR for failures

2. **Include relevant context**: Always include IDs and names for trackability

3. **Don't log sensitive data**: The sanitizer handles known fields, but avoid logging raw user input

4. **Keep details small**: Large objects slow down localStorage operations

5. **Log completion events**: Track both start and completion of workflows

## Future Enhancements

- [ ] Backend sync for persistent storage
- [ ] Real-time analytics dashboard
- [ ] Anomaly detection for security events
- [ ] Log export to external services
- [ ] Retention policies per category
