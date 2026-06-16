import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import apiClient from '../api/client';

interface BoardState {
  currentBoard: any | null;
  isLoading: boolean;
  socket: Socket | null;
  fetchBoardById: (id: string) => Promise<void>;
  createColumn: (boardId: string, title: string) => Promise<void>;
  createCard: (columnId: string, title: string) => Promise<void>;
  moveCard: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => Promise<void>;
  initSocket: (boardId: string) => void;
  disconnectSocket: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  currentBoard: null,
  isLoading: false,
  socket: null,

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

    // 1. Optimistic UI Array Clone
    const columns = JSON.parse(JSON.stringify(currentBoard.columns));
    const sourceCol = columns.find((c: any) => c.id === sourceColId);
    const destCol = columns.find((c: any) => c.id === destColId);

    if (!sourceCol || !destCol) return;

    // 2. Shift the array on the screen
    const cardIndex = sourceCol.cards.findIndex((c: any) => c.id === cardId);
    const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
    destCol.cards.splice(newIndex, 0, movedCard);

    // 3. Compile the Bulk Payload
    const payload: { id: string; order: number; columnId: string }[] = [];

    // Map new indices for the destination column
    destCol.cards.forEach((c: any, i: number) => {
      c.order = i;
      payload.push({ id: c.id, order: i, columnId: destCol.id });
    });

    // Map new indices for the source column (if the card moved to a new list)
    if (sourceColId !== destColId) {
      sourceCol.cards.forEach((c: any, i: number) => {
        c.order = i;
        payload.push({ id: c.id, order: i, columnId: sourceCol.id });
      });
    }

    set({ currentBoard: { ...currentBoard, columns } });

    // 4. Fire the Bulk Update
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

  initSocket: (boardId) => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('🔌 Web Client Connected to Socket');
    });

    newSocket.on(`board-updated-${boardId}`, () => {
      get().fetchBoardById(boardId);
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));