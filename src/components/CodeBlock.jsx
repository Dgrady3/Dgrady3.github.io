import { Highlight } from 'prism-react-renderer'
import '../lib/prism-ruby'

const customTheme = {
  plain: {
    color: '#e2e8f0',
    backgroundColor: '#0d0d1a',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#636e7b', fontStyle: 'italic' },
    },
    {
      types: ['punctuation'],
      style: { color: '#7c8da4' },
    },
    {
      types: ['symbol'],
      style: { color: '#c084fc' },
    },
    {
      types: ['boolean', 'number'],
      style: { color: '#c084fc' },
    },
    {
      types: ['string', 'char', 'attr-value', 'inserted'],
      style: { color: '#34d399' },
    },
    {
      types: ['operator'],
      style: { color: '#67e8f9' },
    },
    {
      types: ['keyword'],
      style: { color: '#f472b6' },
    },
    {
      types: ['builtin'],
      style: { color: '#60a5fa' },
    },
    {
      types: ['function', 'method'],
      style: { color: '#60a5fa' },
    },
    {
      types: ['class-name', 'maybe-class-name'],
      style: { color: '#fbbf24' },
    },
    {
      types: ['attr-name'],
      style: { color: '#67e8f9' },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: { color: '#fb923c' },
    },
    {
      types: ['property', 'tag', 'constant', 'deleted'],
      style: { color: '#f472b6' },
    },
  ],
}

export default function CodeBlock({ title, language = 'ruby', children }) {
  const code = typeof children === 'string' ? children.trim() : String(children).trim()

  return (
    <div className="rounded-lg overflow-hidden border border-white/5 my-6">
      {/* Terminal title bar */}
      <div className="bg-[#1a1a2e] px-4 py-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        {title && (
          <span className="ml-2 font-mono text-xs text-gray-500">{title}</span>
        )}
      </div>
      {/* Syntax-highlighted code */}
      <Highlight theme={customTheme} code={code} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="p-4 overflow-x-auto text-sm leading-relaxed"
            style={{ ...style, margin: 0 }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
