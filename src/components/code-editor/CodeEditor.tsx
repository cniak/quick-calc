import { useRef, useEffect, useState } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({ value, onChange, placeholder, className = '' }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Listen for open-function-set event to focus the editor
  useEffect(() => {
    const handleOpenFunctionSet = () => {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    };
    
    window.addEventListener('open-function-set', handleOpenFunctionSet);
    return () => window.removeEventListener('open-function-set', handleOpenFunctionSet);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = value.substring(0, start);
      const textAfter = value.substring(end);
      
      if (e.shiftKey) {
        // Shift+Tab: Dedent
        const currentLineStart = textBefore.lastIndexOf('\n') + 1;
        const currentLine = value.substring(currentLineStart, end);
        
        if (currentLine.startsWith('  ')) {
          // Remove 2 spaces
          const newValue = value.substring(0, currentLineStart) + currentLine.substring(2) + value.substring(end);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        // Tab: Indent with 2 spaces
        const newValue = textBefore + '  ' + textAfter;
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
      return;
    }

    // Handle Enter key with auto-indent
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const start = textarea.selectionStart;
      const textBefore = value.substring(0, start);
      const textAfter = value.substring(start);
      
      // Find current line indentation
      const currentLineStart = textBefore.lastIndexOf('\n') + 1;
      const currentLine = textBefore.substring(currentLineStart);
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      // Check if current line ends with { to add extra indent
      const trimmedLine = currentLine.trim();
      const extraIndent = trimmedLine.endsWith('{') ? '  ' : '';
      
      const newValue = textBefore + '\n' + indent + extraIndent + textAfter;
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;
      }, 0);
      return;
    }

    // Handle closing brace auto-dedent
    if (e.key === '}') {
      const start = textarea.selectionStart;
      const textBefore = value.substring(0, start);
      const currentLineStart = textBefore.lastIndexOf('\n') + 1;
      const currentLine = textBefore.substring(currentLineStart);
      
      // If current line is only whitespace, dedent before adding }
      if (currentLine.trim() === '' && currentLine.length >= 2) {
        e.preventDefault();
        const newValue = value.substring(0, currentLineStart) + currentLine.substring(2) + '}' + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }
  };

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft]);

  const highlightedCode = highlightJavaScript(value || placeholder || '');

  return (
    <div className={`relative ${className}`}>
      {/* Syntax highlighted background */}
      <div
        ref={highlightRef}
        className="absolute inset-0 px-3 py-2 pb-24 font-mono text-sm overflow-hidden pointer-events-none whitespace-pre-wrap break-words"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        aria-hidden="true"
      >
        <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </div>

      {/* Transparent textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="relative w-full h-full px-3 py-2 pb-24 font-mono text-sm border border-input rounded bg-transparent resize-none outline-none focus:ring-2 focus:ring-ring text-transparent selection:bg-blue-500/30"
        style={{
          caretColor: '#fff',
        }}
        spellCheck={false}
        placeholder={placeholder}
      />
    </div>
  );
}

function highlightJavaScript(code: string): string {
  if (!code) return '';

  const tokens: Array<{ type: string; value: string }> = [];
  let i = 0;

  const keywords = new Set([
    'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'break', 'continue', 'const', 'let', 'var', 'new', 'this', 'typeof',
    'instanceof', 'delete', 'in', 'of', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'class', 'extends', 'super', 'static', 'get', 'set',
    'import', 'export', 'default', 'from', 'as'
  ]);

  while (i < code.length) {
    // Block comments
    if (code[i] === '/' && code[i + 1] === '*') {
      let comment = '/*';
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        comment += code[i++];
      }
      if (i < code.length) {
        comment += '*/';
        i += 2;
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    // Line comments
    if (code[i] === '/' && code[i + 1] === '/') {
      let comment = '';
      while (i < code.length && code[i] !== '\n') {
        comment += code[i++];
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i++];
        }
        str += code[i++];
      }
      if (i < code.length) {
        str += code[i++];
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Numbers
    if (/\d/.test(code[i])) {
      let num = '';
      while (i < code.length && /[\d.]/.test(code[i])) {
        num += code[i++];
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let id = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        id += code[i++];
      }
      
      // Skip whitespace to check for parenthesis
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      
      const type = keywords.has(id) ? 'keyword' : (code[j] === '(' ? 'function' : 'identifier');
      tokens.push({ type, value: id });
      continue;
    }

    // Operators and punctuation
    if (/[+\-*/%=<>!&|^~?:(){}\[\];,.]/.test(code[i])) {
      tokens.push({ type: 'operator', value: code[i++] });
      continue;
    }

    // Whitespace and everything else
    tokens.push({ type: 'text', value: code[i++] });
  }

  // Render tokens
  return tokens
    .map((token) => {
      const escaped = token.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      switch (token.type) {
        case 'keyword':
          return `<span class="text-purple-400">${escaped}</span>`;
        case 'function':
          return `<span class="text-yellow-300">${escaped}</span>`;
        case 'string':
          return `<span class="text-green-400">${escaped}</span>`;
        case 'number':
          return `<span class="text-blue-400">${escaped}</span>`;
        case 'comment':
          return `<span class="text-gray-500">${escaped}</span>`;
        case 'operator':
          return `<span class="text-pink-400">${escaped}</span>`;
        default:
          return escaped;
      }
    })
    .join('');
}
