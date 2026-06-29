"use client";
import { Moon, SunDim } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { cn } from "src/lib/utils";

type Props = {
  className?: string;
};

export const AnimatedThemeToggler = ({ className }: Props) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Restore theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const dark = savedTheme === "dark" || (!savedTheme && prefersDark);

    document.documentElement.classList.toggle("dark", dark);
    setIsDarkMode(dark);
  }, []);

  const changeTheme = async () => {
    if (!buttonRef.current) return;

    const applyTheme = () => {
      const dark = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", dark);
      setIsDarkMode(dark);
      localStorage.setItem("theme", dark ? "dark" : "light");
    };

    if (!document.startViewTransition) {
      applyTheme();
      return;
    }

    try {
      await document.startViewTransition(() => {
        flushSync(() => applyTheme());
      }).ready;

      const { top, left, width, height } =
        buttonRef.current.getBoundingClientRect();

      const x = left + width / 2;
      const y = top + height / 2;
      const right = window.innerWidth - left;
      const bottom = window.innerHeight - top;
      const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRad}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } catch (error) {
      console.warn("View transition failed:", error);
      applyTheme();
    }
  };

  return (
    <button ref={buttonRef} onClick={changeTheme} className={cn(className)}>
      {isDarkMode ? (
        <SunDim className="w-auto h-5" />
      ) : (
        <Moon className="w-auto h-5" />
      )}
    </button>
  );
};
