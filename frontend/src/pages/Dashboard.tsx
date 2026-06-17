import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState<any[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/boards');
      setBoards(response.data);
    } catch (error) {
      console.error("Failed to fetch boards", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      await apiClient.post('/boards', { name: newBoardName });
      setNewBoardName('');
      fetchBoards(); 
    } catch (error) {
      console.error("Failed to create board", error);
    }
  };

  const myBoards = boards.filter(board => board.user?.email === user?.email);
  const sharedBoards = boards.filter(board => board.user?.email !== user?.email);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans selection:bg-violet-200 dark:selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-100 relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Background Glows */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 dark:bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-200/40 dark:bg-violet-500/10 blur-[120px] pointer-events-none"></div>

      <div className="mx-auto max-w-5xl relative z-10">
        <header className="mb-14 flex items-center justify-between">
          
          {/* UPDATED: Stronger typography and personalized greeting */}
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase mb-1">
              Welcome back, {user?.email?.split('@')[0]}
            </span>
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent pb-1">
              Your Workspace
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white dark:border-zinc-800 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 pr-2">{user?.email}</span>
            </div>
            <button onClick={logout} className="rounded-full bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-300 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white hover:shadow-[0_8px_30px_rgb(79,70,229,0.12)]">
              Log Out
            </button>
          </div>
        </header>

        <form onSubmit={handleCreateBoard} className="mb-16 flex gap-4 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white dark:border-zinc-800">
          <input
            type="text"
            placeholder="What are you working on next?"
            className="flex-1 rounded-2xl bg-zinc-100/50 dark:bg-zinc-950/50 p-5 text-lg font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-500/50"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
          />
          <button type="submit" className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-10 py-5 font-bold text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] transition-all hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23),0_8px_15px_rgba(99,102,241,0.25)] active:translate-y-0">
            Create Board
          </button>
        </form>

        {isLoading ? (
          <div className="space-y-12">
            <div>
              <div className="h-8 w-40 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg animate-pulse mb-6"></div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-44 rounded-3xl bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            
            <section>
              <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                My Boards
              </h2>
              
              {myBoards.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {myBoards.map((board) => (
                    <Link 
                      key={board.id} 
                      to={`/board/${board.id}`}
                      className="group relative flex h-44 flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-7 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none ring-1 ring-zinc-200/50 dark:ring-zinc-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.15)] hover:ring-indigo-300 dark:hover:ring-indigo-500/50"
                    >
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 transition-transform duration-500 group-hover:scale-150"></div>
                      
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{board.name}</h3>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between mt-auto">
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[10px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">Owner</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 transition-all group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 py-16">
                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-full shadow-sm mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-bold text-lg">You haven't created any boards yet.</p>
                  <p className="text-zinc-400 dark:text-zinc-500 font-medium mt-1">Use the input above to get started.</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-xl">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                Shared with Me
              </h2>

              {sharedBoards.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {sharedBoards.map((board) => (
                    <Link 
                      key={board.id} 
                      to={`/board/${board.id}`}
                      className="group relative flex h-44 flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-7 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none ring-1 ring-zinc-200/50 dark:ring-zinc-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(139,92,246,0.15)] hover:ring-violet-300 dark:hover:ring-violet-500/50"
                    >
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 transition-transform duration-500 group-hover:scale-150"></div>
                      
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{board.name}</h3>
                        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Owned by <span className="font-bold text-zinc-800 dark:text-zinc-200">{board.user?.email.split('@')[0]}</span></p>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between mt-auto">
                        <span className="rounded-full bg-violet-50 dark:bg-violet-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase">Collaborator</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 transition-all group-hover:bg-violet-50 dark:group-hover:bg-violet-500/20 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 py-16">
                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-full shadow-sm mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold text-lg">No one has shared a board with you yet.</p>
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}