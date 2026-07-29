import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedTextCycle({ words, interval = 3000, className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState("auto");
  const measureRef = useRef(null);
  const safeWords = words.length ? words : [""];

  useEffect(() => {
    const currentWord = measureRef.current?.children[currentIndex];
    if (currentWord) {
      setWidth(`${currentWord.getBoundingClientRect().width + 8}px`);
    }
  }, [currentIndex, safeWords]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % safeWords.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, safeWords.length]);

  const variants = {
    hidden: { y: -20, opacity: 0, filter: "blur(8px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      y: 20,
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  return (
    <>
      <div ref={measureRef} aria-hidden="true" className="pointer-events-none absolute opacity-0" style={{ visibility: "hidden" }}>
        {safeWords.map((word) => (
          <span key={word} className={`font-bold ${className}`}>
            {word}
          </span>
        ))}
      </div>
      <motion.span
        className="relative inline-block align-bottom"
        animate={{ width }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 1.2 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${currentIndex}-${safeWords[currentIndex]}`}
            className={`inline-block font-bold ${className}`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ whiteSpace: "nowrap" }}
          >
            {safeWords[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}
