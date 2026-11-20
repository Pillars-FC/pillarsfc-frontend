import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function omitMarkdownNode<T extends { node?: unknown }>(
  props: T,
): Omit<T, "node"> {
  const { node, ...elementProps } = props;
  void node;
  return elementProps;
}

const markdownComponents: Components = {
  h1: (props) => (
    <h1
      {...omitMarkdownNode(props)}
      className="font-condensed text-4xl font-black uppercase text-[#071b33]"
    />
  ),
  h2: (props) => (
    <h2
      {...omitMarkdownNode(props)}
      className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]"
    />
  ),
  h3: (props) => (
    <h3
      {...omitMarkdownNode(props)}
      className="font-condensed text-2xl font-extrabold uppercase text-[#071b33]"
    />
  ),
  p: (props) => (
    <p {...omitMarkdownNode(props)} className="my-4 leading-8" />
  ),
  ul: (props) => (
    <ul {...omitMarkdownNode(props)} className="my-4 list-disc space-y-2 pl-6" />
  ),
  ol: (props) => (
    <ol
      {...omitMarkdownNode(props)}
      className="my-4 list-decimal space-y-2 pl-6"
    />
  ),
  blockquote: (props) => (
    <blockquote
      {...omitMarkdownNode(props)}
      className="my-5 border-l-4 border-[#f6b71d] pl-4 italic text-slate-500"
    />
  ),
  a: (props) => (
    <a
      {...omitMarkdownNode(props)}
      className="font-semibold text-[#075aa6] underline underline-offset-2"
    />
  ),
  code: (props) => {
    const { className, ...elementProps } = omitMarkdownNode(props);
    return (
    <code
        {...elementProps}
        className={`rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[.9em] text-[#071b33] ${className ?? ""}`}
    />
    );
  },
  pre: (props) => (
    <pre
      {...omitMarkdownNode(props)}
      className="my-5 overflow-x-auto rounded bg-[#071b33] p-4 text-sm leading-6 text-slate-100"
    />
  ),
  hr: (props) => (
    <hr {...omitMarkdownNode(props)} className="my-6 border-slate-200" />
  ),
  table: (props) => (
    <div className="my-5 overflow-x-auto">
      <table
        {...omitMarkdownNode(props)}
        className="w-full border-collapse text-left"
      />
    </div>
  ),
  th: (props) => (
    <th
      {...omitMarkdownNode(props)}
      className="border border-slate-200 bg-slate-50 px-3 py-2 font-bold"
    />
  ),
  td: (props) => (
    <td {...omitMarkdownNode(props)} className="border border-slate-200 px-3 py-2" />
  ),
  img: ({ alt }) => (
    <span className="italic text-slate-500">
      {alt ? `[Image omitted: ${alt}]` : "[Inline images are not displayed]"}
    </span>
  ),
};

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
