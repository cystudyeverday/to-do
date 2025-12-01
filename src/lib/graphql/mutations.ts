import { gql } from '@apollo/client/core';

// 项目变更
export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    insert_projects_one(object: { name: $name, description: $description }) {
      id
      name
      description
      created_at
      updated_at
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: Int!, $name: String, $description: String) {
    update_projects_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, description: $description, updated_at: "now()" }
    ) {
      id
      name
      description
      created_at
      updated_at
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: Int!) {
    delete_projects_by_pk(id: $id) {
      id
    }
  }
`;

// 任务变更
export const CREATE_ITEM = gql`
  mutation CreateItem(
    $title: String!
    $description: String
    $type: String!
    $status: String!
    $project_id: Int!
    $module: String
  ) {
    insert_items_one(
      object: {
        title: $title
        description: $description
        type: $type
        status: $status
        project_id: $project_id
        module: $module
      }
    ) {
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

export const UPDATE_ITEM = gql`
  mutation UpdateItem(
    $id: Int!
    $title: String
    $description: String
    $type: String
    $status: String
    $project_id: Int
    $module: String
    $completed_at: timestamp
  ) {
    update_items_by_pk(
      pk_columns: { id: $id }
      _set: {
        title: $title
        description: $description
        type: $type
        status: $status
        project_id: $project_id
        module: $module
        completed_at: $completed_at
        updated_at: "now()"
      }
    ) {
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

export const DELETE_ITEM = gql`
  mutation DeleteItem($id: Int!) {
    delete_items_by_pk(id: $id) {
      id
    }
  }
`;

// 批量操作
export const CREATE_ITEMS = gql`
  mutation CreateItems($objects: [items_insert_input!]!) {
    insert_items(objects: $objects) {
      returning {
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
  }
`;

