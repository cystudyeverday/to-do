/**
 * Statistics API Routes
 * Endpoints for analytics and statistics
 * 
 * GET /api/statistics - Get overall statistics
 */

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api';
import { getOverallStatistics } from '@/lib/api/controllers';

/**
 * GET /api/statistics
 * Get comprehensive statistics
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  return getOverallStatistics(request);
});
