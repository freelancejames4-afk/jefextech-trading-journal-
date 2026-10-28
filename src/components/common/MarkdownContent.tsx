import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Parses inline elements: **bold**, *italic*, `code`, and plain text.
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex matches **bold**, *italic*, and `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-zinc-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-zinc-700 dark:text-zinc-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 1 (# ...)
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white pt-2 pb-1 border-b border-zinc-200 dark:border-zinc-800/80 font-sans tracking-tight"
            >
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }

        // Heading 2 (## ...)
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white pt-2 pb-0.5 tracking-tight flex items-center gap-2"
            >
              <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block shrink-0" />
              <span>{renderInline(trimmed.slice(3))}</span>
            </h2>
          );
        }

        // Heading 3 (### ...)
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 pt-1.5 uppercase font-mono tracking-wider"
            >
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }

        // Bullet list item (- ... or * ...)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-zinc-800 dark:text-zinc-200">
              <span className="text-emerald-500 font-bold shrink-0 mt-0.5 select-none">•</span>
              <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list item (e.g. "1. ", "2. ")
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          const [, num, itemText] = numberedMatch;
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-zinc-800 dark:text-zinc-200">
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/60 shrink-0 select-none">
                {num}
              </span>
              <span className="flex-1">{renderInline(itemText)}</span>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={idx} className="text-zinc-800 dark:text-zinc-200">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};
