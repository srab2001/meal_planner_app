/**
 * Unit Tests - Completion Percent Calculation
 *
 * Run: npm test tests/workouts/completion.test.js
 */

/**
 * Calculate completion percentage from exercise completion status
 * @param {Array} exercises - Array of { is_completed: boolean }
 * @returns {number} - Integer 0-100
 */
function calculateCompletionPercent(exercises) {
  if (!exercises || exercises.length === 0) return 0;
  const completedCount = exercises.filter(e => e.is_completed).length;
  return Math.round((completedCount / exercises.length) * 100);
}

describe('calculateCompletionPercent', () => {
  test('returns 0 when no exercises', () => {
    expect(calculateCompletionPercent([])).toBe(0);
    expect(calculateCompletionPercent(null)).toBe(0);
    expect(calculateCompletionPercent(undefined)).toBe(0);
  });

  test('returns 0 when none completed', () => {
    const exercises = [
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(0);
  });

  test('returns 100 when all completed', () => {
    const exercises = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: true }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(100);
  });

  test('calculates 60% correctly (3 of 5)', () => {
    const exercises = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: false },
      { is_completed: false }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(60);
  });

  test('calculates 20% correctly (1 of 5)', () => {
    const exercises = [
      { is_completed: true },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(20);
  });

  test('rounds correctly (1 of 3 = 33%)', () => {
    const exercises = [
      { is_completed: true },
      { is_completed: false },
      { is_completed: false }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(33);
  });

  test('rounds correctly (2 of 3 = 67%)', () => {
    const exercises = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: false }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(67);
  });

  test('handles single exercise completed', () => {
    const exercises = [{ is_completed: true }];
    expect(calculateCompletionPercent(exercises)).toBe(100);
  });

  test('handles single exercise not completed', () => {
    const exercises = [{ is_completed: false }];
    expect(calculateCompletionPercent(exercises)).toBe(0);
  });

  test('ignores other properties', () => {
    const exercises = [
      { is_completed: true, name: 'Squat', notes: 'heavy' },
      { is_completed: false, name: 'Press' }
    ];
    expect(calculateCompletionPercent(exercises)).toBe(50);
  });
});

module.exports = { calculateCompletionPercent };
