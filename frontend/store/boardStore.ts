import { create } from 'zustand';
import apiClient from '../api/client';

interface Board {
  id: string;
  name: string;
}

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  fetchBoards: () => Promise<void>;
  createBoard: (name: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  isLoading: false,
  
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
      // Instantly update the UI by adding the new board to the existing array
      set((state) => ({ boards: [...state.boards, response.data] }));
    } catch (error) {
      console.error('Failed to create board', error);
    }
  }
}));