import { useEffect, useRef, useState } from "react";
import { startAnalyzerSession, type AnalyzerSession, type AnalyzerSnapshot } from "../../audio/analyzer";
import { calculatePeakRms, calculateRtaBands, estimateDominantFrequency, mapSpectrumToLogBins } from "../../calculations/dsp/analyzers";
import { LevelMeter } from "../../components/LevelMeter";
import { SpectrumBars } from "../../components/SpectrumBars";
import { ToolPanel } from "../../components/ToolPanel";
import "./analyzer-suite.css";

type AnalysisStatus = "stopped" | "starting" | "running" | "error";

interface LiveAnalysisController {
  activeId: string | null;
  errorId: string | null;
  status: AnalysisStatus;
  error: string;
  snapshot: AnalyzerSnapshot | null;
  start: (id: string) => Promise<void>;
  stop: (id: string) => Promise<void>;
}

function useLiveAnalysis(): LiveAnalysisController {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("stopped");
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<AnalyzerSnapshot | null>(null);
  const sessionRef = useRef<{ id: string; session: AnalyzerSession } | null>(null);
  const animationRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      const active = sessionRef.current;
      sessionRef.current = null;
      if (active) void active.session.stop();
    };
  }, []);

  async function stop(id: string) {
    const active = sessionRef.current;
    if (!active || active.id !== id) return;
    sessionRef.current = null;
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    await active.session.stop();
    if (mountedRef.current) {
      setActiveId(null);
      setStatus("stopped");
      setSnapshot(null);
    }
  }

  async function start(id: string) {
    if (sessionRef.current) {
      await stop(sessionRef.current.id);
    }
    setError("");
    setErrorId(null);
    setSnapshot(null);
    setActiveId(id);
    setStatus("starting");

    try {
      const session = await startAnalyzerSession();
      if (!mountedRef.current) {
        await session.stop();
        return;
      }

      sessionRef.current = { id, session };
      setStatus("running");
      let lastUpdate = 0;
      const update = (timestamp: number) => {
        if (sessionRef.current?.session !== session) return;
        if (timestamp - lastUpdate >= 50) {
          const next = session.read();
          setSnapshot({ ...next });
          lastUpdate = timestamp;
        }
        animationRef.current = requestAnimationFrame(update);
      };
      animationRef.current = requestAnimationFrame(update);
    } catch (cause) {
      if (mountedRef.current) {
        setActiveId(null);
        setErrorId(id);
        setError(cause instanceof Error ? cause.message : "Microphone analysis could not start.");
        setStatus("error");
      }
    }
  }

  return { activeId, errorId, status, error, snapshot, start, stop };
}

function panelStatus(controller: LiveAnalysisController, id: string): AnalysisStatus {
  if (controller.activeId === id) return controller.status;
  return controller.errorId === id ? "error" : "stopped";
}

function panelError(controller: LiveAnalysisController, id: string): string {
  return controller.errorId === id ? controller.error : "";
}

function AnalyzerControls({
  status,
  error,
  startDisabled,
  onStart,
  onStop,
}: {
  status: AnalysisStatus;
  error: string;
  startDisabled: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <div className="analyzer-controls">
      <div className="analyzer-controls__buttons">
        <button
          type="button"
          className="analyzer-button analyzer-button--start"
          onClick={onStart}
          disabled={startDisabled || status === "starting" || status === "running"}
        >
          {status === "starting" ? "Requesting microphone…" : "Start analysis"}
        </button>
        <button
          type="button"
          className="analyzer-button"
          onClick={onStop}
          disabled={status !== "running"}
        >
          Stop analysis
        </button>
      </div>
      <span className={`analyzer-status analyzer-status--${status}`} role="status">
        {status === "running" ? "Analyzing" : status === "starting" ? "Requesting microphone" : status === "error" ? "Microphone unavailable" : "Stopped"}
      </span>
      {error && <p className="analyzer-error" role="alert">{error}</p>}
    </div>
  );
}

function PeakRmsAnalyzer({ controller }: { controller: LiveAnalysisController }) {
  const id = "peak-rms";
  const status = panelStatus(controller, id);
  const error = panelError(controller, id);
  const disabled = controller.activeId !== null && controller.activeId !== id;
  const metrics = controller.snapshot ? calculatePeakRms(controller.snapshot.timeDomain) : null;

  return (
    <ToolPanel
      title="Peak / RMS meter"
      description="Read digital peak and average RMS levels from the microphone input."
      eyebrow="ANALYZE / 01"
    >
      <AnalyzerControls
        status={status}
        error={error}
        startDisabled={disabled}
        onStart={() => void controller.start(id)}
        onStop={() => void controller.stop(id)}
      />
      <div className="analyzer-readouts">
        <LevelMeter
          label="RMS level"
          valueDbfs={metrics?.rmsDbfs ?? Number.NaN}
          peakDbfs={metrics?.peakDbfs ?? undefined}
        />
        <div className="analyzer-metric">
          <span>Peak sample</span>
          <output>{metrics?.peakDbfs === null || !metrics ? "No signal" : `${metrics.peakDbfs.toFixed(1)} dBFS`}</output>
          <small>{metrics?.isClipping ? "Over 0 dBFS — input clipping" : "Digital input peak"}</small>
        </div>
      </div>
      <p className="analyzer-caution">dBFS is a digital level reference, not calibrated sound pressure level. Microphone sensitivity and operating-system input gain affect readings.</p>
    </ToolPanel>
  );
}

