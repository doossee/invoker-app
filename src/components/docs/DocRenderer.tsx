import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sampleDocs } from '@/data/sample-docs';

interface Props {
  docPath: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function DocRenderer({ docPath }: Props) {
  const doc = sampleDocs.find((d) => d.path === docPath);

  if (!doc) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm">
        Document not found: {docPath}
      </div>
    );
  }

  const components: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : null;
      const codeString = String(children).replace(/\n$/, '');

      if (lang === 'ivk') {
        // IvkBlock will be added in Task 4; for now render a placeholder
        return (
          <div className="my-3 rounded-lg border border-border bg-surface p-4 text-xs font-mono text-text-dim">
            <span className="text-accent">[ivk]</span> {codeString}
          </div>
        );
      }

      if (lang || className) {
        return (
          <pre className="bg-surface rounded-lg border border-border p-4 overflow-x-auto my-3">
            <code className="text-sm font-mono text-text-primary block">
              {codeString}
            </code>
          </pre>
        );
      }

      return (
        <code
          className="bg-surface-2 px-1.5 py-0.5 rounded text-sm font-mono text-var-set"
          {...props}
        >
          {children}
        </code>
      );
    },
    h1({ children }) {
      const text = typeof children === 'string' ? children : String(children);
      return <h1 id={slugify(text)}>{children}</h1>;
    },
    h2({ children }) {
      const text = typeof children === 'string' ? children : String(children);
      return <h2 id={slugify(text)}>{children}</h2>;
    },
    h3({ children }) {
      const text = typeof children === 'string' ? children : String(children);
      return <h3 id={slugify(text)}>{children}</h3>;
    },
    table({ children }) {
      return <table>{children}</table>;
    },
    th({ children }) {
      return <th>{children}</th>;
    },
    td({ children }) {
      return <td>{children}</td>;
    },
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="h-full overflow-auto">
      <div className="invoker-prose max-w-3xl mx-auto px-6 py-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {doc.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
