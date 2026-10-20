import React, { useRef, useId } from 'react';
import { DSLError } from '../dsl/types';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors: DSLError[];
  disabled?: boolean;
}

/**
 * Editor de Código DSL com numeração de linhas sincronizada com a rolagem
 * e destaque visual de erros por linha.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  errors,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  // Conjunto com os números das linhas com erro para busca O(1)
  const errorLines = new Set(errors.map((e) => e.line));

  // Número total de linhas (garante no mínimo 7 linhas visíveis para estética)
  const lines = value.split('\n');
  const lineCount = Math.max(7, lines.length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sincroniza a rolagem vertical do painel de linhas com o textarea
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Suporte a indentação com a tecla Tab (2 espaços)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Reposiciona o cursor após os dois espaços inseridos
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="editor-card">
      <div className="editor-header">
        <div className="editor-header-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <label htmlFor={textareaId} className="editor-label">Código DSL</label>
        </div>
        <span className="editor-stats">
          {lines.length} {lines.length === 1 ? 'linha' : 'linhas'}
        </span>
      </div>

      <div className="editor-workspace">
        {/* Coluna com numeração de linhas sincronizada */}
        <div
          ref={lineNumbersRef}
          className="editor-line-numbers"
          aria-hidden="true"
        >
          {lineNumbers.map((lineNum) => {
            const hasError = errorLines.has(lineNum);
            return (
              <div
                key={lineNum}
                className={`editor-line-number ${hasError ? 'has-error' : ''}`}
                title={hasError ? `Erro na linha ${lineNum}` : undefined}
              >
                {hasError && <span className="error-dot" />}
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea de edição monoespaçada */}
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Exemplo:&#10;INSTRUMENT kick&#10;PLAY&#10;WAIT&#10;PLAY"
          className="editor-textarea"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
    </div>
  );
};
