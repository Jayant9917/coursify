import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Select } from "@/components/ui";

const STORAGE_KEY = "skillnest_focus_timer";
const WORK_OPTIONS = [15, 25, 45, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];

function readSavedTimer() {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return null;
    const workMinutes = WORK_OPTIONS.includes(Number(saved.workMinutes)) ? Number(saved.workMinutes) : 25;
    const breakMinutes = BREAK_OPTIONS.includes(Number(saved.breakMinutes)) ? Number(saved.breakMinutes) : 5;
    const phase = saved.phase === "break" ? "break" : "work";
    const phaseDuration = (phase === "work" ? workMinutes : breakMinutes) * 60;
    const secondsRemaining = Math.max(0, Math.min(phaseDuration, Number(saved.secondsRemaining) || phaseDuration));
    return {
      workMinutes,
      breakMinutes,
      phase,
      secondsRemaining,
      isRunning: Boolean(saved.isRunning),
      completedSessions: Math.max(0, Number(saved.completedSessions) || 0),
      savedAt: Number(saved.savedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PomodoroTimer() {
  const [initial] = useState(() => readSavedTimer());
  const [workMinutes, setWorkMinutes] = useState(initial?.workMinutes || 25);
  const [breakMinutes, setBreakMinutes] = useState(initial?.breakMinutes || 5);
  const [phase, setPhase] = useState(initial?.phase || "work");
  const [secondsRemaining, setSecondsRemaining] = useState(initial?.secondsRemaining || 25 * 60);
  const [isRunning, setIsRunning] = useState(Boolean(initial?.isRunning));
  const [completedSessions, setCompletedSessions] = useState(initial?.completedSessions || 0);

  const phaseDuration = (phase === "work" ? workMinutes : breakMinutes) * 60;
  const progress = Math.max(0, Math.min(100, ((phaseDuration - secondsRemaining) / phaseDuration) * 100));
  const isFocusPhase = phase === "work";
  const phaseLabel = isFocusPhase ? "Focus session" : "Recovery break";
  const modeDescription = isFocusPhase ? "Stay with the lesson until the timer ends." : "Step away from the screen and recharge.";

  useEffect(() => {
    if (!initial?.isRunning || !initial.savedAt) return;
    const elapsed = Math.floor((Date.now() - initial.savedAt) / 1000);
    if (elapsed > 0) setSecondsRemaining((current) => Math.max(0, current - elapsed));
  }, [initial]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (secondsRemaining !== 0) return;

    const nextPhase = isFocusPhase ? "break" : "work";
    setIsRunning(false);
    setPhase(nextPhase);
    setSecondsRemaining((nextPhase === "work" ? workMinutes : breakMinutes) * 60);

    if (isFocusPhase) {
      setCompletedSessions((count) => count + 1);
      toast.success("Focus session complete. Take a break when you are ready.");
    } else {
      toast.success("Break complete. Ready for another focus session?");
    }
  }, [breakMinutes, isFocusPhase, secondsRemaining, workMinutes]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workMinutes, breakMinutes, phase, secondsRemaining, isRunning, completedSessions, savedAt: Date.now() })
    );
  }, [breakMinutes, completedSessions, isRunning, phase, secondsRemaining, workMinutes]);

  const reset = () => {
    setIsRunning(false);
    setPhase("work");
    setSecondsRemaining(workMinutes * 60);
  };

  const changeDuration = (type, value) => {
    const minutes = Number(value);
    if (type === "work") setWorkMinutes(minutes);
    else setBreakMinutes(minutes);

    if (!isRunning) {
      setPhase("work");
      setSecondsRemaining((type === "work" ? minutes : workMinutes) * 60);
    }
  };

  const skipPhase = () => {
    const nextPhase = isFocusPhase ? "break" : "work";
    setIsRunning(false);
    setPhase(nextPhase);
    setSecondsRemaining((nextPhase === "work" ? workMinutes : breakMinutes) * 60);
  };

  return (
    <Card className="focus-room-elevated rounded-[var(--focus-radius-lg)] border p-5 text-white sm:p-6" aria-label="Focus session timer">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 ${isFocusPhase ? "text-[var(--focus-timer-focus)]" : "text-[var(--focus-timer-break)]"}`}>
            <Timer className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Pomodoro mode</p>
          </div>
          <h2 className="mt-2 text-xl font-bold">Protect your focus</h2>
          <p className="mt-1 text-sm text-[var(--focus-text-secondary)]">{modeDescription}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isFocusPhase ? "border-lime-300/30 bg-lime-300/10 text-[var(--focus-timer-focus)]" : "border-cyan-300/30 bg-cyan-300/10 text-[var(--focus-timer-break)]"}`}>
          {phaseLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
        <div>
          <div className="flex items-end justify-between gap-3">
            <p className="font-mono text-6xl font-semibold tracking-tight text-white sm:text-7xl" role="timer" aria-live="polite">
              {formatTime(secondsRemaining)}
            </p>
            <p className="pb-2 text-sm text-[var(--focus-text-secondary)]">{completedSessions} completed</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--focus-border)]" aria-hidden="true">
            <div className={`h-full rounded-full transition-all ${isFocusPhase ? "bg-[var(--focus-timer-focus)]" : "bg-[var(--focus-timer-break)]"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="focus-room-primary" onClick={() => setIsRunning((running) => !running)}>
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? "Pause" : "Start session"}
            </Button>
            <Button size="sm" variant="outline" className="focus-room-secondary" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" variant="ghost" className="text-[var(--focus-text-secondary)] hover:bg-white/10 hover:text-white" onClick={skipPhase}>
              <SkipForward className="h-4 w-4" />
              Skip phase
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--focus-radius-md)] border border-[var(--focus-border)] bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--focus-text-muted)]">Session length</p>
          <label htmlFor="focus-timer-duration" className="block text-sm text-[var(--focus-text-secondary)]">
            Focus
            <Select id="focus-timer-duration" name="focusDuration" value={workMinutes} onChange={(event) => changeDuration("work", event.target.value)} className="mt-1 border-[var(--focus-border-strong)] bg-[var(--focus-surface)] text-white">
              {WORK_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </Select>
          </label>
          <label htmlFor="focus-break-duration" className="block text-sm text-[var(--focus-text-secondary)]">
            Break
            <Select id="focus-break-duration" name="breakDuration" value={breakMinutes} onChange={(event) => changeDuration("break", event.target.value)} className="mt-1 border-[var(--focus-border-strong)] bg-[var(--focus-surface)] text-white">
              {BREAK_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </Select>
          </label>
        </div>
      </div>
    </Card>
  );
}
