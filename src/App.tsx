import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  Bookmark, 
  BookmarkCheck, 
  TrendingUp, 
  Filter, 
  ChevronRight, 
  X, 
  Loader2,
  ArrowLeft,
  Info,
  Play
} from 'lucide-react';
import { movieService, Movie } from './services/movieService';
import { WatchlistItem, UserRating } from './types';

export default function App() {
  const [view, setView] = useState<'home' | 'search' | 'details' | 'watchlist'>('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ genre: '', year: '', language: '' });
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      try {
        const [trending, wl, ratings] = await Promise.all([
          movieService.getTrendingMovies(),
          fetch('/api/watchlist').then(res => res.json()),
          fetch('/api/ratings').then(res => res.json())
        ]);
        setMovies(trending);
        setWatchlist(wl);
        const ratingsMap = (ratings as UserRating[]).reduce((acc, curr) => {
          acc[curr.movie_id] = curr.rating;
          return acc;
        }, {} as Record<string, number>);
        setUserRatings(ratingsMap);
      } catch (error) {
        console.error("Failed to initialize:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setView('search');
    try {
      const results = await movieService.searchMovies(searchQuery);
      setMovies(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieSelect = async (movie: Movie) => {
    setSelectedMovie(movie);
    setView('details');
    setLoading(true);
    try {
      const recs = await movieService.getRecommendations(movie.title, movie.genre);
      setRecommendations(recs);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async (movie: Movie) => {
    const isInWatchlist = watchlist.some(item => item.id === movie.id);
    if (isInWatchlist) {
      await fetch(`/api/watchlist/${movie.id}`, { method: 'DELETE' });
      setWatchlist(prev => prev.filter(item => item.id !== movie.id));
    } else {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie)
      });
      setWatchlist(prev => [...prev, movie]);
    }
  };

  const handleRate = async (movieId: string, rating: number) => {
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_id: movieId, rating })
    });
    setUserRatings(prev => ({ ...prev, [movieId]: rating }));
  };

  const filteredMovies = movies.filter(m => {
    if (filters.genre && !m.genre.includes(filters.genre)) return false;
    if (filters.year && m.year !== filters.year) return false;
    if (filters.language && m.language !== filters.language) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setView('home')}
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Play className="text-black fill-current w-5 h-5" />
          </div>
          <span className="font-serif text-2xl tracking-tight">CineMatch</span>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search movies, actors, directors..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('watchlist')}
            className={`flex items-center gap-2 hover:text-emerald-400 transition-colors ${view === 'watchlist' ? 'text-emerald-400' : ''}`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="hidden md:inline">Watchlist</span>
            {watchlist.length > 0 && (
              <span className="bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {watchlist.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {loading && view !== 'details' ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-white/40 font-medium">Curating your cinematic experience...</p>
            </motion.div>
          ) : view === 'home' || view === 'search' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-serif mb-2">
                    {view === 'home' ? 'Trending Now' : `Results for "${searchQuery}"`}
                  </h2>
                  <p className="text-white/40">Handpicked recommendations just for you</p>
                </div>
                
                <div className="flex gap-4">
                  <select 
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none"
                    onChange={(e) => setFilters(f => ({ ...f, genre: e.target.value }))}
                  >
                    <option value="">All Genres</option>
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Thriller">Thriller</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMovies.map((movie) => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie} 
                    onClick={() => { handleMovieSelect(movie); }}
                    onWatchlistToggle={() => { toggleWatchlist(movie); }}
                    isInWatchlist={watchlist.some(item => item.id === movie.id)}
                  />
                ))}
              </div>
            </motion.div>
          ) : view === 'watchlist' ? (
            <motion.div
              key="watchlist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-serif mb-2">My Watchlist</h2>
                <p className="text-white/40">Movies you've saved for later</p>
              </div>

              {watchlist.length === 0 ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-white/20">
                  <Bookmark className="w-16 h-16 mb-4" />
                  <p>Your watchlist is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {watchlist.map((movie) => (
                    <MovieCard 
                      key={movie.id} 
                      movie={movie} 
                      onClick={() => { handleMovieSelect(movie); }}
                      onWatchlistToggle={() => { toggleWatchlist(movie); }}
                      isInWatchlist={true}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === 'details' && selectedMovie && (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to browsing
              </button>

              <div className="grid md:grid-cols-[400px_1fr] gap-12 mb-16">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="relative group"
                >
                  <img 
                    src={selectedMovie.poster} 
                    alt={selectedMovie.title}
                    className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => toggleWatchlist(selectedMovie)}
                    className="absolute top-4 right-4 w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    {watchlist.some(item => item.id === selectedMovie.id) ? (
                      <BookmarkCheck className="w-6 h-6" />
                    ) : (
                      <Bookmark className="w-6 h-6" />
                    )}
                  </button>
                </motion.div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                      {selectedMovie.year}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-bold">{selectedMovie.rating}</span>
                    </div>
                  </div>

                  <h1 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">
                    {selectedMovie.title}
                  </h1>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedMovie.genre.map(g => (
                      <span key={g} className="px-4 py-1.5 glass rounded-full text-sm">
                        {g}
                      </span>
                    ))}
                  </div>

                  <p className="text-xl text-white/70 leading-relaxed mb-12">
                    {selectedMovie.description}
                  </p>

                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                      <h4 className="text-white/40 uppercase text-xs font-bold tracking-widest mb-2">Director</h4>
                      <p className="text-lg">{selectedMovie.director || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-white/40 uppercase text-xs font-bold tracking-widest mb-2">Language</h4>
                      <p className="text-lg">{selectedMovie.language || 'English'}</p>
                    </div>
                  </div>

                  <div className="p-6 glass rounded-2xl">
                    <h4 className="text-white/40 uppercase text-xs font-bold tracking-widest mb-4">Your Rating</h4>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(selectedMovie.id, star)}
                          className="group"
                        >
                          <Star 
                            className={`w-8 h-8 transition-all ${
                              (userRatings[selectedMovie.id] || 0) >= star 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-white/10 hover:text-yellow-500/50'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-24">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-serif">Similar Movies</h3>
                  <div className="h-px flex-1 mx-8 bg-white/10" />
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {recommendations.map((movie) => (
                      <MovieCard 
                        key={movie.id} 
                        movie={movie} 
                        onClick={() => { handleMovieSelect(movie); }}
                        onWatchlistToggle={() => { toggleWatchlist(movie); }}
                        isInWatchlist={watchlist.some(item => item.id === movie.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Play className="text-emerald-500 fill-current w-5 h-5" />
            <span className="font-serif text-xl">CineMatch</span>
          </div>
          <p className="text-white/20 text-sm">© 2026 CineMatch. Powered by Gemini AI.</p>
          <div className="flex gap-8 text-white/40 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface MovieCardProps {
  key?: React.Key;
  movie: Movie;
  onClick: () => void;
  onWatchlistToggle: () => void;
  isInWatchlist: boolean;
}

function MovieCard({ 
  movie, 
  onClick, 
  onWatchlistToggle, 
  isInWatchlist 
}: MovieCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl mb-4">
        <img 
          src={movie.poster} 
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onWatchlistToggle();
            }}
            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              isInWatchlist ? 'bg-emerald-500 text-black' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
            }`}
          >
            {isInWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isInWatchlist ? 'Saved' : 'Watchlist'}
            </span>
          </button>
        </div>
        <div className="absolute top-3 left-3 px-2 py-1 glass rounded-lg flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-[10px] font-bold">{movie.rating}</span>
        </div>
      </div>
      
      <h3 className="font-medium text-lg leading-tight mb-1 group-hover:text-emerald-400 transition-colors line-clamp-1">
        {movie.title}
      </h3>
      <div className="flex items-center gap-2 text-white/40 text-xs">
        <span>{movie.year}</span>
        <span>•</span>
        <span className="line-clamp-1">{movie.genre.slice(0, 2).join(', ')}</span>
      </div>
    </motion.div>
  );
}
