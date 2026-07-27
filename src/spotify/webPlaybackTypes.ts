export interface WebPlaybackTrack {
  id: string;
  uri: string;
  name: string;
  album: { name: string; images: { url: string }[] };
  artists: { name: string }[];
}

export interface WebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: WebPlaybackTrack;
  };
}

export interface SpotifyPlayerInstance {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (data: unknown) => void): void;
  removeListener(event: string): void;
  getCurrentState(): Promise<WebPlaybackState | null>;
  togglePlay(): Promise<void>;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
  }
}
