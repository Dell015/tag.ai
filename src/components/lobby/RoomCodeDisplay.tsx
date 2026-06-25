'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface RoomCodeDisplayProps {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/game/${roomCode}/join`
      : `/game/${roomCode}/join`;

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = joinUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [joinUrl]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Room Code */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Room Code
        </span>
        <span className="font-mono text-4xl font-bold tracking-widest text-white">
          {roomCode}
        </span>
      </div>

      {/* QR Code */}
      <div className="rounded-2xl bg-white p-4">
        <QRCodeSVG
          value={joinUrl}
          size={180}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Share Link Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-500 transition-colors active:scale-95"
      >
        {copied ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
            </svg>
            <span>Share link</span>
          </>
        ) }
      </button>

      {/* Copied toast */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
            ✓ Link copied to clipboard
          </div>
        </div>
      )}
    </div>
  );
}
