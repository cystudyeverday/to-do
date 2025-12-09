/**
 * Statistics Controller
 * Handles HTTP requests for statistics endpoints
 */

import { NextRequest } from 'next/server';
import { successResponse } from '../response';
import { parseIntParam } from '../validation';
import { getStatistics, getProjectStatistics, getTrendData } from '@/lib/services';

/**
 * Get overall statistics
 */
export async function getOverallStatistics(request: NextRequest) {
  const statistics = await getStatistics();
  return successResponse(statistics);
}

/**
 * Get project statistics
 */
export async function getProjectStats(
  request: NextRequest,
  params: { id: string }
) {
  const projectId = parseIntParam(params.id, 'Project ID');
  const statistics = await getProjectStatistics(projectId);
  return successResponse(statistics);
}

/**
 * Get trend data
 */
export async function getTrends(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  // Validate days parameter
  const validDays = Math.min(365, Math.max(1, days));

  const trendData = await getTrendData(validDays);
  return successResponse(trendData);
}

