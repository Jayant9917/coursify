import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Github,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { brand } from "@/utils/brand";
import fireLogo from "../../../assets/fire.gif";

const footerGroups = [
  {
    title: "The useful",
    links: [
      { label: "Home", to: "/" },
      { label: "Courses", to: "/courses" },
      { label: "Learning paths", to: "/courses" },
      { label: "Become an instructor", to: "/register" },
    ],
  },
  {
    title: "The essentials",
    links: [
      { label: `About ${brand.name}`, to: "/" },
      { label: "Terms of service", to: "/" },
      { label: "Privacy policy", to: "/" },
      { label: "Help center", to: "/" },
    ],
  },
];

const socialLinks = [
  { label: "X / Twitter", href: "#", Icon: Twitter },
  { label: "GitHub", href: "#", Icon: Github },
  { label: "LinkedIn", href: "#", Icon: Linkedin },
  { label: "Instagram", href: "#", Icon: Instagram },
];

const riseItem = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.7, bounce: 0 },
  },
};

export function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="overflow-hidden border-t border-neutral-200 bg-[#f4f4f2] text-neutral-600 transition-colors duration-300 dark:border-neutral-800 dark:bg-[#0a0a0a] dark:text-neutral-400"
    >
      <div className="page-shell px-6 pb-8 pt-16 sm:pt-20 lg:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <motion.div variants={riseItem} className="space-y-7 lg:col-span-5 xl:col-span-4">
            <Link to="/" className="group inline-flex items-center gap-3 text-neutral-950 dark:text-neutral-100">
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10">
                <img src={fireLogo} alt="" className="h-full w-full object-contain" />
              </span>
              <span className="text-lg font-semibold tracking-tight">{brand.name}</span>
            </Link>

            <p className="max-w-sm text-[15px] leading-7">
              {brand.description} Learn, track progress, and grow in one calm workspace.
            </p>

            <a
              href={`mailto:${brand.supportEmail}`}
              className="group inline-flex items-center gap-2 text-[15px] text-neutral-900 transition-colors hover:text-lime-600 dark:text-neutral-200 dark:hover:text-[#BEF264]"
            >
              {brand.supportEmail}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700">
                ● All systems operational
              </span>
              <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700">
                Built for curious minds
              </span>
            </div>

            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-neutral-700 dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3 lg:gap-8">
            {footerGroups.map((group) => (
              <motion.div key={group.title} variants={riseItem}>
                <h3 className="mb-5 font-semibold text-neutral-950 dark:text-neutral-100">{group.title}</h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-[15px] transition-colors hover:text-neutral-950 dark:hover:text-neutral-100"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            <motion.div variants={riseItem}>
              <h3 className="mb-5 font-semibold text-neutral-950 dark:text-neutral-100">The community</h3>
              <ul className="space-y-3 text-[15px]">
                <li><a href="#" className="transition-colors hover:text-neutral-950 dark:hover:text-neutral-100">GitHub</a></li>
                <li><a href="#" className="transition-colors hover:text-neutral-950 dark:hover:text-neutral-100">Share your course</a></li>
                <li><a href="#" className="transition-colors hover:text-neutral-950 dark:hover:text-neutral-100">Join the conversation</a></li>
              </ul>
            </motion.div>
          </div>
        </div>

        <motion.div variants={riseItem} className="relative mt-16 h-36 overflow-hidden sm:mt-24 sm:h-44">
          <p className="absolute left-1/2 top-8 w-full -translate-x-1/2 select-none whitespace-nowrap text-center text-[clamp(5rem,18vw,15rem)] font-semibold leading-[0.72] tracking-[0.02em] text-neutral-200 dark:text-neutral-900">
            {brand.name}
          </p>
        </motion.div>

        <div className="!hidden mt-8 flex flex-col gap-4 border-t border-neutral-300 pt-6 text-xs dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {brand.name} — {brand.motto}</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/" className="transition hover:text-neutral-950 dark:hover:text-white">Terms</Link>
            <Link to="/" className="transition hover:text-neutral-950 dark:hover:text-white">Privacy</Link>
            <Link to="/" className="transition hover:text-neutral-950 dark:hover:text-white">Code of conduct</Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
