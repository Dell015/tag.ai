'use client';

export interface CardBackProps {
  isWild?: boolean;
}

/**
 * Face-down card component with surface color, subtle geometric pattern,
 * and 20px corner radius. Wild variant uses a purple background and distinct pattern.
 */
export function CardBack({ isWild = false }: CardBackProps) {
  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-[20px] overflow-hidden shadow-xl ${
        isWild ? 'bg-purple-800' : 'bg-gray-800'
      }`}
    >
      {/* Subtle geometric pattern overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={isWild ? 'wild-pattern' : 'default-pattern'}
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            {isWild ? (
              <>
                <circle cx="20" cy="20" r="8" fill="currentColor" />
                <path
                  d="M0 0L40 40M40 0L0 40"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </>
            ) : (
              <>
                <rect
                  x="10"
                  y="10"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="20"
                  x2="40"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
                <line
                  x1="20"
                  y1="0"
                  x2="20"
                  y2="40"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </>
            )}
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${isWild ? 'wild-pattern' : 'default-pattern'})`}
          className={isWild ? 'text-purple-300' : 'text-gray-400'}
        />
      </svg>

      {/* Center logo/icon area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
            isWild
              ? 'border-purple-400/40 bg-purple-700/50'
              : 'border-gray-600/40 bg-gray-700/50'
          }`}
        >
          <span className="text-2xl" role="img" aria-label={isWild ? 'wild card' : 'card'}>
            {isWild ? '⚡' : '🃏'}
          </span>
        </div>
      </div>
    </div>
  );
}
