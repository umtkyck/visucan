import type { ProjectStatus, SubscriptionTier } from '@visucan/types';

// Prisma stores enums in UPPER_CASE; the API surface uses lower_case
export const PROJECT_STATUS_TO_DB: Record<
  ProjectStatus,
  'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'
> = {
  draft: 'DRAFT',
  in_progress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  archived: 'ARCHIVED',
};

export function serializeProject<T extends { status: string }>(project: T) {
  return {
    ...project,
    status: project.status.toLowerCase() as ProjectStatus,
  };
}

export function toSubscriptionTier(subscription: string): SubscriptionTier {
  return subscription.toLowerCase() as SubscriptionTier;
}

// Shapes returned by the /api/projects BFF routes (dates serialized as strings)
export interface ProjectDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  boardWidth: number;
  boardHeight: number;
  layerCount: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

export interface ProjectListDto {
  items: ProjectDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
