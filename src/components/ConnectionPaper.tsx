import { useState } from 'react';
import { SPOTIFY_REDIRECT_URI } from '../spotify/config';

interface ConnectionPaperProps {
  isOwnClientId: boolean;
  onConnect: (clientId: string) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export function ConnectionPaper({ isOwnClientId, onConnect, onDisconnect, onClose }: ConnectionPaperProps) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="relative w-[26rem] max-w-full rounded-sm bg-[#f4ead9] p-6 shadow-2xl"
        style={{ transform: 'rotate(-0.6deg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#f4ead9] text-base leading-none text-[#2a2118] shadow"
        >
          &times;
        </button>

        <h2 className="mb-3 text-center text-lg font-bold uppercase tracking-[0.25em] text-[#2a2118]">
          Connection
        </h2>

        {isOwnClientId ? (
          <>
            <p className="mb-4 text-center text-xs leading-relaxed text-[#6b5d4f]">
              You're connected with your own Spotify app.
            </p>
            <button
              type="button"
              onClick={onDisconnect}
              className="mx-auto block text-[10px] font-semibold uppercase tracking-widest text-[#a8823f] underline underline-offset-2 hover:text-[#2a2118]"
            >
              Disconnect and use a different app
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs leading-relaxed text-[#6b5d4f]">
              Spotify caps a single shared app at 5 users. Connect your own free Spotify app
              instead — takes about 2 minutes, and you won't be waiting on anyone else's slot.
            </p>
            <ol className="mb-3 list-decimal space-y-1.5 pl-4 text-[11px] leading-snug text-[#4a3e30]">
              <li>
                Open the{' '}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Spotify Developer Dashboard
                </a>{' '}
                and create an app (any name/description).
              </li>
              <li>In its Settings, add this exact Redirect URI:</li>
            </ol>
            <code className="mb-3 block break-all rounded bg-black/5 px-2 py-1.5 text-[10px] text-[#2a2118]">
              {SPOTIFY_REDIRECT_URI}
            </code>
            <ol start={3} className="mb-3 list-decimal space-y-1.5 pl-4 text-[11px] leading-snug text-[#4a3e30]">
              <li>Copy its Client ID and paste it below.</li>
            </ol>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Client ID"
              className="mb-3 w-full rounded border border-black/20 bg-white/60 px-2 py-1.5 text-xs text-[#2a2118] outline-none focus:border-[#a8823f]"
            />
            <button
              type="button"
              onClick={() => value.trim() && onConnect(value.trim())}
              disabled={!value.trim()}
              className="w-full rounded-full bg-[#1ed760] px-4 py-2 text-xs font-semibold text-black shadow transition hover:brightness-110 disabled:cursor-default disabled:opacity-50"
            >
              Connect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
