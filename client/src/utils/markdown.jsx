import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

function headingId(children) {
  return String(children)
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w一-鿿\-]/g, '')
    .replace(/-+$/g, '');
}

export const mdComponents = {
  h1: ({ children, ...props }) => <h1 id={headingId(children)} {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 id={headingId(children)} {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 id={headingId(children)} {...props}>{children}</h3>,
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeStr = String(children).replace(/\n$/, '');
    if (!inline && match) {
      return (
        <SyntaxHighlighter style={oneLight} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem' }} {...props}>
          {codeStr}
        </SyntaxHighlighter>
      );
    }
    // Inline code: allow HTML like <span style="..."> to render inside
    const codeStrInline = String(children);
    if (inline && /<\w+\b[^>]*style=/.test(codeStrInline)) {
      return <code className={className} dangerouslySetInnerHTML={{ __html: codeStrInline }} {...props} />;
    }
    return <code className={className} {...props}>{children}</code>;
  },
};
