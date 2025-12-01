import { gql } from '@apollo/client/core';

// 项目查询
export const GET_PROJECTS = gql`
  query GetProjects {
    projects(order_by: { created_at: desc }) {
      id
      name
      description
      created_at
      updated_at
    }
  }
`;

export const GET_PROJECT_BY_ID = gql`
  query GetProjectById($id: String!) {
    projects_by_pk(id: $id) {
      id
      name
      description
      created_at
      updated_at
    }
  }
`;

// 任务查询
export const GET_ITEMS = gql`
  query GetItems {
    items(order_by: { created_at: desc }) {
      id
      title
      description
      type
      status
      project_id
      module
      created_at
      updated_at
      completed_at
    }
  }
`;

export const GET_ITEM_BY_ID = gql`
  query GetItemById($id: String!) {
    items_by_pk(id: $id) {
      id
      title
      description
      type
      status
      project_id
      module
      created_at
      updated_at
      completed_at
    }
  }
`;

export const GET_ITEMS_BY_PROJECT = gql`
  query GetItemsByProject($projectId: String!) {
    items(where: { project_id: { _eq: $projectId } }, order_by: { created_at: desc }) {
      id
      title
      description
      type
      status
      project_id
      module
      created_at
      updated_at
      completed_at
    }
  }
`;

// 统计查询
export const GET_STATISTICS = gql`
  query GetStatistics {
    items_aggregate {
      aggregate {
        count
      }
    }
    completed_items: items_aggregate(where: { status: { _eq: "Completed" } }) {
      aggregate {
        count
      }
    }
    in_progress_items: items_aggregate(where: { status: { _eq: "On progress" } }) {
      aggregate {
        count
      }
    }
    not_started_items: items_aggregate(where: { status: { _eq: "Not start" } }) {
      aggregate {
        count
      }
    }
    projects_aggregate {
      aggregate {
        count
      }
    }
  }
`;

