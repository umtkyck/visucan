'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, ModalFooter, Button, Input, Textarea } from '@visucan/ui';
import { projectsApi } from '@/lib/api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LAYER_OPTIONS = [1, 2, 4] as const;

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [boardWidth, setBoardWidth] = useState('50');
  const [boardHeight, setBoardHeight] = useState('50');
  const [layerCount, setLayerCount] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        boardWidth: Number(boardWidth),
        boardHeight: Number(boardHeight),
        layerCount,
      }),
    onSuccess: (response) => {
      if (!response.success || !response.data) {
        setError(response.error?.message ?? 'Failed to create project');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      router.push(`/projects/${response.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    const width = Number(boardWidth);
    const height = Number(boardHeight);
    if (!width || width <= 0 || !height || height <= 0) {
      setError('Board dimensions must be positive numbers');
      return;
    }

    createMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Project"
      description="Set up your PCB project. You can change these settings later."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g. Temperature Sensor Board"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoFocus
        />

        <Textarea
          label="Description (optional)"
          placeholder="What does this board do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Board width (mm)"
            type="number"
            min={1}
            max={500}
            value={boardWidth}
            onChange={(e) => setBoardWidth(e.target.value)}
          />
          <Input
            label="Board height (mm)"
            type="number"
            min={1}
            max={500}
            value={boardHeight}
            onChange={(e) => setBoardHeight(e.target.value)}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Layers
          </span>
          <div className="flex gap-2">
            {LAYER_OPTIONS.map((layers) => (
              <button
                key={layers}
                type="button"
                onClick={() => setLayerCount(layers)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  layerCount === layers
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {layers}-layer
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Create project
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
