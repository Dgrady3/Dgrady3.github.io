import { Prism } from 'prism-react-renderer'

Prism.languages.ruby = Prism.languages.extend('clike', {
  comment: {
    pattern: /#.*/,
    greedy: true,
  },
  'class-name': {
    pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+/i,
    lookbehind: true,
    inside: {
      punctuation: /[.\\]/,
    },
  },
  keyword:
    /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|require_relative|rescue|retry|return|self|send|super|then|throw|undef|unless|until|when|while|yield)\b/,
  builtin:
    /\b(?:Array|Float|Integer|String|__callee__|__dir__|__method__|attr_accessor|attr_reader|attr_writer|block_given\?|catch|chomp|chop|eval|exec|exit|fork|format|gets|global_variables|gsub|lambda|load|loop|open|p|print|printf|proc|putc|puts|rand|readline|readlines|sleep|spawn|sprintf|srand|sub|syscall|system|test|trap)\b/,
  boolean: /\b(?:false|true)\b/,
  number:
    /\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:e[+-]?\d+(?:_\d+)*)?\b/i,
  operator: /\.{2,3}|&\.|===|<?=>|[!=]~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>&|^!=])=?|[?:]/,
  punctuation: /[(){}[\];.,]/,
  string: [
    {
      pattern: /%[qQiIwWx]?([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
      greedy: true,
    },
    {
      pattern: /%[qQiIwWx]?\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/,
      greedy: true,
    },
    {
      pattern: /%[qQiIwWx]?\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/,
      greedy: true,
    },
    {
      pattern: /%[qQiIwWx]?\[(?:[^[\]\\]|\\[\s\S]|\[(?:[^[\]\\]|\\[\s\S])*\])*\]/,
      greedy: true,
    },
    {
      pattern: /%[qQiIwWx]?<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/,
      greedy: true,
    },
    {
      pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
      greedy: true,
    },
  ],
  symbol: {
    pattern: /(^|[^:]):[a-zA-Z_]\w*(?:[?!]|\b)/,
    lookbehind: true,
  },
})

export { Prism }
