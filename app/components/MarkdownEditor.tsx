"use client";

import { useRef } from "react";
import MarkdownContent from "./MarkdownContent";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}

function FormatButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#071b33] hover:border-[#075aa6] hover:text-[#075aa6]"
    >
      {label}
    </button>
  );
}

export default function MarkdownEditor({
  value,
  onChange,
  maxLength,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (
    before: string,
    after: string,
    placeholder: string,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const text = selected || placeholder;
    const updated =
      value.slice(0, start) + before + text + after + value.slice(end);
    onChange(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      textarea.setSelectionRange(selectionStart, selectionStart + text.length);
    });
  };

  const prefixLines = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextLineBreak = value.indexOf("\n", end);
    const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
    const selectedLines = value.slice(lineStart, lineEnd);
    const formattedLines = selectedLines
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const updated =
      value.slice(0, lineStart) + formattedLines + value.slice(lineEnd);
    onChange(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + formattedLines.length);
    });
  };

  const handleBold = () => wrapSelection("**", "**", "bold text");
  const handleItalic = () => wrapSelection("*", "*", "italic text");
  const handleHeading = () => prefixLines("## ");
  const handleBulletedList = () => prefixLines("- ");
  const handleNumberedList = () => prefixLines("1. ");
  const handleQuote = () => prefixLines("> ");
  const handleLink = () => wrapSelection("[", "](https://)", "link text");
  const handleInlineCode = () => wrapSelection("`", "`", "code");
  const handleCodeBlock = () =>
    wrapSelection("```\n", "\n```", "code");

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Story formatting"
        className="flex flex-wrap gap-2 border border-b-0 border-slate-200 bg-slate-50 p-3"
      >
        <FormatButton label="B" title="Bold" onClick={handleBold} />
        <FormatButton label="I" title="Italic" onClick={handleItalic} />
        <FormatButton label="H2" title="Heading" onClick={handleHeading} />
        <FormatButton
          label="• List"
          title="Bulleted list"
          onClick={handleBulletedList}
        />
        <FormatButton
          label="1. List"
          title="Numbered list"
          onClick={handleNumberedList}
        />
        <FormatButton label="Quote" title="Block quote" onClick={handleQuote} />
        <FormatButton label="Link" title="Insert link" onClick={handleLink} />
        <FormatButton
          label="`Code`"
          title="Inline code"
          onClick={handleInlineCode}
        />
        <FormatButton
          label="Code block"
          title="Code block"
          onClick={handleCodeBlock}
        />
      </div>
      <div className="grid lg:grid-cols-2">
        <div>
          <label htmlFor="news-story-content" className="sr-only">
            Full story in Markdown
          </label>
          <textarea
            ref={textareaRef}
            id="news-story-content"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required
            minLength={20}
            maxLength={maxLength}
            rows={16}
            placeholder="Write the full story. Leave a blank line between paragraphs."
            className="min-h-96 w-full resize-y border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-[#075aa6]"
          />
        </div>
        <section
          aria-label="Story preview"
          className="min-h-96 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 lg:border-l-0"
        >
          <p className="mb-3 text-[10px] font-extrabold tracking-wider text-slate-500">
            LIVE PREVIEW
          </p>
          {value.trim() ? (
            <div className="wrap-break-word">
              <MarkdownContent content={value} />
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Formatted story preview appears here as you write.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
