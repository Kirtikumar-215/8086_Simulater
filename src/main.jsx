import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { EXAMPLES, parse, createMachine, step } from './emulator';
import { encode } from './encoder';
import './style.css';
const asm = StreamLanguage.define({
  token(stream) {
    if (stream.sol() && stream.match(/^\s*[A-Za-z_.$?][\w.$?]*:/)) return 'label';
    if (stream.match(/^\s*;.*/)) return 'comment';
    if (stream.match(/^(MOV|ADD|SUB|ADC|SBB|XCHG|PUSH|POP|MUL|INT|HLT|DB|DW|EQU|ORG|END)\b/i)) return 'keyword';
    if (stream.match(/^(AX|BX|CX|DX|SP|BP|SI|DI|AL|AH|BL|BH|CL|CH|DL|DH|CS|DS|SS|ES)\b/i)) return 'variableName';
    if (stream.match(/^[0-9A-F]+H\b|^0x[0-9A-F]+\b|\b\d+\b/i)) return 'number';
    stream.next(); return null;
  }
});

function Editor({ value, onChange }) {
  const ref = React.useRef(null);
  const viewRef = React.useRef(null);
  useEffect(() => { const view = new EditorView({ state: EditorState.create({ doc: value, extensions: [basicSetup, asm, EditorView.contentAttributes.of({ 'aria-label': 'Assembly source' }), EditorView.updateListener.of(u => { if (u.docChanged) onChange(u.state.doc.toString()); })] }), parent: ref.current }); viewRef.current = view; return () => view.destroy(); }, []);
  useEffect(() => { const view = viewRef.current; if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } }); }, [value]);
  return <div ref={ref} className="editor" />;
}
function App() {
  const initial = EXAMPLES['Arithmetic'];
  const [source, setSource] = useState(initial), [parsed, setParsed] = useState(parse(initial));
  const [cpu, setCpu] = useState(() => createMachine(initial).cpu), [history, setHistory] = useState([]), [selected, setSelected] = useState('Arithmetic');
  const [machineCode, setMachineCode] = useState(() => encode(initial)), [codeError, setCodeError] = useState('');
  const refresh = s => { const p = parse(s); setParsed(p); try { setMachineCode(encode(s)); setCodeError(''); } catch (e) { setMachineCode([]); setCodeError(e.message); } return p; };
  const edit = s => { setSource(s); setHistory([]); try { setCpu(createMachine(s).cpu); } catch { setCpu(createMachine('HLT').cpu); } refresh(s); };
  const load = name => { setSelected(name); setSource(EXAMPLES[name]); reset(EXAMPLES[name]); };
  const reset = (s = source) => { refresh(s); try { setCpu(createMachine(s).cpu); } catch { setCpu(createMachine('HLT').cpu); } setHistory([]); };
  const current = () => { const p = refresh(source); if (p.errors.length) return { p, cpu: null }; try { return { p, ...createMachine(source) }; } catch (e) { setCodeError(e.message); return { p, cpu: null }; } };
  const run = () => { const { p, cpu: start } = current(); if (p.errors.length || !start) return; let c = history.length ? cpu : start, h = history.length ? [...history] : []; for (let i = 0; i < 1000 && !c.halted && !c.interrupted; i++) { c = step(c, p); h.push(c); } setCpu(c); setHistory(h); };
  const tick = () => { const { p, cpu: start } = current(); if (p.errors.length || !start) return; const base = history.length ? cpu : start; const c = step(base, p); setCpu(c); setHistory(history.length ? [...history, c] : [base, c]); };
  const back = () => { if (!history.length) return; const h = history.slice(0, -1); setCpu(h.length ? h[h.length - 1] : createMachine(source).cpu); setHistory(h); };
  const memoryRows = Array.from({ length: 8 }, (_, i) => { const address = ((cpu.segments.SS << 4) + cpu.regs.SP + i * 2) & 0xfffff; return `${address.toString(16).padStart(5, '0')}: ${cpu.memory[address].toString(16).padStart(2, '0')} ${cpu.memory[(address + 1) & 0xfffff].toString(16).padStart(2, '0')}`; });
  const diagnostics = [...new Set([...parsed.errors, codeError].filter(Boolean))];
  return <main><header><h1>8086 Visualizer</h1><span>focused 8086 core subset</span></header><section className="toolbar"><select aria-label="Assembly example" value={selected} onChange={e => load(e.target.value)}>{Object.keys(EXAMPLES).map(x => <option key={x}>{x}</option>)}</select><button onClick={() => reset()}>Reset</button><button onClick={back} disabled={!history.length}>Step Back</button><button onClick={tick}>Step</button><button onClick={run}>Run</button></section><div className="grid"><div><Editor value={source} onChange={edit}/>{diagnostics.map(e => <p className="error" key={e}>{e}</p>)}{cpu.output.length > 0 && <section aria-live="polite"><h2>Execution output</h2>{cpu.output.map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}</section>}<h2>Machine code</h2><pre className="memory">{machineCode.map(b => b.toString(16).padStart(2, '0')).join(' ') || '—'}</pre><h2>Stack / memory near SS:SP</h2><pre className="memory">{memoryRows.join('\n')}</pre></div><aside><h2>Registers</h2>{Object.entries(cpu.regs).map(([k,v]) => <div className="row" key={k}><b>{k}</b><code>{v} (0x{v.toString(16).padStart(4,'0')})</code></div>)}<h2>Segments</h2>{Object.entries(cpu.segments).map(([k,v]) => <span className="flag" key={k}>{k}:{v.toString(16).padStart(4,'0')}</span>)}<h2>Flags</h2><div>{Object.entries(cpu.flags).map(([k,v]) => <span className={v?'flag on':'flag'} key={k}>{k}:{v?1:0}</span>)}</div><h2>Execution</h2><p>IP: {cpu.ip} {cpu.halted && '• halted'} {cpu.interrupted && '• breakpoint'}</p><p>History: {history.length} states</p></aside></div><footer>MASM-style hex/directives • MOV immediate • ADD/SUB/ADC/SBB • XCHG • PUSH/POP • MUL AL • INT 03H</footer></main>;
}
createRoot(document.getElementById('root')).render(<App />);
