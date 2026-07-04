'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Cpu,
  Layers,
  Ruler,
  Clock,
  Boxes,
  CircuitBoard,
  Workflow,
  ListOrdered,
  AlertTriangle,
} from 'lucide-react';
import type { ProjectStatus } from '@visucan/types';
import { Button, Spinner } from '@visucan/ui';
import { projectsApi } from '@/lib/api';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

type WorkspaceTab = 'block_diagram' | 'schematic' | 'pcb_layout' | 'bom';

const TABS: { id: WorkspaceTab; label: string; icon: typeof Boxes }[] = [
  { id: 'block_diagram', label: 'Block Diagram', icon: Workflow },
  { id: 'schematic', label: 'Schematic', icon: CircuitBoard },
  { id: 'pcb_layout', label: 'PCB Layout', icon: Boxes },
  { id: 'bom', label: 'BOM', icon: ListOrdered },
];

const TAB_DESCRIPTIONS: Record<WorkspaceTab, string> = {
  block_diagram:
    'Sketch the functional blocks of your design and how they connect. The interactive editor is coming soon.',
  schematic:
    'Turn your block diagram into a full schematic with the AI assistant. The schematic editor is coming soon.',
  pcb_layout:
    'Place components and route your board. The PCB layout editor is coming soon.',
  bom: 'Review your bill of materials with live DigiKey pricing. BOM management is coming soon.',
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('block_diagram');

  const projectQuery = useQuery({
    queryKey: ['projects', 'detail', params.id],
    queryFn: async () => {
      const response = await projectsApi.get(params.id);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to load project');
      }
      return response.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => projectsApi.update(params.id, { status }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (projectQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h1 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Project not found
        </h1>
        <p className="mt-1 text-gray-500">
          {projectQuery.error instanceof Error
            ? projectQuery.error.message
            : 'This project may have been deleted.'}
        </p>
        <Link href="/dashboard" className="mt-6">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const project = projectQuery.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {project.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={project.status}
              disabled={statusMutation.isPending}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              className="rounded-lg border border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {project.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4" />
              {project.boardWidth} × {project.boardHeight} mm
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {project.layerCount}-layer
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Workspace Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="-mb-px flex gap-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspace Panel */}
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-24 dark:border-gray-700">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40">
            <Cpu className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
            {TABS.find((tab) => tab.id === activeTab)?.label} workspace
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-gray-500">
            {TAB_DESCRIPTIONS[activeTab]}
          </p>
        </div>
      </main>
    </div>
  );
}
