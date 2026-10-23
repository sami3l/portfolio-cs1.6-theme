import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { sfx } from '../audio/sfx';
import { Button } from '../components/vgui/Button';
import { Window } from '../components/vgui/Window';
import { complete, runCommand, type Line } from '../console/commands';
import { useStore } from '../state/context';

const WELCOME: Line[] = [
  { text: 'Portfolio console, protocol 48', kind: 'accent' },
  { text: "Type 'help' for commands. Try 'connect gitops' or 'cv en'.", kind: 'dim' },
];

// Kept outside the component so output and history survive closing and reopening the console.
let savedLines: Line[] = WELCOME;
let savedHistory: string[] = [];

const toLine = (l: string | Line): Line => (typeof l === 'string' ? { text: l } : l);

export function Console() {
  const store = useStore();
  const [lines, setLines] = useState<Line[]>(savedLines);
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    savedLines = lines;
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  const append = (more: Line[], replace = false) => setLines((prev) => (replace ? more : [...prev, ...more]).slice(-300));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    setInput('');
    setHistoryIdx(null);
    if (!text) return;
    savedHistory = [...savedHistory.filter((h) => h !== text), text].slice(-50);

    const out: Line[] = [{ text: `] ${text}`, kind: 'echo' }];
    let cleared = false;
    const ok = runCommand(text, {
      print: (...ls) => out.push(...ls.map(toLine)),
      clear: () => {
        cleared = true;
        out.length = 0;
      },
      actions: store.actions,
      state: store.state,
    });
    if (!ok) sfx.error();
    append(out, cleared);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!savedHistory.length) return;
      e.preventDefault();
      const last = savedHistory.length - 1;
      const next =
        e.key === 'ArrowUp'
          ? Math.max(0, (historyIdx ?? savedHistory.length) - 1)
          : historyIdx === null || historyIdx >= last
            ? null
            : historyIdx + 1;
      setHistoryIdx(next);
      setInput(next === null ? '' : savedHistory[next]);
    }
    // Tab completes only while something is typed, so an empty field still lets Tab move focus.
    if (e.key === 'Tab' && input.trim()) {
      e.preventDefault();
      const matches = complete(input);
      if (matches.length === 1) setInput(`${matches[0]} `);
      else if (matches.length > 1) append([{ text: matches.join('  '), kind: 'dim' }]);
    }
  };

  return (
    <Window
      id="console"
      title="Console"
      width={680}
      height={420}
      className="window--console"
      initialFocus={inputRef}
      footer={
        <form className="console__form" onSubmit={submit}>
          <label htmlFor="console-input" className="sr-only">
            Console command
          </label>
          <input
            id="console-input"
            ref={inputRef}
            className="vgui-input console__input"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button type="submit">Submit</Button>
        </form>
      }
    >
      <div ref={outputRef} className="console__output vgui-inset" role="log" aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={l.kind ? `console__line--${l.kind}` : undefined}>
            {l.text}
          </div>
        ))}
      </div>
    </Window>
  );
}
