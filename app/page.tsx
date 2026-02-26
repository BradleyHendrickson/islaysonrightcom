"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Wheel from "./components/Wheel";

const SPECIAL_NAMES = new Set([
  "brad",
  "bradley",
  "rinth",
  "the spinning wheel",
  "spinning wheel",
  "wheel",
  "this website",
  "this site",
]);

function isAlwaysYesName(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return false;
  return SPECIAL_NAMES.has(normalized);
}

export default function Home() {
  const [name, setName] = useState("Layson");
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isAlwaysYes = useMemo(() => isAlwaysYesName(name), [name]);

  const openModal = useCallback(() => {
    setInputValue(name);
    setModalOpen(true);
  }, [name]);

  useEffect(() => {
    if (modalOpen) {
      setInputValue(name);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [modalOpen, name]);

  // Lock body scroll on mobile when modal is open
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setName(trimmed);
      closeModal();
    }
  }, [inputValue, closeModal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") closeModal();
    },
    [handleSave, closeModal]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-4 px-6 pb-6">
      <div className="flex justify-center mb-2">
        <Image
          src="/images/layson.jpg"
          alt="Layson"
          width={280}
          height={280}
          priority
          className="rounded-full object-cover w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64"
        />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-950 mb-6 text-center">
        Is {name} Right?
      </h1>
      <Wheel name={name} isAlwaysYes={isAlwaysYes} />
      <button
        type="button"
        onClick={openModal}
        aria-label="Change who the wheel is about"
        className="mt-6 mb-1 px-3 h-8 text-sm text-amber-800 hover:text-amber-950 hover:underline transition-colors cursor-pointer"
      >
        Change Name
      </button>

      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 min-h-[100dvh] min-h-screen overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-name-title"
          >
            <div className="bg-amber-50 border-4 border-amber-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm max-h-[85vh] overflow-auto">
              <h2
                id="change-name-title"
                className="text-xl font-bold text-amber-950 mb-3"
              >
                Change name
              </h2>
              <p className="text-amber-800 text-sm mb-3">
                Who should we check is right?
              </p>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter name"
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-700 bg-white text-amber-950 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-600 mb-4 text-base"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl font-medium text-amber-800 bg-amber-100 border-2 border-amber-700 hover:bg-amber-200 active:bg-amber-300 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!inputValue.trim()}
                  className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl font-medium text-white bg-amber-600 border-2 border-amber-800 hover:bg-amber-500 active:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
