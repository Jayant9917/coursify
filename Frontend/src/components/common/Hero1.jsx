import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { AnimatedTextCycle } from "@/components/ui/AnimatedTextCycle";
import { brand } from "@/utils/brand";

export function Hero1({ onBrowse }) {
  const stats = { students: 200, instructors: 50, courses: "70+" };

  return (
    <section className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-[#fbfbfa] text-neutral-950 dark:bg-[#06060c] dark:text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(23,23,23,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(23,23,23,0.045)_1px,transparent_1px)] [background-size:80px_80px] dark:opacity-80 dark:[background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute -bottom-32 left-[-8%] h-[620px] w-[720px] rounded-[45%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(190,140,255,0.28),rgba(190,140,255,0.1)_35%,transparent_72%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(158,92,255,0.75),rgba(49,20,98,0.38)_35%,transparent_72%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[55%] w-[55%] opacity-30 [background-image:linear-gradient(90deg,rgba(120,70,220,0.2)_1px,transparent_1px),linear-gradient(rgba(120,70,220,0.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_top_right,black,transparent_78%)] dark:opacity-60 dark:[background-image:linear-gradient(90deg,rgba(164,116,255,0.24)_1px,transparent_1px),linear-gradient(rgba(164,116,255,0.18)_1px,transparent_1px)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-7xl flex-col justify-between px-5 py-16 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="group max-w-4xl pt-10 sm:pt-12 lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <p className="mb-9 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-lime-700 dark:text-lime-300 sm:mb-7"><Sparkles className="h-3.5 w-3.5" /> {brand.name} learning platform</p>
            <h1 className="max-w-4xl text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-neutral-950 sm:text-7xl lg:text-[6.8rem] dark:text-white">Learn with focus,<br /><span className="text-[#84CC16]">build with<br /><AnimatedTextCycle words={["confidence.", "clarity.", "momentum."]} interval={3000} /></span></h1>
            <div className="mt-10 flex flex-col gap-4 sm:mt-9 sm:flex-row sm:items-center sm:gap-3">
              <Button size="lg" className="group/button w-fit min-w-[190px] rounded-full bg-neutral-950 pl-5 text-white transition-colors duration-200 hover:bg-[#BEF264] hover:text-black dark:bg-white dark:text-black dark:hover:bg-[#BEF264]" onClick={onBrowse}>Browse courses <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-black transition-transform transition-colors duration-200 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5 dark:bg-black dark:text-white"><ArrowUpRight className="h-4 w-4" /></span></Button>
              <div className="inline-flex min-h-11 w-fit max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-neutral-300 bg-white/70 px-4 py-2 text-xs text-neutral-600 dark:border-white/15 dark:bg-white/5 dark:text-neutral-300 sm:gap-3 sm:px-4 sm:text-sm"><Sparkles className="h-4 w-4 shrink-0 text-lime-600 dark:text-lime-300" /><span>Courses, notes, and focused playlists</span></div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="max-w-5xl pt-28 sm:pt-20">
          <p className="max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg sm:leading-7 dark:text-neutral-200">Learn through structured courses, useful study notes, and distraction-free playlists - all in one focused workspace.</p>
          <div className="mt-10 flex flex-col gap-9 border-t border-neutral-300/80 pt-8 dark:border-white/15 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:pt-6">
            <div className="flex min-w-0 items-center gap-3" aria-label="Trusted by a growing learning community">
              <AvatarGroup avatars={[]} />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Trusted by a growing learning community</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-neutral-300/80 dark:divide-white/15">
              <Metric value={stats.students} label="Active learners" />
              <Metric value={stats.instructors} label="Active instructors" />
              <Metric value={stats.courses} label="Published courses" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AvatarGroup({ avatars }) {
  const fallbackLabels = ["S", "K", "L", "N"];
  const visibleAvatars = avatars.slice(0, 4);

  return (
    <div className="flex shrink-0 items-center pl-1" role="img" aria-label="Skillnest learner community">
      {fallbackLabels.map((fallback, index) => (
        <div key={`${visibleAvatars[index] || fallback}-${index}`} className="-ml-1.5 grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-[#fbfbfa] bg-neutral-200 text-[11px] font-semibold text-neutral-700 first:ml-0 dark:border-[#06060c] dark:bg-neutral-800 dark:text-neutral-200">
          {visibleAvatars[index] ? <img src={visibleAvatars[index]} alt="" className="h-full w-full object-cover" /> : fallback}
        </div>
      ))}
    </div>
  );
}

function Metric({ value, label }) {
  return <div className="min-w-[92px] px-4 first:pl-0 last:pr-0 sm:min-w-[112px]"><p className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">{value}</p><p className="mt-1 text-xs leading-4 text-neutral-500 dark:text-neutral-400">{label}</p></div>;
}
