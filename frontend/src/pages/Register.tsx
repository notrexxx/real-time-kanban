import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register } = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password);
      navigate('/'); // Send to dashboard on success
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100 relative overflow-hidden transition-colors duration-300 p-6">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/50 dark:bg-indigo-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/50 dark:bg-violet-500/15 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* The Glassmorphic Card */}
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-10 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-white dark:border-zinc-800/80 transition-all">
          
          <div className="mb-10 text-center">
            {/* App Logo/Icon Placeholder */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Create an account</h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Join your team's workspace today.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-base font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-base font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 p-4 border border-rose-100 dark:border-rose-500/20">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 text-center">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 py-4 text-base font-extrabold text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] transition-all hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23),0_8px_15px_rgba(99,102,241,0.25)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

        </div>

        <p className="mt-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}