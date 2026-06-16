import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import apiClient from '../api/client';

interface BoardState {
  currentBoard: any | null;
  isLoading: boolean;
  socket: Socket | null;
  cursors: Record<string, { x: number; y: number; email: string }>;
  lockedCards: Record<string, string>;
  fetchBoardById: (id: string) => Promise<void>;
  createColumn: (boardId: string, title: string) => Promise<void>;
  createCard: (columnId: string, title: string) => Promise<void>;
  moveCard: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => Promise<void>;
  addCollaborator: (boardId: string, email: string) => Promise<{ success: boolean; message?: string }>;
  lockCard: (cardId: string, email: string) => void;
  unlockCard: (cardId: string) => void;
  initSocket: (boardId: string) => void;
  disconnectSocket: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  currentBoard: null,
  isLoading: false,
  socket: null,
  cursors: {}, 
  lockedCards: {},

  fetchBoardById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/boards/${id}`);
      const board = response.data;
      if (!board.columns) board.columns = [];
      
      board.columns.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      board.columns.forEach((col: any) => {
        if (col.cards) {
          col.cards.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        }
      });
      
      set({ currentBoard: board, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch board", error);
      set({ isLoading: false });
    }
  },

  createColumn: async (boardId, title) => {
    try {
      const response = await apiClient.post('/columns', { boardId, title });
      const newColumn = response.data;
      
      set((state) => {
        if (!state.currentBoard) return state;
        return {
          currentBoard: {
            ...state.currentBoard,
            columns: [...state.currentBoard.columns, { ...newColumn, cards: [] }]
          }
        };
      });
    } catch (error) {
      console.error("Failed to create column", error);
    }
  },

  createCard: async (columnId, title) => {
    try {
      const response = await apiClient.post('/cards', { columnId, title });
      const newCard = response.data;
      
      set((state) => {
        if (!state.currentBoard) return state;
        const updatedColumns = state.currentBoard.columns.map((col: any) => {
          if (col.id === columnId) {
            return { ...col, cards: [...(col.cards || []), newCard] };
          }
          return col;
        });
        return { currentBoard: { ...state.currentBoard, columns: updatedColumns } };
      });
    } catch (error) {
      console.error("Failed to create card", error);
    }
  },

  moveCard: async (cardId, sourceColId, destColId, newIndex) => {
    const { currentBoard, socket } = get();
    if (!currentBoard) return;

    const columns = JSON.parse(JSON.stringify(currentBoard.columns));
    const sourceCol = columns.find((c: any) => c.id === sourceColId);
    const destCol = columns.find((c: any) => c.id === destColId);

    if (!sourceCol || !destCol) return;

    const cardIndex = sourceCol.cards.findIndex((c: any) => c.id === cardId);
    const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
    destCol.cards.splice(newIndex, 0, movedCard);

    const payload: { id: string; order: number; columnId: string }[] = [];

    destCol.cards.forEach((c: any, i: number) => {
      c.order = i;
      payload.push({ id: c.id, order: i, columnId: destCol.id });
    });

    if (sourceColId !== destColId) {
      sourceCol.cards.forEach((c: any, i: number) => {
        c.order = i;
        payload.push({ id: c.id, order: i, columnId: sourceCol.id });
      });
    }

    set({ currentBoard: { ...currentBoard, columns } });

    try {
      await apiClient.patch('/cards/reorder', { cards: payload });

      if (socket) {
        socket.emit('board-updated', { boardId: currentBoard.id });
      }
    } catch (error) {
      console.error("Failed to save card move", error);
      get().fetchBoardById(currentBoard.id); 
    }
  },

  addCollaborator: async (boardId, email) => {
    try {
      await apiClient.post(`/boards/${boardId}/collaborators`, { email });
      get().fetchBoardById(boardId); 
      return { success: true };
    } catch (error: any) {
      console.error("Failed to add collaborator", error);
      return { success: false, message: error.response?.data?.message || "Failed to invite user" };
    }
  },

  lockCard: (cardId, email) => {
    const { currentBoard, socket } = get();
    if (socket && currentBoard) {
      socket.emit('card-lock', { boardId: currentBoard.id, cardId, email });
    }
  },

  unlockCard: (cardId) => {
    const { currentBoard, socket } = get();
    if (socket && currentBoard) {
      socket.emit('card-unlock', { boardId: currentBoard.id, cardId });
    }
  },

  initSocket: (boardId) => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('🔌 Web Client Connected to Socket');
    });

    newSocket.on(`board-updated-${boardId}`, () => {
      get().fetchBoardById(boardId);
    });

    newSocket.on(`cursor-updated-${boardId}`, (data: { socketId: string, x: number, y: number, email: string }) => {
      set((state) => ({
        cursors: {
          ...state.cursors,
          [data.socketId]: { x: data.x, y: data.y, email: data.email }
        }
      }));
    });

    newSocket.on(`card-locked-${boardId}`, (data: { cardId: string; email: string }) => {
      set((state) => ({
        lockedCards: { ...state.lockedCards, [data.cardId]: data.email }
      }));
    });

    newSocket.on(`card-unlocked-${boardId}`, (data: { cardId: string }) => {
      set((state) => {
        const newLockedCards = { ...state.lockedCards };
        delete newLockedCards[data.cardId];
        return { lockedCards: newLockedCards };
      });
    });

    newSocket.on('user-disconnected', (socketId: string) => {
      set((state) => {
        const newCursors = { ...state.cursors };
        delete newCursors[socketId];
        return { cursors: newCursors };
      });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, cursors: {}, lockedCards: {} }); 
    }
  }
}));