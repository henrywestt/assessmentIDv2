"use client";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Raw } from "../lib/types";
import { parseWorkbook, TemplateError } from "../lib/parse";

interface Props {
  onLoaded: (raw: Raw, fileName: string) => void;
  onError: (reasons: string[]) => void;
  onReset: () => void;
  showReset: boolean;
}

export default function Uploader({ onLoaded, onError, onReset, showReset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hot, setHot] = useState(false);

  function handleFile(f: File) {
    const rd = new FileReader();
    rd.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const raw = parseWorkbook(wb);
        onLoaded(raw, f.name);
      } catch (err) {
        if (err instanceof TemplateError) onError(err.reasons);
        else onError([String((err as Error)?.message || err)]);
      }
    };
    rd.readAsArrayBuffer(f);
  }

  return (
    <div
      className={`drop ${hot ? "hot" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setHot(true); }}
      onDragEnter={(e) => { e.preventDefault(); setHot(true); }}
      onDragLeave={(e) => { e.preventDefault(); setHot(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setHot(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
    >
      <div className="drop-txt">
        <b>Drop a framework .xlsx here</b> or choose a file to render a different client.
        <span className="sec">Parsed locally · nothing is uploaded · scores recomputed from raw cells</span>
      </div>
      <div className="drop-actions">
        <button className="btn primary" onClick={() => inputRef.current?.click()}>Choose file</button>
        {showReset && <button className="btn" onClick={onReset}>Sample</button>}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}
