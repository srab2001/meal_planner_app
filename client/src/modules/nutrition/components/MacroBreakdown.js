import React from 'react';
import './MacroBreakdown.css';

/**
 * MacroBreakdown - Visual breakdown of macronutrients
 * 
 * Displays:
 * - Protein, Carbs, Fat percentages
 * - Bar chart visualization
 * - Goal progress for each macro
 */
export default function MacroBreakdown({ protein = 0, carbs = 0, fat = 0, goals }) {
  const defaultGoals = {
    protein: 50,
    carbs: 250,
    fat: 65
  };

  const g = goals || defaultGoals;

  // Calculate percentages of daily goal
  const proteinPercent = Math.min(Math.round((protein / g.protein) * 100), 100);
  const carbsPercent = Math.min(Math.round((carbs / g.carbs) * 100), 100);
  const fatPercent = Math.min(Math.round((fat / g.fat) * 100), 100);

  // Calculate macro distribution (what % of total grams each macro is)
  const totalGrams = protein + carbs + fat;
  const proteinDist = totalGrams > 0 ? Math.round((protein / totalGrams) * 100) : 0;
  const carbsDist = totalGrams > 0 ? Math.round((carbs / totalGrams) * 100) : 0;
  const fatDist = totalGrams > 0 ? Math.round((fat / totalGrams) * 100) : 0;

  return (
    <div className="macro-breakdown">
      <h3 className="breakdown-title">Macro Breakdown</h3>

      {/* Distribution Bar */}
      <div className="macro-distribution">
        <div className="distribution-bar">
          <div 
            className="distribution-segment protein"
            style={{ width: `${proteinDist}%` }}
            title={`Protein: ${proteinDist}%`}
          />
          <div 
            className="distribution-segment carbs"
            style={{ width: `${carbsDist}%` }}
            title={`Carbs: ${carbsDist}%`}
          />
          <div 
            className="distribution-segment fat"
            style={{ width: `${fatDist}%` }}
            title={`Fat: ${fatDist}%`}
          />
        </div>
        <div className="distribution-labels">
          <span className="label protein">Protein {proteinDist}%</span>
          <span className="label carbs">Carbs {carbsDist}%</span>
          <span className="label fat">Fat {fatDist}%</span>
        </div>
      </div>

      {/* Individual Macro Progress */}
      <div className="macro-details">
        {/* Protein */}
        <div className="macro-row">
          <div className="macro-info">
            <span className="macro-icon protein">🥩</span>
            <span className="macro-name">Protein</span>
          </div>
          <div className="macro-progress-container">
            <div className="macro-progress-bar">
              <div 
                className="macro-progress-fill protein"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <span className="macro-values">{protein}g / {g.protein}g</span>
          </div>
        </div>

        {/* Carbs */}
        <div className="macro-row">
          <div className="macro-info">
            <span className="macro-icon carbs">🍞</span>
            <span className="macro-name">Carbs</span>
          </div>
          <div className="macro-progress-container">
            <div className="macro-progress-bar">
              <div 
                className="macro-progress-fill carbs"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <span className="macro-values">{carbs}g / {g.carbs}g</span>
          </div>
        </div>

        {/* Fat */}
        <div className="macro-row">
          <div className="macro-info">
            <span className="macro-icon fat">🥑</span>
            <span className="macro-name">Fat</span>
          </div>
          <div className="macro-progress-container">
            <div className="macro-progress-bar">
              <div 
                className="macro-progress-fill fat"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
            <span className="macro-values">{fat}g / {g.fat}g</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="macro-total">
        <span className="total-label">Total:</span>
        <span className="total-value">{totalGrams}g</span>
      </div>
    </div>
  );
}
