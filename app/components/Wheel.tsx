"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

const SEGMENTS = 12;
const DEG_PER_SEGMENT = 360 / SEGMENTS;
// Pointer at top (0°). With rotate(R), viewer top shows wheel local angle (360−R) mod 360.
// Segment indices: 0–11, each 30°. Even = "Yes", odd = "No".
// We want specific segment centers at the top:
// - NO segment index 9 => centerAngle = (9.5 * 30) = 285°, so (360−R)≡285 => R≡75.
// - YES segment index 8 => centerAngle = (8.5 * 30) = 255°, so (360−R)≡255 => R≡105.
const FULL_SPINS = 5;
const NO_SEGMENT_INDEX = 9;
const YES_SEGMENT_INDEX = 8;
const NO_CENTER_ANGLE = (NO_SEGMENT_INDEX + 0.5) * DEG_PER_SEGMENT;
const YES_CENTER_ANGLE = (YES_SEGMENT_INDEX + 0.5) * DEG_PER_SEGMENT;
const LAND_AT_DEG_NO = (360 - NO_CENTER_ANGLE + 360) % 360; // 75
const LAND_AT_DEG_YES = (360 - YES_CENTER_ANGLE + 360) % 360; // 105
const SPIN_DURATION_MS = 4000;
// cubic-bezier(0.17, 0.67, 0.12, 0.99) ease-out
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// Which 30° segment is at the top (0–11). Peg hits when this value changes.
function segmentAtTop(rotationDeg: number) {
  const normalized = ((rotationDeg % 360) + 360) % 360;
  return Math.floor(normalized / DEG_PER_SEGMENT) % SEGMENTS;
}

interface WheelProps {
  name: string;
  isAlwaysYes: boolean;
}

