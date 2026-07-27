export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  product: 'premium' | 'free' | 'open' | string;
}

export interface StoredToken {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}
