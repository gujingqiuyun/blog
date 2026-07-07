import { useState } from 'react';

const MARK_COLORS = ['#fef08a', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa', '#d1d5db'];

const tools = [
  { label: 'B', title: '加粗', prefix: '**', suffix: '**', sample: '加粗文字' },
  { label: 'I', title: '斜体', prefix: '*', suffix: '*', sample: '斜体文字' },
  { label: 'H', title: '标题', prefix: '\n## ', suffix: '', sample: '标题' },
  { label: '`', title: '行内代码', prefix: '`', suffix: '`', sample: '代码' },
  { label: '```', title: '代码块', prefix: '\n```\n', suffix: '\n```\n', sample: '语言\n代码\n' },
  { label: '"', title: '引用', prefix: '\n> ', suffix: '', sample: '引用文字' },
  { label: '🔗', title: '链接', prefix: '[', suffix: '](url)', sample: '链接文字' },
  { label: '📷', title: '图片', prefix: '![', suffix: '](url)', sample: '图片描述' },
  { label: '•', title: '无序列表', prefix: '\n- ', suffix: '', sample: '列表项' },
  { label: '1.', title: '有序列表', prefix: '\n1. ', suffix: '', sample: '列表项' },
];

export default function MarkdownToolbar({ textareaRef, content, setContent }) {
  const [markColor, setMarkColor] = useState('#fef08a');
  const [showColors, setShowColors] = useState(false);

  const insert = (prefix, suffix, sample) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const text = selected || sample;
    const newContent = content.slice(0, start) + prefix + text + suffix + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      const cursor = start + prefix.length + text.length + suffix.length;
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const insertMark = () => {
    insert(`<mark style="background:${markColor}">`, '</mark>', '高亮文字');
  };

  return (
    <div className="flex flex-wrap gap-0.5 items-center">
      {tools.map(t => (
        <button key={t.label} type="button" title={t.title}
          onClick={() => insert(t.prefix, t.suffix, t.sample)}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors font-mono">
          {t.label}
        </button>
      ))}
      {/* M button with current color + picker */}
      <span className="relative flex items-center gap-0">
        <button type="button" title="高亮" onClick={insertMark}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 rounded-l transition-colors font-mono"
          style={{ backgroundColor: markColor + '40' }}>
          M
        </button>
        <button type="button" onClick={() => setShowColors(!showColors)}
          className="px-0.5 py-1 text-xs text-gray-300 hover:text-gray-500 rounded-r transition-colors">
          ▼
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex gap-1 z-20"
            onMouseLeave={() => setShowColors(false)}>
            {MARK_COLORS.map(c => (
              <button key={c} onClick={() => { setMarkColor(c); setShowColors(false); }}
                className={`w-4 h-4 rounded-full border hover:scale-110 transition-transform ${c === markColor ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
      </span>
    </div>
  );
}
