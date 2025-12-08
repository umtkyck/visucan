'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

// Mock data for projects
const mockProjects = [
  {
    id: '1',
    name: 'Temperature Sensor Board',
    description: 'ESP32-based temperature and humidity monitoring',
    status: 'in_progress',
    layers: 2,
    boardSize: { width: 50, height: 40 },
    updatedAt: new Date('2024-01-10'),
    thumbnail: null,
  },
  {
    id: '2',
    name: 'Motor Controller',
    description: 'STM32 4-channel motor driver with current sensing',
    status: 'completed',
    layers: 4,
    boardSize: { width: 80, height: 60 },
    updatedAt: new Date('2024-01-08'),
    thumbnail: null,
  },
  {
    id: '3',
    name: 'USB-C PD Trigger',
    description: 'USB Power Delivery trigger board',
    status: 'draft',
    layers: 2,
    boardSize: { width: 30, height: 25 },
    updatedAt: new Date('2024-01-05'),
    thumbnail: null,
  },
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                VisuCAN
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Plus className="h-4 w-4" />
              New Project
            </button>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
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
          <button className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
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
          <button className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Cpu className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Import
              </div>
              <div className="text-sm text-gray-500">From Altium/KiCad</div>
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

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
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
            <button className="mt-6 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Open menu
                      }}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {project.layers}L
                      </span>
                      <span>
                        {project.boardSize.width}×{project.boardSize.height}mm
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {project.updatedAt.toLocaleDateString()}
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
                    {project.layers}L
                  </span>
                  <span>
                    {project.boardSize.width}×{project.boardSize.height}mm
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                  <span className="text-gray-400">
                    {project.updatedAt.toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Open menu
                  }}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
