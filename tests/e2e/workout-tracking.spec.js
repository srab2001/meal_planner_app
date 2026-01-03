/**
 * Playwright E2E Tests - Workout Tracking
 *
 * Run: npx playwright test tests/e2e/workout-tracking.spec.js
 *
 * Prerequisites:
 * - App running at localhost:3000 (frontend) and localhost:5000 (API)
 * - Test user account exists
 * - Database seeded with test templates
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

// Helper to login
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');
}

// ============================================================================
// Test Suite: Workout Tracking Flow
// ============================================================================

test.describe('Workout Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // --------------------------------------------------------------------------
  // Test: Start Workout
  // --------------------------------------------------------------------------
  test('can start a new workout from template', async ({ page }) => {
    // Navigate to saved workouts
    await page.goto(`${BASE_URL}/fitness/workouts`);
    await expect(page.locator('.workout-tracking-title')).toContainText('Saved Workouts');

    // Find a template and click Start
    const templateCard = page.locator('.workout-template-card').first();
    await expect(templateCard).toBeVisible();

    const startButton = templateCard.locator('button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();

      // Verify we're on the session detail page
      await expect(page.locator('.workout-detail-title')).toBeVisible();
      await expect(page.locator('.workout-status-badge')).toContainText('In Progress');
    }
  });

  // --------------------------------------------------------------------------
  // Test: Check Exercise Persists After Refresh
  // --------------------------------------------------------------------------
  test('checked exercise persists after page refresh', async ({ page }) => {
    // Start or continue a workout
    await page.goto(`${BASE_URL}/fitness/workouts`);

    // Find in-progress or start new
    const continueBtn = page.locator('button:has-text("Continue")').first();
    const startBtn = page.locator('button:has-text("Start")').first();

    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    } else {
      await startBtn.click();
    }

    await page.waitForSelector('.exercise-row');

    // Find first unchecked exercise
    const uncheckedExercise = page.locator('.exercise-row:not(.completed)').first();
    const checkbox = uncheckedExercise.locator('.exercise-checkbox');

    if (await checkbox.isVisible()) {
      // Check the exercise
      await checkbox.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify it's checked
      await expect(uncheckedExercise).toHaveClass(/completed/);

      // Get exercise name for verification
      const exerciseName = await uncheckedExercise.locator('.exercise-name').textContent();

      // Refresh page
      await page.reload();
      await page.waitForSelector('.exercise-row');

      // Find the same exercise and verify still checked
      const exerciseAfterRefresh = page.locator(`.exercise-row:has-text("${exerciseName}")`);
      await expect(exerciseAfterRefresh).toHaveClass(/completed/);
    }
  });

  // --------------------------------------------------------------------------
  // Test: Finish Workout Shows on Calendar
  // --------------------------------------------------------------------------
  test('finished workout appears on calendar', async ({ page }) => {
    // Start a new workout
    await page.goto(`${BASE_URL}/fitness/workouts`);

    const startBtn = page.locator('button:has-text("Start")').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForSelector('.exercise-row');

      // Check all exercises
      const checkboxes = page.locator('.exercise-checkbox');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        const cb = checkboxes.nth(i);
        if (!(await cb.isChecked())) {
          await cb.click();
          await page.waitForTimeout(200);
        }
      }

      // Click Finish
      await page.click('button:has-text("Finish Workout")');
      await page.waitForTimeout(500);

      // Navigate to calendar
      await page.click('.workout-nav-tab:has-text("Calendar")');
      await page.waitForSelector('.calendar-grid');

      // Today should have a workout dot
      const todayCell = page.locator('.calendar-day.today');
      await expect(todayCell.locator('.calendar-workout-dot')).toBeVisible();
    }
  });

  // --------------------------------------------------------------------------
  // Test: Day Detail Shows Finished Session
  // --------------------------------------------------------------------------
  test('day detail shows finished sessions', async ({ page }) => {
    // Go to calendar
    await page.goto(`${BASE_URL}/fitness/calendar`);
    await page.waitForSelector('.calendar-grid');

    // Click on a day with workouts
    const dayWithWorkout = page.locator('.calendar-day.has-workout').first();

    if (await dayWithWorkout.isVisible()) {
      await dayWithWorkout.click();

      // Verify day detail page
      await expect(page.locator('.day-detail-date')).toBeVisible();
      await expect(page.locator('.day-session-card')).toBeVisible();

      // Verify session info is shown
      const sessionCard = page.locator('.day-session-card').first();
      await expect(sessionCard.locator('.day-session-name')).toBeVisible();
      await expect(sessionCard.locator('.day-session-percent')).toBeVisible();
    }
  });

  // --------------------------------------------------------------------------
  // Test: Review Opens Session Detail
  // --------------------------------------------------------------------------
  test('review button opens session detail', async ({ page }) => {
    // Go to calendar
    await page.goto(`${BASE_URL}/fitness/calendar`);

    // Click on a day with workouts
    const dayWithWorkout = page.locator('.calendar-day.has-workout').first();

    if (await dayWithWorkout.isVisible()) {
      await dayWithWorkout.click();
      await page.waitForSelector('.day-session-card');

      // Click Review
      await page.click('button:has-text("Review")');

      // Verify we're on session detail
      await expect(page.locator('.workout-detail-header')).toBeVisible();
      await expect(page.locator('.exercise-list')).toBeVisible();
    }
  });

  // --------------------------------------------------------------------------
  // Test: Cannot Check Exercises on Finished Session
  // --------------------------------------------------------------------------
  test('checkboxes are disabled on finished session', async ({ page }) => {
    // Navigate to a finished session via calendar
    await page.goto(`${BASE_URL}/fitness/calendar`);

    const dayWithWorkout = page.locator('.calendar-day.has-workout').first();

    if (await dayWithWorkout.isVisible()) {
      await dayWithWorkout.click();
      await page.waitForSelector('.day-session-card');
      await page.click('button:has-text("Review")');
      await page.waitForSelector('.exercise-row');

      // Verify checkboxes are disabled
      const checkbox = page.locator('.exercise-checkbox').first();
      await expect(checkbox).toBeDisabled();
    }
  });

  // --------------------------------------------------------------------------
  // Test: Filter Templates
  // --------------------------------------------------------------------------
  test('can filter templates by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/fitness/workouts`);

    // Click Done filter
    await page.click('.workout-filter-btn:has-text("Done")');
    await page.waitForTimeout(300);

    // All visible templates should have "Completed" badge
    const badges = page.locator('.workout-status-badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toContainText('Completed');
    }

    // Click All filter
    await page.click('.workout-filter-btn:has-text("All")');
  });

  // --------------------------------------------------------------------------
  // Test: Search Templates
  // --------------------------------------------------------------------------
  test('can search templates by name', async ({ page }) => {
    await page.goto(`${BASE_URL}/fitness/workouts`);

    // Type in search
    await page.fill('.workout-search-input', 'Strength');
    await page.waitForTimeout(500);

    // Results should contain search term
    const templateNames = page.locator('.workout-template-name');
    const count = await templateNames.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await templateNames.nth(i).textContent();
        expect(text.toLowerCase()).toContain('strength');
      }
    }
  });

  // --------------------------------------------------------------------------
  // Test: Calendar Month Navigation
  // --------------------------------------------------------------------------
  test('can navigate between months', async ({ page }) => {
    await page.goto(`${BASE_URL}/fitness/calendar`);
    await page.waitForSelector('.calendar-month-title');

    // Get current month
    const initialMonth = await page.locator('.calendar-month-title').textContent();

    // Click previous
    await page.click('.calendar-nav-btn:first-child');
    await page.waitForTimeout(300);

    const prevMonth = await page.locator('.calendar-month-title').textContent();
    expect(prevMonth).not.toBe(initialMonth);

    // Click next twice to go forward
    await page.click('.calendar-nav-btn:last-child');
    await page.click('.calendar-nav-btn:last-child');
    await page.waitForTimeout(300);

    const nextMonth = await page.locator('.calendar-month-title').textContent();
    expect(nextMonth).not.toBe(prevMonth);
  });
});

// ============================================================================
// Test Suite: Error Cases
// ============================================================================

test.describe('Error Cases', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/fitness/workouts`);

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('shows error for invalid calendar date', async ({ page }) => {
    await login(page);

    // Try to access invalid date
    await page.goto(`${BASE_URL}/fitness/calendar/invalid-date`);

    // Should show error or redirect
    await expect(page.locator('.empty-state, .error-message')).toBeVisible();
  });
});