function FftAnalyzer({ controller }: { controller: LiveAnalysisController }) {
  const id = "fft";
  const status = panelStatus(controller, id);
  const error = panelError(controller, id);
  const disabled = controller.activeId !== null && controller.activeId !== id;
  const snapshot = controller.snapshot;
  const bins = snapshot
    ? mapSpectrumToLogBins(snapshot.frequencyDbfs, snapshot.sampleRate, snapshot.fftSize, 96)
    : [];

  return (
    <ToolPanel
      title="FFT spectrum analyzer"
      description="View the live input spectrum on a logarithmic frequency scale."
      eyebrow="ANALYZE / 02"
    >
      <AnalyzerControls
        status={status}
        error={error}
        startDisabled={disabled}
        onStart={() => void controller.start(id)}
        onStop={() => void controller.stop(id)}
      />
      <SpectrumBars label="Live FFT spectrum, logarithmic frequency scale" bins={bins} />
      <div className="analyzer-axis"><span>20 Hz</span><span>1 kHz</span><span>20 kHz</span></div>
      <p className="analyzer-caution">FFT bin spacing: {snapshot ? (snapshot.sampleRate / snapshot.fftSize).toFixed(2) : "—"} Hz. Display is relative dBFS; microphone calibration is not applied.</p>
    </ToolPanel>
  );
}

function FrequencyAnalyzer({ controller }: { controller: LiveAnalysisController }) {
  const id = "frequency";
  const status = panelStatus(controller, id);
  const error = panelError(controller, id);
  const disabled = controller.activeId !== null && controller.activeId !== id;
  const snapshot = controller.snapshot;
  const peak = snapshot
    ? estimateDominantFrequency(snapshot.frequencyDbfs, snapshot.sampleRate, snapshot.fftSize)
    : null;

  return (
    <ToolPanel
      title="Audio frequency analyzer"
      description="Estimate the strongest frequency component in the live input."
      eyebrow="ANALYZE / 03"
    >
      <AnalyzerControls
        status={status}
        error={error}
        startDisabled={disabled}
        onStart={() => void controller.start(id)}
        onStop={() => void controller.stop(id)}
      />
      <div className="analyzer-dominant">
        <span>DOMINANT FREQUENCY</span>
        <output>{peak ? `${peak.frequencyHz.toFixed(1)} Hz` : "No signal"}</output>
        <small>{peak ? `Peak ${peak.peakDbfs.toFixed(1)} dBFS · Resolution ${peak.resolutionHz.toFixed(2)} Hz` : "Waiting for a usable spectral peak"}</small>
      </div>
      <p className="analyzer-caution">Uses the strongest FFT peak with parabolic bin interpolation. Harmonics or room noise can be stronger than the source fundamental.</p>
    </ToolPanel>
  );
}

function RtaAnalyzer({ controller }: { controller: LiveAnalysisController }) {
  const id = "rta";
  const status = panelStatus(controller, id);
  const error = panelError(controller, id);
  const disabled = controller.activeId !== null && controller.activeId !== id;
  const snapshot = controller.snapshot;
  const bands = snapshot
    ? calculateRtaBands(snapshot.frequencyDbfs, snapshot.sampleRate, snapshot.fftSize)
    : [];
  const normalized = bands.map((band) =>
    band.levelDbfs === null ? 0 : Math.max(0, Math.min(1, (band.levelDbfs + 90) / 90)),
  );

  return (
    <ToolPanel
      title="Real-time analyzer (RTA)"
      description="Group live FFT energy into nominal one-third-octave frequency bands."
      eyebrow="ANALYZE / 04"
    >
      <AnalyzerControls
        status={status}
        error={error}
        startDisabled={disabled}
        onStart={() => void controller.start(id)}
        onStop={() => void controller.stop(id)}
      />
      <SpectrumBars label="One-third-octave RTA band levels" bins={normalized} />
      <div className="analyzer-axis"><span>20 Hz</span><span>1 kHz</span><span>20 kHz</span></div>
      <p className="analyzer-caution">31 nominal bands. Band levels average FFT-bin power; low-frequency accuracy depends on FFT resolution and microphone response.</p>
    </ToolPanel>
  );
}

export function AnalyzerSuite() {
  const controller = useLiveAnalysis();
  return (
    <section className="analyzer-suite-section" aria-labelledby="analyzer-suite-title">
      <div className="analyzer-suite-heading">
        <div>
          <span className="eyebrow">RELEASE 1 / LIVE ANALYSIS</span>
          <h3 id="analyzer-suite-title">Measure what <span>reaches the input.</span></h3>
        </div>
        <p>Choose any analyzer to start one shared microphone session. The same live input feeds each view; only one capture session runs at a time.</p>
      </div>
      <div className="analyzer-suite">
        <PeakRmsAnalyzer controller={controller} />
        <FftAnalyzer controller={controller} />
        <FrequencyAnalyzer controller={controller} />
        <RtaAnalyzer controller={controller} />
      </div>
      <p className="analyzer-disclaimer">Browser microphone readings depend on the microphone, interface, input gain, operating-system processing, and calibration. These tools report digital dBFS and spectral estimates, not certified SPL or laboratory measurements.</p>
    </section>
  );
}
