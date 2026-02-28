export interface Movie {
  id: string;
  title: string;
  year: string;
  genre: string[];
  rating: string;
  poster: string;
  description: string;
  language?: string;
  director?: string;
  cast?: string[];
}

export interface WatchlistItem extends Movie {}

export interface UserRating {
  movie_id: string;
  rating: number;
}
