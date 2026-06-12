import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import apiClient from '../api/client';

export interface CardItem {
  id: string;
  title: string;
  description?: string;
}

export interface ColumnItem {
  id: string;
  title: string;
  cards: CardItem[];
}

export interface Board {
  id: string;
  name: string;
  columns?: ColumnItem[];
}

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  socket: Socket | null;
  
  fetchBoards: () => Promise<void>;
  createBoard: (name: string) => Promise<void>;
  fetchBoardById: (id: string) => Promise<void>;
  createColumn: (boardId: string, title: string) => Promise<void>;
  createCard: (columnId: string, title: string) => Promise<void>;
  
  initSocket: (boardId: string) => void;
  disconnectSocket: () => void;
  notifyBoardUpdate: (boardId: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  socket: null,
  
  initSocket: (boardId: string) => {
    const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');
    
    socket.on(`board-updated-${boardId}`, () => {
      get().fetchBoardById(boardId);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  notifyBoardUpdate: (boardId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('board-updated', { boardId });
    }
  },
  
  fetchBoards: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/boards');
      set({ boards: response.data });
    } catch (error) {
      console.error('Failed to fetch boards', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createBoard: async (name: string) => {
    try {
      const response = await apiClient.post('/boards', { name });
      set((state) => ({ boards: [...state.boards, response.data] }));
    } catch (error) {
      console.error('Failed to create board', error);
    }
  },

  fetchBoardById: async (id: string) => {
    set({ isLoading: true, currentBoard: null });
    try {
      const response = await apiClient.get(`/boards/${id}`);
      set({ currentBoard: response.data });
    } catch (error) {
      console.error('Failed to fetch board details', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createColumn: async (boardId: string, title: string) => {
    try {
      const response = await apiClient.post('/columns', { boardId, title });
      const currentBoard = get().currentBoard;
      
      if (currentBoard && currentBoard.id === boardId) {
        set({
          currentBoard: {
            ...currentBoard,
            columns: [...(currentBoard.columns || []), { ...response.data, cards: [] }],
          },
        });
        get().notifyBoardUpdate(boardId);
      }
    } catch (error) {
      console.error('Failed to create column', error);
    }
  },

  createCard: async (columnId: string, title: string) => {
    try {
      const response = await apiClient.post('/cards', { columnId, title });
      const currentBoard = get().currentBoard;
      
      if (currentBoard) {
        const updatedColumns = currentBoard.columns?.map(col => {
          if (col.id === columnId) {
            return { ...col, cards: [...(col.cards || []), response.data] };
          }
          return col;
        });

        set({ currentBoard: { ...currentBoard, columns: updatedColumns } });
        get().notifyBoardUpdate(currentBoard.id);
      }
    } catch (error) {
      console.error('Failed to create card', error);
    }
  }
}));