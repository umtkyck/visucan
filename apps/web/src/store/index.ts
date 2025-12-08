// ============================================================
// VISUCAN STATE MANAGEMENT
// Zustand stores for the application
// ============================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  User,
  Project,
  SubscriptionTier,
  ChatMessage,
  Component,
  DRCResult,
} from '@visucan/types';

// ============================================================
// AUTH STORE
// ============================================================

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        setUser: (user) =>
          set({ user, isAuthenticated: !!user, isLoading: false }),
        setLoading: (isLoading) => set({ isLoading }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      {
        name: 'visucan-auth',
        partialize: (state) => ({ user: state.user }),
      }
    )
  )
);

// ============================================================
// PROJECT STORE
// ============================================================

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools((set) => ({
    currentProject: null,
    projects: [],
    isLoading: false,
    setCurrentProject: (currentProject) => set({ currentProject }),
    setProjects: (projects) => set({ projects }),
    addProject: (project) =>
      set((state) => ({ projects: [...state.projects, project] })),
    updateProject: (id, updates) =>
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
        currentProject:
          state.currentProject?.id === id
            ? { ...state.currentProject, ...updates }
            : state.currentProject,
      })),
    deleteProject: (id) =>
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
      })),
    setLoading: (isLoading) => set({ isLoading }),
  }))
);

// ============================================================
// DESIGN EDITOR STORE
// ============================================================

type EditorMode = 'select' | 'pan' | 'zoom' | 'component' | 'trace' | 'via' | 'text';
type EditorView = 'schematic' | 'pcb' | 'block_diagram' | '3d';

interface DesignEditorState {
  mode: EditorMode;
  view: EditorView;
  zoom: number;
  pan: { x: number; y: number };
  selectedIds: string[];
  clipboard: unknown[];
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  activeLayer: string;
  visibleLayers: string[];
  undoStack: unknown[];
  redoStack: unknown[];
  setMode: (mode: EditorMode) => void;
  setView: (view: EditorView) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setActiveLayer: (layer: string) => void;
  toggleLayerVisibility: (layer: string) => void;
  undo: () => void;
  redo: () => void;
  pushUndo: (state: unknown) => void;
}

export const useDesignEditorStore = create<DesignEditorState>()(
  devtools((set, get) => ({
    mode: 'select',
    view: 'schematic',
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedIds: [],
    clipboard: [],
    gridSize: 10,
    snapToGrid: true,
    showGrid: true,
    activeLayer: 'top_copper',
    visibleLayers: [
      'top_copper',
      'bottom_copper',
      'top_silk',
      'bottom_silk',
      'outline',
    ],
    undoStack: [],
    redoStack: [],
    setMode: (mode) => set({ mode }),
    setView: (view) => set({ view }),
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
    setPan: (pan) => set({ pan }),
    setSelectedIds: (selectedIds) => set({ selectedIds }),
    addToSelection: (id) =>
      set((state) => ({
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds
          : [...state.selectedIds, id],
      })),
    removeFromSelection: (id) =>
      set((state) => ({
        selectedIds: state.selectedIds.filter((i) => i !== id),
      })),
    clearSelection: () => set({ selectedIds: [] }),
    setGridSize: (gridSize) => set({ gridSize }),
    setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
    setShowGrid: (showGrid) => set({ showGrid }),
    setActiveLayer: (activeLayer) => set({ activeLayer }),
    toggleLayerVisibility: (layer) =>
      set((state) => ({
        visibleLayers: state.visibleLayers.includes(layer)
          ? state.visibleLayers.filter((l) => l !== layer)
          : [...state.visibleLayers, layer],
      })),
    undo: () => {
      const { undoStack, redoStack } = get();
      if (undoStack.length > 0) {
        const lastState = undoStack[undoStack.length - 1];
        set({
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, lastState],
        });
      }
    },
    redo: () => {
      const { undoStack, redoStack } = get();
      if (redoStack.length > 0) {
        const nextState = redoStack[redoStack.length - 1];
        set({
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, nextState],
        });
      }
    },
    pushUndo: (state) =>
      set((s) => ({ undoStack: [...s.undoStack.slice(-50), state] })),
  }))
);

// ============================================================
// CHAT STORE
// ============================================================

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  suggestedComponents: Component[];
  drcResults: DRCResult | null;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSuggestedComponents: (components: Component[]) => void;
  setDrcResults: (results: DRCResult | null) => void;
}

export const useChatStore = create<ChatState>()(
  devtools((set) => ({
    messages: [],
    isLoading: false,
    suggestedComponents: [],
    drcResults: null,
    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    setMessages: (messages) => set({ messages }),
    clearMessages: () => set({ messages: [] }),
    setLoading: (isLoading) => set({ isLoading }),
    setSuggestedComponents: (suggestedComponents) =>
      set({ suggestedComponents }),
    setDrcResults: (drcResults) => set({ drcResults }),
  }))
);

// ============================================================
// UI STORE
// ============================================================

interface UIState {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  componentBrowserOpen: boolean;
  propertiesPanelOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleChatPanel: () => void;
  toggleComponentBrowser: () => void;
  togglePropertiesPanel: () => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setChatPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        chatPanelOpen: true,
        componentBrowserOpen: false,
        propertiesPanelOpen: true,
        darkMode: false,
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        toggleChatPanel: () =>
          set((s) => ({ chatPanelOpen: !s.chatPanelOpen })),
        toggleComponentBrowser: () =>
          set((s) => ({ componentBrowserOpen: !s.componentBrowserOpen })),
        togglePropertiesPanel: () =>
          set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),
        toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setChatPanelOpen: (chatPanelOpen) => set({ chatPanelOpen }),
      }),
      {
        name: 'visucan-ui',
      }
    )
  )
);

// ============================================================
// NOTIFICATION STORE
// ============================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set) => ({
    toasts: [],
    addToast: (toast) => {
      const id = Math.random().toString(36).slice(2);
      set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

      // Auto remove after duration
      if (toast.duration !== 0) {
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, toast.duration || 5000);
      }
    },
    removeToast: (id) =>
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    clearToasts: () => set({ toasts: [] }),
  }))
);