export default function Wheel({ name, isAlwaysYes }: WheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [displayRotation, setDisplayRotation] = useState(0);
  const [tickerTrigger, setTickerTrigger] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastSegmentRef = useRef<number | null>(null);
  const drumrollRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      drumrollRef.current?.pause();
    };
  }, []);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setShowResult(false);
    lastSegmentRef.current = segmentAtTop(rotationRef.current);

    // Drumroll starts when you click Spin
    try {
      const drumroll = new Audio("/sounds/drumroll.mp3");
      drumrollRef.current = drumroll;
      drumroll.play().catch(() => {});
    } catch {
      /* ignore */
    }
    const startDeg = rotationRef.current;
    const remainder = ((startDeg % 360) + 360) % 360;
    const landAtDeg = isAlwaysYes ? LAND_AT_DEG_YES : LAND_AT_DEG_NO;
    let extra = (landAtDeg - remainder + 360) % 360;
    if (extra === 0) extra = 360;
    const endDeg = startDeg + FULL_SPINS * 360 + extra;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / SPIN_DURATION_MS, 1);
      const eased = easeOutCubic(t);
      const currentDeg = startDeg + (endDeg - startDeg) * eased;

      const seg = segmentAtTop(currentDeg);
      if (lastSegmentRef.current !== null && seg !== lastSegmentRef.current) {
        setTickerTrigger((c) => c + 1);
      }
      lastSegmentRef.current = seg;

      setDisplayRotation(currentDeg);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rotationRef.current = endDeg;
        setSpinning(false);
        setShowResult(true);

        // Stop drumroll and play cheer + fanfare when result is determined
        drumrollRef.current?.pause();
        drumrollRef.current = null;
        try {
          const cheer = new Audio("/sounds/cheer.mp3");
          const fanfare = new Audio("/sounds/fanfare.mp3");
          cheer.play().catch(() => {});
          fanfare.play().catch(() => {});
        } catch {
          /* ignore */
        }

        // Big confetti burst when wheel lands on No
        const burst = (count: number, opts: { origin: { x: number; y: number }; spread?: number }) => {
          confetti({
            particleCount: count,
            spread: opts.spread ?? 70,
            origin: opts.origin,
            colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#f97316", "#fb923c", "#facc15", "#eab308", "#dc2626"],
          });
        };
        burst(120, { origin: { x: 0.5, y: 0.45 } });
        burst(80, { origin: { x: 0.3, y: 0.5 }, spread: 100 });
        burst(80, { origin: { x: 0.7, y: 0.5 }, spread: 100 });
        burst(60, { origin: { x: 0.5, y: 0.6 }, spread: 55 });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isAlwaysYes, spinning]);

  const shareResult = useCallback(async () => {
    const resultWord = isAlwaysYes ? "Yes" : "No";
    const emoji = isAlwaysYes ? "✅" : "❌";
    const text = `Was ${name} Right? ${resultWord}! ${emoji} https://islaysonright.com`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [isAlwaysYes, name]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="relative flex items-center justify-center wheel-container"
        style={{ width: "var(--wheel-size)", height: "var(--wheel-size)" }}
      >
        {/* Peg shadows: fixed orientation (don't spin), positions follow pegs via displayRotation */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transformOrigin: "center center" }}
          aria-hidden
        >
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const angle = i * DEG_PER_SEGMENT + displayRotation;
            return (
              <div
                key={`peg-shadow-${i}`}
                className="absolute left-1/2 top-1/2 w-0 h-0"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * (var(--wheel-size) * 0.5 - 12px)))`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    width: "14px",
                    height: "14px",
                    marginLeft: "-7px",
                    marginTop: "-7px",
                    background: "transparent",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.35)",
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Ticker: single red pointer with dark outline + drop shadow; key forces remount so hit animation replays every peg pass */}
        <div
          key={tickerTrigger}
          className={`ticker-tab absolute z-20 w-0 h-0 ${tickerTrigger > 0 ? "ticker-hit" : ""}`}
          style={{
            left: "50%",
            top: "-10px",
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "36px solid #dc2626",
            borderBottom: "none",
            // First shadow = tight dark outline, second = softer drop shadow
            filter: "drop-shadow(0 0 1px #7f1d1d) drop-shadow(0 2px 4px rgba(0,0,0,0.45))",
            transform: "translateX(-50%)",
            transformOrigin: "center top",
          }}
        />
        {/* Rotating wrapper: wheel + pegs (above shadow layer so pegs sit on top) */}
        <div
          ref={wheelRef}
          className="absolute inset-0 z-10"
          style={{
            transformOrigin: "center center",
            transform: `rotate(${displayRotation}deg)`,
            "--peg-r": "calc(var(--wheel-size) * 0.5 - 12px)",
          } as CSSProperties}
        >
          <div
            className="relative rounded-full border-[8px] border-amber-900 shadow-2xl overflow-hidden w-full h-full"
            style={{
              "--label-r": "calc(var(--wheel-size) * 0.38)",
              boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.1)",
              background: `conic-gradient(from 0deg, ${Array.from({ length: SEGMENTS })
                .map((_, i) => {
                  const isNo = i % 2 === 1;
                  const start = (i * 360) / SEGMENTS;
                  const end = ((i + 1) * 360) / SEGMENTS;
                  return `${isNo ? "#3b82b6" : "#f59e0b"} ${start}deg ${end}deg`;
                })
                .join(", ")})`,
            } as CSSProperties}
          >
            {/* Labels: one per segment, centered in wedge. 0° = top, clockwise. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transformOrigin: "center center" }}
            aria-hidden
          >
            {Array.from({ length: SEGMENTS }).map((_, i) => {
              const isNo = i % 2 === 1;
              const centerAngle = (i + 0.5) * DEG_PER_SEGMENT;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-0 h-0"
                  style={{
                    transform: `rotate(${centerAngle}deg) translateY(calc(-1 * var(--label-r)))`,
                    transformOrigin: "center center",
                  }}
                >
                  <span
                    className="absolute left-0 top-0 whitespace-nowrap font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider text-white drop-shadow-md"
                    style={{
                      textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {isNo ? "No" : "Yes"}
                  </span>
                </div>
              );
            })}
          </div>
          </div>
          {/* Rim pegs: sibling layer on top of wheel + border */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{ transformOrigin: "center center" }}
            aria-hidden
          >
            {Array.from({ length: SEGMENTS }).map((_, i) => {
              const angle = i * DEG_PER_SEGMENT;
              return (
                <div
                  key={`peg-${i}`}
                  className="absolute left-1/2 top-1/2 w-0 h-0"
                  style={{
                    transform: `rotate(${angle}deg) translateY(calc(-1 * var(--peg-r)))`,
                    transformOrigin: "center center",
                  }}
                >
                  <div
                    className="absolute left-0 top-0 rounded-full border-2 border-amber-950"
                    style={{
                      width: "14px",
                      height: "14px",
                      marginLeft: "-7px",
                      marginTop: "-7px",
                      background: "linear-gradient(135deg, #a8a29e 0%, #78716c 50%, #57534e 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {/* Center hub: fixed, does not spin */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full border-4 border-amber-950 z-20 pointer-events-none"
          style={{
            width: "18%",
            height: "18%",
            minWidth: "48px",
            minHeight: "48px",
            transform: "translate(-50%, -50%)",
            background: "linear-gradient(145deg, #a8a29e 0%, #78716c 30%, #57534e 70%, #44403c 100%)",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        />
        {/* Yes! / No! overlay in center of wheel when result is shown */}
        {showResult && (
          <div
            className="absolute left-1/2 top-1/2 z-30 pointer-events-none flex items-center justify-center"
            style={{ transform: "translate(-50%, calc(-50% - 0.3em))" }}
          >
            <span className="no-pop-in text-6xl sm:text-7xl md:text-8xl font-black text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.85)] leading-none inline-block">
              {isAlwaysYes ? "Yes!" : "No!"}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-row flex-wrap items-center justify-center gap-3">
        <button
          onClick={spin}
          disabled={spinning}
          className="flex items-center justify-center px-12 py-5 text-2xl sm:text-3xl font-bold uppercase tracking-widest rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 hover:bg-emerald-400 hover:shadow-emerald-500/50 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 border-4 border-emerald-700 min-w-[11rem] sm:min-w-[12rem] ring-2 ring-emerald-400/50 h-[4.5rem]"
        >
          SPIN!
        </button>
        {showResult && (
          <button
            type="button"
            onClick={shareResult}
            className="share-pop-in flex items-center justify-center px-8 py-5 text-xl sm:text-2xl font-bold rounded-2xl bg-amber-100 text-amber-950 border-4 border-amber-700 hover:bg-amber-200 active:scale-[0.98] transition-all duration-200 h-[4.5rem] min-w-[8rem]"
          >
            {copied ? "Copied!" : "Share"}
          </button>
        )}
      </div>
    </div>
  );
}
