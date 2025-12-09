import { NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { gql } from '@apollo/client/core';

const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    __typename
  }
`;

export async function GET() {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'healthy',
      graphql: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    },
  };

  // 检查 GraphQL 连接
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
      }
    } else {
      healthStatus.services.graphql = 'not_configured';
    }
  } catch {
    healthStatus.services.graphql = 'unhealthy';
  }

  return NextResponse.json(healthStatus);
} 