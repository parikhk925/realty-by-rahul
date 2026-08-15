"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleMore, Send, X } from "lucide-react";
import { AGENT_NAME, BRAND_MARK } from "@/lib/property-data";

interface Turn {
  role: "assistant" | "lead";
  text: string;
}

interface Recommendation {
  slug: string;
  title: string;
  community: string;
  price: string;
  priceQualifier: string;
  bedrooms: number;
  matchPercentage: number;
  reason: string;
}

const VISITOR_KEY = "realty-by-rahul:visitor";

function visitorId() {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `web-${crypto.randomUUID()}`;
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function LeadChatWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      text: `Hi — I'm ${AGENT_NAME}'s assistant. Are you looking to buy, invest, rent, or sell in Dubai?`,
    },
  ]);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Buy",
    "Invest",
    "Rent",
    "Sell",
  ]);
  const [recommended, setRecommended] = useState<Recommendation[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, recommended]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    setTurns((prev) => [...prev, { role: "lead", text: message }]);
    setInput("");
    setQuickReplies([]);
    setSending(true);

    try {
      const response = await fetch("/api/crm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId(), message }),
      });
      const data = await response.json();

      if (!response.ok) {
        setTurns((prev) => [
          ...prev,
          { role: "assistant", text: data.error ?? "Something went wrong." },
        ]);
        return;
      }

      setTurns((prev) => [...prev, { role: "assistant", text: data.reply }]);
      setQuickReplies(data.quickReplies ?? []);
      setRecommended(data.recommended ?? []);
    } catch {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't reach the server. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close chat" : "Chat with Rahul's assistant"}
        className="fixed bottom-24 right-4 z-[60] flex size-14 items-center justify-center rounded-full bg-[#17212e] text-white shadow-[0_16px_40px_rgba(23,33,46,.38)] sm:bottom-6 sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "x" : "chat"}
            initial={{ opacity: 0, rotate: -40 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 40 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="size-5" /> : <MessageCircleMore className="size-5" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-40 right-4 z-[60] flex h-[30rem] w-[21.5rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[26px] border border-[#e9e1d3] bg-white shadow-[0_30px_90px_rgba(64,53,34,.28)] sm:bottom-24 sm:right-6"
          >
            <div className="flex items-center gap-2.5 bg-[#17212e] px-4 py-3 text-white">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
                {BRAND_MARK}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{AGENT_NAME}</p>
                <p className="text-[10px] text-white/70">Assistant · replies instantly</p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-2.5 overflow-y-auto bg-[#faf7f2] px-3 py-3.5"
            >
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className={`flex ${turn.role === "lead" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[86%] whitespace-pre-wrap rounded-[18px] px-3 py-2 text-[11px] leading-relaxed ${
                      turn.role === "lead"
                        ? "rounded-br-sm bg-[#17212e] text-white"
                        : "rounded-bl-sm border border-[#e9e1d3] bg-white text-[#17212e]"
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              ))}

              {recommended.map((item) => (
                <a
                  key={item.slug}
                  href={`/listing/${encodeURIComponent(item.slug)}`}
                  className="block rounded-[16px] border border-[#e9e1d3] bg-white p-2.5 transition hover:border-[#d6bf94]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#17212e]">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-[#f6eeda] px-1.5 py-0.5 text-[9px] font-semibold text-[#8f6420]">
                      {item.matchPercentage}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#6f6a5f]">
                    {item.community} ·{" "}
                    {item.bedrooms === 0 ? "Studio" : `${item.bedrooms} bed`} ·{" "}
                    {item.priceQualifier} {item.price}
                  </p>
                  <p className="mt-1 text-[10px] text-[#65604f]">{item.reason}</p>
                </a>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-[18px] rounded-bl-sm border border-[#e9e1d3] bg-white px-3 py-2.5">
                    {[0, 0.15, 0.3].map((delay) => (
                      <motion.span
                        key={delay}
                        className="size-1.5 rounded-full bg-[#9a9284]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[#ece4d6] bg-white px-3 py-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => send(reply)}
                    className="rounded-full border border-[#e2d3b2] bg-[#f7f1e6] px-2.5 py-1 text-[10px] font-semibold text-[#8f6420] transition hover:bg-[#f2e9d8]"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-[#ece4d6] bg-white p-2"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-full border border-[#e9e1d3] bg-[#faf7f2] px-3 py-2 text-[11px] outline-none focus-visible:border-[#b8862f]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#17212e] text-white disabled:opacity-40"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
