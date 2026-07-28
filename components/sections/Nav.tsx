"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { RetinaWordmark } from "@/components/brand/RetinaMark";
import { IconArrowUpRight } from "@/components/brand/Icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TERMINAL_URL } from "@/lib/urls";

const links = [
  { label: "Terminal", href: TERMINAL_URL },
  { label: "Cortex", href: "#suite" },
  { label: "Wallet", href: "#wallet" },
  { label: "How it works", href: "#flow" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={cn(
            "flex items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500",
            scrolled ? "glass shadow-float" : "border border-transparent"
          )}
        >
          <a href="#top" className="shrink-0">
            <RetinaWordmark />
          </a>

          <div className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="https://retinaos.mintlify.app"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Docs
            </a>
            <a href={TERMINAL_URL} className={cn(buttonVariants({ size: "sm" }), "group")}>
              Launch Terminal
              <IconArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <button
            className="flex size-10 items-center justify-center rounded-full text-fg lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {open && (
          <div className="mt-2 space-y-1 rounded-3xl glass p-3 lg:hidden">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-fg-muted hover:bg-panel hover:text-fg"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <a
                href="https://retinaos.mintlify.app"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1")}
              >
                Docs
              </a>
              <a
                href={TERMINAL_URL}
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ size: "sm" }), "flex-1")}
              >
                Launch Terminal
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
