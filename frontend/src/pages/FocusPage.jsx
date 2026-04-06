import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrutalCard } from "@/components/BrutalCard";
import { toast } from "@/components/ui/sonner";

const formatSeconds = (value) => {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatSessionDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const DEFAULT_FOCUS_MINUTES = 25;
const FOCUS_MODE_OPTIONS = [25, 50];
const CONTROL_ICON_SIZE = 16;
const STAGGER_DELAY = 0.05;
const HISTORY_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * STAGGER_DELAY },
  }),
};

export default function FocusPage({ focusSessions, onLogSession }) {
  const [modeMinutes, setModeMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);

  const finishedMinutes = useMemo(() => Math.round((modeMinutes * 60 - secondsLeft) / 60), [modeMinutes, secondsLeft]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          setIsRunning(false);
          toast.success("Pomodoro complete! Session logged.");
          onLogSession(modeMinutes);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, modeMinutes, onLogSession]);

  const switchMode = (minutes) => {
    setModeMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setSecondsLeft(modeMinutes * 60);
    setIsRunning(false);
  };

  const saveCurrentProgress = async () => {
    if (!finishedMinutes) {
      toast.info("Start the timer to log focus minutes.");
      return;
    }
    await onLogSession(finishedMinutes);
    resetTimer();
  };

  return (
    <section className="space-y-8" data-testid="focus-page-root">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BrutalCard
          className="bg-[#fecaca]"
          title="Pomodoro Focus Timer"
          subtitle="Stay intense, then recover quickly."
          cardTestId="focus-timer-card"
        >
          <div className="space-y-6" data-testid="focus-timer-wrap">
            <div className="flex flex-wrap gap-3" data-testid="focus-mode-buttons-wrap">
              {FOCUS_MODE_OPTIONS.map((minutes) => (
                <Button
                  key={minutes}
                  type="button"
                  onClick={() => switchMode(minutes)}
                  className={`rounded-full border-2 border-[#18181b] ${
                    modeMinutes === minutes ? "bg-[#18181b] text-white" : "bg-white text-[#18181b]"
                  } hover:bg-[#18181b] hover:text-white`}
                  data-testid={`focus-mode-${minutes}-button`}
                >
                  {minutes} min mode
                </Button>
              ))}
            </div>

            <p className="timer-font text-6xl font-semibold" data-testid="focus-timer-display">
              {formatSeconds(secondsLeft)}
            </p>

            <div className="flex flex-wrap gap-3" data-testid="focus-controls-wrap">
              <Button
                type="button"
                onClick={() => setIsRunning((previous) => !previous)}
                className="rounded-full border-2 border-[#18181b] bg-[#18181b] text-white hover:scale-105"
                data-testid="focus-toggle-button"
              >
                {isRunning ? <Pause size={CONTROL_ICON_SIZE} className="mr-2" /> : <Play size={CONTROL_ICON_SIZE} className="mr-2" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              <Button
                type="button"
                onClick={resetTimer}
                className="rounded-full border-2 border-[#18181b] bg-white text-[#18181b] hover:bg-[#18181b] hover:text-white"
                data-testid="focus-reset-button"
              >
                <RotateCcw size={CONTROL_ICON_SIZE} className="mr-2" />
                Reset
              </Button>
              <Button
                type="button"
                onClick={saveCurrentProgress}
                className="rounded-full border-2 border-[#18181b] bg-[#bbf7d0] text-[#18181b] hover:bg-[#18181b] hover:text-white"
                data-testid="focus-save-progress-button"
              >
                <Save size={CONTROL_ICON_SIZE} className="mr-2" />
                Log {finishedMinutes || 0} min
              </Button>
            </div>
          </div>
        </BrutalCard>

        <BrutalCard className="bg-white" title="Recent Focus Sessions" subtitle="Your concentration history" cardTestId="focus-history-card">
          <div className="space-y-3" data-testid="focus-history-list">
            {focusSessions.length === 0 ? (
              <p className="text-sm" data-testid="focus-history-empty">No sessions logged yet.</p>
            ) : (
              focusSessions.slice(0, 8).map((session, index) => (
                <motion.div
                  key={session.id}
                  custom={index}
                  variants={HISTORY_ITEM_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-between border-b-2 border-[#18181b] pb-3"
                  data-testid={`focus-history-item-${index}`}
                >
                  <p className="text-sm" data-testid={`focus-history-item-${index}-date`}>
                    {formatSessionDate(session.started_at)}
                  </p>
                  <p className="text-sm font-medium" data-testid={`focus-history-item-${index}-minutes`}>
                    {session.duration_minutes} min
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </BrutalCard>
      </div>
    </section>
  );
}
