// app/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';

const HASURA_GRAPHQL_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || '';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || '';

// 验证环境变量配置
if (!HASURA_GRAPHQL_ENDPOINT || !HASURA_ADMIN_SECRET) {
  console.warn(
    '⚠️  Hasura GraphQL 配置缺失。请在 .env.local 文件中设置：\n' +
    '  HASURA_GRAPHQL_ENDPOINT=your-endpoint-url\n' +
    '  HASURA_ADMIN_SECRET=your-admin-secret'
  );
}

// 构建请求头
const headers: Record<string, string> = {};
if (HASURA_ADMIN_SECRET) {
  headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
}

const httpLink = createHttpLink({
  uri: HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql',
  headers,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// 导出配置检查函数
export function isHasuraConfigured(): boolean {
  return !!(HASURA_GRAPHQL_ENDPOINT && HASURA_ADMIN_SECRET);
}
