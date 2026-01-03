/**
 * Upload Routes - Vercel Blob Integration
 *
 * Handles client-side uploads to Vercel Blob storage.
 * Requires BLOB_READ_WRITE_TOKEN environment variable.
 *
 * Endpoints:
 * - POST /api/upload/media - Handle client upload token generation
 */

const express = require('express');
const router = express.Router();
const { handleUpload } = require('@vercel/blob/client');

/**
 * Middleware: Verify authentication
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware: Verify admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * POST /api/upload/media
 * Handle Vercel Blob client upload
 *
 * This endpoint is called by @vercel/blob/client to:
 * 1. Generate upload tokens
 * 2. Receive upload completion callbacks
 */
router.post('/media', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN environment variable.'
      });
    }

    const body = req.body;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Verify user is still authenticated and is admin
        if (!req.user || req.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        console.log(`[Upload] Generating token for: ${pathname} by user: ${req.user.email}`);

        return {
          allowedContentTypes: [
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: req.user.id,
            email: req.user.email,
            uploadedAt: new Date().toISOString()
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called when upload completes
        console.log('[Upload] Completed:', {
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: blob.size
        });

        try {
          const payload = JSON.parse(tokenPayload || '{}');
          console.log(`[Upload] Uploaded by user: ${payload.email}`);

          // Optional: Store upload record in database
          // await db.query('INSERT INTO uploads ...', [...]);

        } catch (error) {
          console.error('[Upload] Error processing completion:', error);
        }
      },
    });

    res.json(jsonResponse);
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(400).json({
      error: error.message || 'Upload failed'
    });
  }
});

/**
 * GET /api/upload/status
 * Check if Vercel Blob is configured
 */
router.get('/status', requireAuth, requireAdmin, (req, res) => {
  const configured = !!process.env.BLOB_READ_WRITE_TOKEN;
  res.json({
    configured,
    message: configured
      ? 'Vercel Blob is configured'
      : 'Set BLOB_READ_WRITE_TOKEN in environment variables'
  });
});

module.exports = router;
