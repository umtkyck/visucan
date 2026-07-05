'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Cpu,
  Clock,
  Layers,
  ChevronDown,
  Sparkles,
  Trash2,
  AlertTriangle,
  LogOut,
  Truck,
} from 'lucide-react';
import type { ProjectStatus } from '@visucan/types';
import { Modal, ModalFooter, Button, Spinner } from '@visucan/ui';
import { authApi, projectsApi } from '@/lib/api';
import type { ProjectDto } from '@/lib/projects';
import { NewProjectModal } from '@/components/projects/new-project-modal';
import { TrackShipmentModal } from '@/components/shipping/track-shipment-modal';
import { LogoMark } from '@/components/brand/logo';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isTrackShipmentOpen, setIsTrackShipmentOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects', filterStatus],
    queryFn: async () => {
      const response = await projectsApi.list({
        limit: 100,
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to load projects');
      }
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
    },
  });

  const projects = projectsQuery.data?.items ?? [];

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query)
    );
  });

  const handleMenuClick = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: ProjectDto) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setDeleteTarget(project);
  };

  const renderProjectMenu = (project: ProjectDto) => (
    <div className="relative">
      <button
        onClick={(e) => handleMenuClick(e, project.id)}
        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {openMenuId === project.id && (
        <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={(e) => handleDeleteClick(e, project)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      onClick={() => setOpenMenuId(null)}
    >
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark className="h-7 w-7 text-sky-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                VisuCAN
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/billing"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Billing
            </Link>
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
            <button
              onClick={async () => {
                await authApi.signOut();
                queryClient.clear();
                router.push('/');
              }}
              title="Sign out"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Projects
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage and design your PCB projects
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                New Project
              </div>
              <div className="text-sm text-gray-500">Start from scratch</div>
            </div>
          </button>
          <button className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900">
              <Sparkles className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                AI Design
              </div>
              <div className="text-sm text-gray-500">Describe your project</div>
            </div>
          </button>
          <button className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <Layers className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Templates
              </div>
              <div className="text-sm text-gray-500">Use a starter template</div>
            </div>
          </button>
          <button
            onClick={() => setIsTrackShipmentOpen(true)}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Truck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Track Shipment
              </div>
              <div className="text-sm text-gray-500">UPS · FedEx · USPS</div>
            </div>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 py-2 pl-4 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 p-1 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 ${
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading / Error / Projects */}
        {projectsQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" className="text-primary-600" />
          </div>
        ) : projectsQuery.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-300 py-16 dark:border-red-900">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Failed to load projects
            </h3>
            <p className="mt-1 text-gray-500">
              {projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : 'Something went wrong'}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => projectsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 dark:border-gray-700">
            <Cpu className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No projects found
            </h3>
            <p className="mt-1 text-gray-500">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first project to get started'}
            </p>
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <div className="flex h-full items-center justify-center">
                    <Cpu className="h-12 w-12 text-gray-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600 dark:text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {project.description}
                      </p>
                    </div>
                    {renderProjectMenu(project)}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {project.layerCount}L
                      </span>
                      <span>
                        {project.boardWidth}×{project.boardHeight}mm
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status]}`}
                    >
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Thumbnail */}
                <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Cpu className="h-8 w-8 text-gray-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 dark:text-white">
                    {project.name}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {project.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {project.layerCount}L
                  </span>
                  <span>
                    {project.boardWidth}×{project.boardHeight}mm
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status]}`}
                  >
                    {STATUS_LABELS[project.status]}
                  </span>
                  <span className="text-gray-400">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {renderProjectMenu(project)}
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />

      {/* Track Shipment Modal */}
      <TrackShipmentModal
        isOpen={isTrackShipmentOpen}
        onClose={() => setIsTrackShipmentOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete project"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {deleteTarget?.name}
          </span>
          ? This will permanently remove the project and all of its design
          data.
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
