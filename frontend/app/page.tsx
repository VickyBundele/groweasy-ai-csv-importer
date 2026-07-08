"use client";

import Papa from "papaparse";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Moon, Sparkles, Sun, UploadCloud, XCircle } from "lucide-react";

type CsvRow = Record<string, string>;
type CrmRecord = Record<string, string>;
type Skipped = { sourceRow: number; reason: string; original: CsvRow };
type Job = {
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  totalRows: number;
  processedRows: number;
  totalImported: number;
  totalSkipped: number;
  imported: CrmRecord[];
  skipped: Skipped[];
  error?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function DataTable({ rows, emptyText }: { rows: CsvRow[]; emptyText: string }) {
  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => Object.keys(row)))),
    [rows]
  );

  if (!rows.length) return <div className="empty">{emptyText}</div>;

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => <td key={column}>{row[column] || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dark, setDark] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    if (!jobId) return;
    let stopped = false;

    const poll = async () => {
      try {
        const response = await fetch(`${API}/api/imports/${jobId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not read import status");
        if (stopped) return;
        setJob(data);
        if (data.status === "queued" || data.status === "processing") {
          window.setTimeout(poll, 900);
        }
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : "Polling failed");
      }
    };

    void poll();
    return () => { stopped = true; };
  }, [jobId]);

  const readFile = (selected: File) => {
    setError("");
    setJob(null);
    setJobId("");

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a .csv file.");
      return;
    }

    Papa.parse<CsvRow>(selected, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        if (result.errors.length && !result.data.length) {
          setError(result.errors[0].message);
          return;
        }
        if (!result.data.length) {
          setError("The CSV does not contain data rows.");
          return;
        }
        setFile(selected);
        setPreview(result.data);
      },
      error: (err) => setError(err.message)
    });
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) readFile(selected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const selected = event.dataTransfer.files?.[0];
    if (selected) readFile(selected);
  };

  const confirmImport = async () => {
    if (!file) return;
    setError("");
    setJob({
      status: "queued", progress: 0, totalRows: preview.length, processedRows: 0,
      totalImported: 0, totalSkipped: 0, imported: [], skipped: []
    });

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${API}/api/imports`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Import request failed");
      setJobId(data.jobId);
    } catch (e) {
      setJob(null);
      setError(e instanceof Error ? e.message : "Import failed");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setJob(null);
    setJobId("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = job?.status === "queued" || job?.status === "processing";

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="logo">G</span><span>GrowEasy</span></div>
        <button className="iconBtn" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={15} /> AI-powered CRM import</div>
        <h1>Turn any CSV into clean CRM leads.</h1>
        <p>Upload a messy lead export, review it first, then let AI intelligently map it into the GrowEasy CRM format.</p>
      </section>

      <section className="card">
        <div className="sectionHead">
          <div><span className="step">1</span><h2>Upload CSV</h2></div>
          {file && <button className="textBtn" onClick={reset}>Start over</button>}
        </div>

        {!file ? (
          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={42} />
            <strong>Drop your CSV file here</strong>
            <span>or click to browse files</span>
            <small>CSV only · maximum 10 MB</small>
            <input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={onInput} />
          </div>
        ) : (
          <div className="filePill">
            <FileSpreadsheet size={24} />
            <div><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · {preview.length} rows</span></div>
            <CheckCircle2 size={22} />
          </div>
        )}
        {error && <div className="error"><XCircle size={18} />{error}</div>}
      </section>

      {file && (
        <section className="card">
          <div className="sectionHead">
            <div><span className="step">2</span><h2>Preview uploaded data</h2></div>
            <span className="muted">No AI processing yet</span>
          </div>
          <DataTable rows={preview.slice(0, 100)} emptyText="No rows to preview" />
          {preview.length > 100 && <p className="muted below">Showing first 100 of {preview.length} rows.</p>}
          <div className="actions">
            <button className="secondary" onClick={reset} disabled={busy}>Cancel</button>
            <button className="primary" onClick={confirmImport} disabled={busy}>
              <Sparkles size={17} />{busy ? "AI is processing…" : "Confirm & import with AI"}
            </button>
          </div>
        </section>
      )}

      {job && (
        <section className="card">
          <div className="sectionHead">
            <div><span className="step">3</span><h2>AI extraction</h2></div>
            <span className={`status ${job.status}`}>{job.status}</span>
          </div>

          <div className="progressMeta"><span>{job.processedRows} / {job.totalRows} rows processed</span><strong>{job.progress}%</strong></div>
          <div className="progress"><div style={{ width: `${job.progress}%` }} /></div>

          {job.status === "failed" && <div className="error"><XCircle size={18} />{job.error || "AI processing failed"}</div>}

          {job.status === "completed" && (
            <>
              <div className="stats">
                <div><span>Total rows</span><strong>{job.totalRows}</strong></div>
                <div><span>Imported</span><strong>{job.totalImported}</strong></div>
                <div><span>Skipped</span><strong>{job.totalSkipped}</strong></div>
              </div>

              <h3>Successfully parsed CRM records</h3>
              <DataTable rows={job.imported} emptyText="No records were imported." />

              <h3 className="spaced">Skipped records</h3>
              <DataTable
                rows={job.skipped.map((item) => ({
                  sourceRow: String(item.sourceRow),
                  reason: item.reason,
                  original: JSON.stringify(item.original)
                }))}
                emptyText="No records were skipped."
              />
            </>
          )}
        </section>
      )}

      <footer>GrowEasy Software Developer Assignment · AI CSV Importer</footer>
    </main>
  );
}
