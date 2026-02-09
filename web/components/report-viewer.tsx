import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReportViewer({ content }: { content: string }) {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert prose-table:text-sm prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-table:border prose-th:border prose-td:border">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
