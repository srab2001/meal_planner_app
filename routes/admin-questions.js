/**
 * Admin Panel Routes - Interview Questions Management
 * 
 * Endpoints:
 * - GET /api/admin/questions - List all questions (admin only)
 * - GET /api/admin/questions/active - List active questions (public)
 * - POST /api/admin/questions - Create question (admin only)
 * - PUT /api/admin/questions/:id - Update question (admin only)
 * - DELETE /api/admin/questions/:id - Delete question (admin only)
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return new Pool({ connectionString: dbUrl });
}

// Admin authentication middleware
function adminAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'not_authenticated', message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden', message: 'Admin access required' });
  }

  next();
}

// Attach to req for routes
router.use((req, res, next) => {
  req.adminAuth = adminAuth;
  next();
});

// ============================================================================
// GET /api/admin/questions - List all questions (admin only)
// ============================================================================
router.get('/questions', adminAuth, async (req, res) => {
  try {
    console.log('[Admin] Fetching all interview questions');
    
    const db = getDb();
    const result = await db.query(
      `SELECT * FROM admin_interview_questions 
       ORDER BY order_position ASC`
    );
    
    console.log(`[Admin] Retrieved ${result.rows.length} questions`);
    
    res.json({
      success: true,
      questions: result.rows
    });
    
    await db.end();
  } catch (error) {
    console.error('[Admin] Error fetching questions:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to fetch questions',
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/admin/questions/active - List active questions (public, for AI Coach)
// ============================================================================
router.get('/questions/active', async (req, res) => {
  try {
    console.log('[Admin] Fetching active interview questions for AI Coach');
    
    const db = getDb();
    const result = await db.query(
      `SELECT id, question_text, question_type, options, option_range, order_position
       FROM admin_interview_questions 
       WHERE is_active = true
       ORDER BY order_position ASC`
    );
    
    console.log(`[Admin] Retrieved ${result.rows.length} active questions`);
    
    res.json({
      success: true,
      questions: result.rows
    });
    
    await db.end();
  } catch (error) {
    console.error('[Admin] Error fetching active questions:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to fetch active questions'
    });
  }
});

// ============================================================================
// POST /api/admin/questions - Create new question (admin only)
// ============================================================================
router.post('/questions', adminAuth, async (req, res) => {
  try {
    const { question_text, question_type, options, option_range, order_position } = req.body;
    
    // Validation
    if (!question_text || !question_text.trim()) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'question_text is required'
      });
    }
    
    if (!['text', 'multiple_choice', 'yes_no', 'range'].includes(question_type)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid question_type'
      });
    }
    
    if (question_type === 'multiple_choice' && (!options || !Array.isArray(options))) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'options array required for multiple_choice type'
      });
    }
    
    if (question_type === 'range' && !option_range) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'option_range required for range type'
      });
    }
    
    console.log('[Admin] Creating new interview question:', question_text);
    
    const db = getDb();
    const result = await db.query(
      `INSERT INTO admin_interview_questions 
       (question_text, question_type, options, option_range, order_position, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [question_text, question_type, JSON.stringify(options), option_range, order_position || 999]
    );
    
    console.log('[Admin] Question created successfully:', result.rows[0].id);
    
    res.status(201).json({
      success: true,
      question: result.rows[0]
    });
    
    await db.end();
  } catch (error) {
    console.error('[Admin] Error creating question:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to create question',
      details: error.message
    });
  }
});

// ============================================================================
// PUT /api/admin/questions/:id - Update question (admin only)
// ============================================================================
router.put('/questions/:id', adminAuth, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { question_text, question_type, options, option_range, order_position, is_active } = req.body;
    
    console.log('[Admin] Updating question:', questionId);
    
    const db = getDb();
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (question_text !== undefined) {
      updateFields.push(`question_text = $${paramCount}`);
      updateValues.push(question_text);
      paramCount++;
    }
    if (question_type !== undefined) {
      updateFields.push(`question_type = $${paramCount}`);
      updateValues.push(question_type);
      paramCount++;
    }
    if (options !== undefined) {
      updateFields.push(`options = $${paramCount}`);
      updateValues.push(JSON.stringify(options));
      paramCount++;
    }
    if (option_range !== undefined) {
      updateFields.push(`option_range = $${paramCount}`);
      updateValues.push(option_range);
      paramCount++;
    }
    if (order_position !== undefined) {
      updateFields.push(`order_position = $${paramCount}`);
      updateValues.push(order_position);
      paramCount++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      updateValues.push(is_active);
      paramCount++;
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(questionId);
    
    const query = `UPDATE admin_interview_questions 
                   SET ${updateFields.join(', ')}
                   WHERE id = $${paramCount}
                   RETURNING *`;
    
    const result = await db.query(query, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Question not found'
      });
    }
    
    console.log('[Admin] Question updated successfully:', result.rows[0].id);
    
    res.json({
      success: true,
      question: result.rows[0]
    });
    
    await db.end();
  } catch (error) {
    console.error('[Admin] Error updating question:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to update question',
      details: error.message
    });
  }
});

// ============================================================================
// DELETE /api/admin/questions/:id - Delete question (admin only)
// ============================================================================
router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    const questionId = req.params.id;
    
    console.log('[Admin] Deleting question:', questionId);
    
    const db = getDb();
    
    // Soft delete (set is_active to false) instead of hard delete
    const result = await db.query(
      `UPDATE admin_interview_questions 
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [questionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Question not found'
      });
    }
    
    console.log('[Admin] Question soft-deleted successfully:', questionId);
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
    
    await db.end();
  } catch (error) {
    console.error('[Admin] Error deleting question:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to delete question',
      details: error.message
    });
  }
});

// ============================================================================
// Reorder questions
// PUT /api/admin/questions/reorder - Bulk reorder (admin only)
// ============================================================================
router.put('/questions/reorder', adminAuth, async (req, res) => {
  try {
    const { questionOrders } = req.body; // Array of { id, order_position }
    
    if (!Array.isArray(questionOrders)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'questionOrders must be an array'
      });
    }
    
    console.log('[Admin] Reordering questions');
    
    const db = getDb();
    
    // Update all questions in one transaction
    await db.query('BEGIN');
    
    for (const { id, order_position } of questionOrders) {
      await db.query(
        `UPDATE admin_interview_questions 
         SET order_position = $1, updated_at = NOW()
         WHERE id = $2`,
        [order_position, id]
      );
    }
    
    await db.query('COMMIT');
    
    console.log('[Admin] Questions reordered successfully');
    
    res.json({
      success: true,
      message: 'Questions reordered successfully'
    });
    
    await db.end();
  } catch (error) {
    console.error('[Admin] Error reordering questions:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to reorder questions',
      details: error.message
    });
  }
});

module.exports = router;
