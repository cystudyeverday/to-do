import { NextResponse } from 'next/server';
import { apolloClient } from '@/lib/apollo-client';
import { GET_PROJECTS } from '@/lib/graphql/queries';
import { gql } from '@apollo/client/core';

// 简单的健康检查查询（不依赖任何表）
const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    __typename
  }
`;

export async function GET() {
  try {
    // 1. 检查环境变量配置
    const hasuraEndpoint = process.env.HASURA_GRAPHQL_ENDPOINT;
    const hasuraSecret = process.env.HASURA_ADMIN_SECRET;
    console.log('hasuraEndpoint', hasuraEndpoint);
    console.log('hasuraSecret', hasuraSecret);

    if (!hasuraEndpoint || !hasuraSecret) {
      return NextResponse.json({
        success: false,
        message: 'Missing Hasura configuration',
        details: {
          hasEndpoint: !!hasuraEndpoint,
          hasSecret: !!hasuraSecret,
          endpoint: hasuraEndpoint || 'Not configured',
        },
      }, { status: 400 });
    }

    // 2. 测试基本连接（健康检查查询）
    let healthCheckSuccess = false;
    let healthCheckError: string | null = null;

    try {
      const healthResult = await apolloClient.query({
        query: HEALTH_CHECK_QUERY,
        fetchPolicy: 'network-only',
      });
      healthCheckSuccess = !!healthResult.data;
    } catch (error: any) {
      healthCheckError = error.message || 'Unknown error';
      healthCheckSuccess = false;
    }

    // 3. 测试实际数据查询（如果健康检查成功）
    let dataQuerySuccess = false;
    let dataQueryError: string | null = null;
    let projectCount = 0;

    if (healthCheckSuccess) {
      try {
        const { data } = await apolloClient.query<{
          projects: Array<{ id: string }>;
        }>({
          query: GET_PROJECTS,
          fetchPolicy: 'network-only',
        });

        if (data) {
          dataQuerySuccess = true;
          projectCount = data.projects.length;
        }
      } catch (error: any) {
        dataQueryError = error.message || 'Unknown error';
        dataQuerySuccess = false;
      }
    }

    // 4. 返回测试结果
    const overallSuccess = healthCheckSuccess && dataQuerySuccess;

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess
        ? 'GraphQL connection successful'
        : 'GraphQL connection failed',
      details: {
        configuration: {
          endpoint: hasuraEndpoint,
          hasSecret: !!hasuraSecret,
          secretLength: hasuraSecret?.length || 0,
        },
        healthCheck: {
          success: healthCheckSuccess,
          error: healthCheckError,
        },
        dataQuery: {
          success: dataQuerySuccess,
          error: dataQueryError,
          projectCount,
        },
        timestamp: new Date().toISOString(),
      },
    }, {
      status: overallSuccess ? 200 : 500,
    });

  } catch (error) {
    console.error('GraphQL connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

