import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState<any[]>([]);
  const [newBoardName, setNewBoardName] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await apiClient.get('/boards');
      setBoards(response.data);
    } catch (error) {
      console.error("Failed to fetch boards", error);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      await apiClient.post('/boards', { name: newBoardName });
      setNewBoardName('');
      fetchBoards(); // Refresh the list
    } catch (error) {
      console.error("Failed to create board", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Your Workspace</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">{user?.email}</span>
            <button onClick={logout} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">
              Log Out
            </button>
          </div>
        </header>

        <form onSubmit={handleCreateBoard} className="mb-8 flex gap-4">
          <input
            type="text"
            placeholder="New Board Name..."
            className="flex-1 rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">
            Create Board
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {boards.map((board) => (
            <Link 
              key={board.id} 
              to={`/board/${board.id}`}
              className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-slate-700">{board.name}</h2>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}