import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Movie {
  id: string;
  title: string;
  year: string;
  genre: string[];
  rating: string;
  poster: string;
  description: string;
  language: string;
  director: string;
  cast: string[];
}

const MOVIE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      year: { type: Type.STRING },
      genre: { type: Type.ARRAY, items: { type: Type.STRING } },
      rating: { type: Type.STRING },
      poster: { type: Type.STRING, description: "A high quality placeholder image URL from Unsplash or similar related to the movie theme" },
      description: { type: Type.STRING },
      language: { type: Type.STRING },
      director: { type: Type.STRING },
      cast: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["id", "title", "year", "genre", "rating", "poster", "description"],
  },
};

export const movieService = {
  async getTrendingMovies(): Promise<Movie[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "List 10 trending and popular movies right now with details. Use Unsplash for poster URLs (e.g., https://images.unsplash.com/photo-...) that match the movie's vibe.",
      config: {
        responseMimeType: "application/json",
        responseSchema: MOVIE_SCHEMA,
      },
    });
    return JSON.parse(response.text);
  },

  async searchMovies(query: string): Promise<Movie[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for movies matching: "${query}". Provide 6-8 results. Use Unsplash for poster URLs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: MOVIE_SCHEMA,
      },
    });
    return JSON.parse(response.text);
  },

  async getRecommendations(movieTitle: string, genres: string[]): Promise<Movie[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 6 movies similar to "${movieTitle}" (Genres: ${genres.join(", ")}). Use Unsplash for poster URLs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: MOVIE_SCHEMA,
      },
    });
    return JSON.parse(response.text);
  },

  async getMovieById(id: string): Promise<Movie | null> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide detailed information for the movie with ID or title: "${id}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: (MOVIE_SCHEMA.items as any).properties,
          required: (MOVIE_SCHEMA.items as any).required,
        },
      },
    });
    return JSON.parse(response.text);
  }
};
