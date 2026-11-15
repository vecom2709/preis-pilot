"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { normalizeBarcode } from "@/lib/barcode";
import { updateData, useAppData } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { IconFlash, IconScan, IconSwitch } from "@/components/ui/icons";

// Barcode-Scanner: 1. eingebaute BarcodeDetector-API (Android/Chrome), 2. ZXing auf dem Gerät (iOS/Safari, Firefox).
// Es werden keine Bilder gespeichert oder übertragen.

type Engine = "native" | "zxing";
type Problem = "denied" | "noCamera" | "insecure" | null;
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

interface NativeDetector { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> }
declare global {
  interface Window { BarcodeDetector?: { new (opts: { formats: string[] }): NativeDetector; getSupportedFormats?: () => Promise<string[]> } }
}

export function Scanner() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const data = useAppData();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [running, setRunning] = useState(false);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIdx, setDeviceIdx] = useState(0);
  const [torch, setTorch] = useState<boolean | null>(null);
  const [found, setFound] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState(false);

  const open = useCallback((code: string) => {
    updateData((d) => ({ ...d, scans: [{ code, name: null, at: new Date().toISOString() }, ...d.scans.filter((s) => s.code !== code)].slice(0, 20) }));
    router.push(`/${locale}/product/${code}`);
  }, [locale, router]);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setTorch(null);
  }, []);

  useEffect(() => stop, [stop]);

  const handleHit = useCallback((raw: string) => {
    const code = normalizeBarcode(raw);
    if (!code) return false;
    if (navigator.vibrate) navigator.vibrate(60);
    setFound(code);
    stop();
    open(code);
    return true;
  }, [open, stop]);

  async function start(idx = deviceIdx) {
    setProblem(null);
    setFound(null);
    if (!window.isSecureContext) return setProblem("insecure");
    if (!navigator.mediaDevices?.getUserMedia) return setProblem("noCamera");
    stop();
    try {
      const deviceId = devices[idx]?.deviceId;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setRunning(true);

      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
      setDevices(list);
      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };
      setTorch(caps.torch ? false : null);
      if (caps.focusMode?.includes("continuous")) {
        await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
      }

      const formats: string[] = window.BarcodeDetector ? ((await window.BarcodeDetector.getSupportedFormats?.().catch(() => [] as string[])) ?? []) : [];
      const supported = formats.includes("ean_13");
      if (supported && window.BarcodeDetector) {
        setEngine("native");
        const detector = new window.BarcodeDetector({ formats: FORMATS });
        let active = true;
        stopRef.current = () => { active = false; };
        const loop = async () => {
          if (!active || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            for (const c of codes) if (handleHit(c.rawValue)) return;
          } catch { /* Bild noch nicht bereit */ }
          setTimeout(loop, 120);
        };
        loop();
      } else {
        setEngine("zxing");
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
        const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]]]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        const controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result) handleHit(result.getText());
        });
        stopRef.current = () => controls.stop();
      }
    } catch (err) {
      const name = (err as DOMException)?.name;
      setProblem(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "noCamera");
      stop();
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || torch === null) return;
    const next = !torch;
    await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }).then(() => setTorch(next)).catch(() => setTorch(null));
  }

  function switchCamera() {
    const next = (deviceIdx + 1) % Math.max(1, devices.length);
    setDeviceIdx(next);
    start(next);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeBarcode(manual);
    if (!code) return setManualError(true);
    setManualError(false);
    open(code);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-panel)] bg-ink sm:aspect-video">
          <video ref={videoRef} className={`h-full w-full object-cover ${running ? "" : "hidden"}`} playsInline muted aria-label={t.scanner.title} />
          {running && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-1/2 h-28 -translate-y-1/2 rounded-lg border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          )}
          {!running && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-paper">
              <div>
                <IconScan width={48} height={48} className="mx-auto opacity-80" />
                <button className="btn btn-primary mt-4" onClick={() => start()}>{t.scanner.start}</button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {running && <button className="btn btn-quiet btn-sm" onClick={stop}>{t.scanner.stop}</button>}
          {running && devices.length > 1 && (
            <button className="btn btn-quiet btn-sm" onClick={switchCamera}><IconSwitch width={16} height={16} />{t.scanner.switch}</button>
          )}
          {running && torch !== null && (
            <button className="btn btn-quiet btn-sm" aria-pressed={torch} onClick={toggleTorch}><IconFlash width={16} height={16} />{torch ? t.scanner.torchOff : t.scanner.torchOn}</button>
          )}
          {engine && <span className="text-xs text-ink-soft">{engine === "native" ? t.scanner.engineNative : t.scanner.engineZxing}</span>}
        </div>
        <div className="mt-3 space-y-2" aria-live="assertive">
          {found && <Notice tone="success">{fmt(t.scanner.found, { code: found })}</Notice>}
          {problem && <Notice tone="warn">{t.scanner[problem]}</Notice>}
        </div>
      </div>

      <aside className="space-y-6">
        <form onSubmit={submitManual} className="panel p-4">
          <label htmlFor="manual" className="label">{t.scanner.manual}</label>
          <input
            id="manual"
            className="field num"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9 \-]*"
            placeholder={t.scanner.manualPlaceholder}
            value={manual}
            onChange={(e) => { setManual(e.target.value); setManualError(false); }}
            aria-invalid={manualError}
            aria-describedby={manualError ? "manual-err" : undefined}
          />
          {manualError && <p id="manual-err" className="mt-2 text-sm text-danger">{t.scanner.invalid}</p>}
          <button className="btn btn-primary mt-3 w-full" type="submit">{t.scanner.lookup}</button>
        </form>
        {data.scans.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-ink-soft">{t.scanner.recent}</h2>
            <ul className="mt-2 space-y-1">
              {data.scans.slice(0, 8).map((s) => (
                <li key={s.code}><Link className="num hover:text-pine" href={`/${locale}/product/${s.code}`}>{s.name ?? s.code}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
