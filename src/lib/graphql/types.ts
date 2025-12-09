/**
 * GraphQL Response Types
 * Type definitions for GraphQL API responses from Hasura
 */

/** GraphQL response type for a single project */
export type GraphQLProject = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

/** GraphQL response type for a single item */
export type GraphQLItem = {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: string;
  project_id: number;
  module: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

/** GraphQL query response types */
export type GetProjectsResponse = {
  projects: GraphQLProject[];
};

export type GetProjectByIdResponse = {
  projects_by_pk: GraphQLProject | null;
};

export type GetItemsResponse = {
  items: GraphQLItem[];
};

export type GetItemsByProjectResponse = {
  items: GraphQLItem[];
};

export type GetItemByIdResponse = {
  items_by_pk: GraphQLItem | null;
};

/** GraphQL mutation response types */
export type CreateProjectResponse = {
  insert_projects_one: GraphQLProject;
};

export type UpdateProjectResponse = {
  update_projects_by_pk: GraphQLProject | null;
};

export type DeleteProjectResponse = {
  delete_projects_by_pk: { id: number } | null;
};

export type CreateItemResponse = {
  insert_items_one: GraphQLItem;
};

export type UpdateItemResponse = {
  update_items_by_pk: GraphQLItem | null;
};

export type DeleteItemResponse = {
  delete_items_by_pk: { id: number } | null;
};

export type CreateItemsResponse = {
  insert_items: {
    returning: GraphQLItem[];
  };
};

