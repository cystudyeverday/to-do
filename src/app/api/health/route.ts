/**
 * Health Check API Route
 * Check the health status of the application and its dependencies
 * 
 * GET /api/health - Health check endpoint
 */

import { NextRequest } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { gql } from '@apollo/client/core';
import { asyncHandler, successResponse } from '@/lib/api';

const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    __typename
  }
`;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    api: 'healthy' | 'unhealthy';
    graphql: 'healthy' | 'unhealthy' | 'not_configured';
  };
}

/**
 * GET /api/health
 * Returns the health status of the application
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'healthy',
      graphql: 'not_configured',
    },
  };

  // Check GraphQL connection
  try {
    const hasuraEndpoint = process.env.HASURA_GRAPHQL_ENDPOINT;
    const hasuraSecret = process.env.HASURA_ADMIN_SECRET;

    if (hasuraEndpoint && hasuraSecret) {
      try {
        await apolloClient.query({
          query: HEALTH_CHECK_QUERY,
          fetchPolicy: 'network-only',
        });
        healthStatus.services.graphql = 'healthy';
      } catch {
        healthStatus.services.graphql = 'unhealthy';
        healthStatus.status = 'degraded';
      }
    }
  } catch {
    healthStatus.services.graphql = 'unhealthy';
    healthStatus.status = 'unhealthy';
  }

  return successResponse(healthStatus);
});
