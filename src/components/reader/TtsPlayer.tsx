"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiX, FiVolume2, FiChevronDown,
} from "react-icons/fi";

interface TtsPlayerProps {
  text: string;           // full text of the current page/chapter
  locale: string;         // "zh" | "en"
  onClose: () => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// Split text into speakable chunks (sentences)
function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  // Split on Chinese or English sentence-ending punctuation
  const raw = cleaned.match(/[^。！？.!?\n]+[。！？.!?\n]*/g) ?? [cleaned];
  return raw.map(s => s.trim()).filter(s => s.length > 1);
}

export function TtsPlayer({ text, locale, onClose }: TtsPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const sentences = useRef<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);

  // Load sentences from text
  useEffect(() => {
    sentences.current = splitSentences(text);
    setCurrentIdx(0);
    stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const lang = locale === "zh" ? ["zh", "cmn"] : ["en"];
      const filtered = all.filter(v => lang.some(l => v.lang.toLowerCase().startsWith(l)));
      const preferred = filtered.length > 0 ? filtered : all;
      setVoices(preferred);
      if (!selectedVoice && preferred.length > 0) {
        // Prefer a local/high-quality voice
        const best = preferred.find(v => v.localService) ?? preferred[0];
        setSelectedVoice(best);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const speakFrom = useCallback((idx: number) => {
    if (idx >= sentences.current.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentIdx(0);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sentences.current[idx]);
    u.lang = locale === "zh" ? "zh-CN" : "en-GB";
    u.rate = speed;
    if (selectedVoice) u.voice = selectedVoice;
    u.onend = () => {
      if (!isPlayingRef.current) return;
      const next = idx + 1;
      setCurrentIdx(next);
      speakFrom(next);
    };
    u.onerror = () => {
      if (!isPlayingRef.current) return;
      const next = idx + 1;
      setCurrentIdx(next);
      speakFrom(next);
    };
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  // speed / selectedVoice captured via closure — restart handled by play button
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, speed, selectedVoice]);

  const play = useCallback(() => {
    if (sentences.current.length === 0) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    speakFrom(currentIdx);
  }, [currentIdx, speakFrom]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const prev = useCallback(() => {
    const next = Math.max(0, currentIdx - 1);
    setCurrentIdx(next);
    if (isPlaying) { stop(); setTimeout(() => { isPlayingRef.current = true; setIsPlaying(true); speakFrom(next); }, 50); }
  }, [currentIdx, isPlaying, speakFrom, stop]);

  const next = useCallback(() => {
    const next = Math.min(sentences.current.length - 1, currentIdx + 1);
    setCurrentIdx(next);
    if (isPlaying) { stop(); setTimeout(() => { isPlayingRef.current = true; setIsPlaying(true); speakFrom(next); }, 50); }
  }, [currentIdx, isPlaying, speakFrom, stop]);

  const progress = sentences.current.length > 0
    ? Math.round((currentIdx / sentences.current.length) * 100)
    : 0;

  const currentSentence = sentences.current[currentIdx] ?? "";
  const displayVoice = selectedVoice
    ? (selectedVoice.name.length > 20 ? selectedVoice.name.slice(0, 18) + "…" : selectedVoice.name)
    : (locale === "zh" ? "默认" : "Default");

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-2xl mb-4 px-3">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
                <FiVolume2 className="text-brand-600 text-sm" />
              </div>
              <span className="font-semibold text-sm text-forest-900">
                {locale === "zh" ? "AI 听书" : "AI Reading"}
              </span>
              <span className="text-xs text-gray-400">
                {currentIdx + 1} / {sentences.current.length}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <FiX />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mx-5 h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Current sentence */}
          <div className="mx-5 mb-3 bg-brand-50 rounded-xl px-4 py-2.5 min-h-[48px] flex items-center">
            <p className="text-sm text-forest-800 leading-relaxed line-clamp-2">
              {isPlaying
                ? <><span className="inline-block w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse mr-1.5 align-middle" />{currentSentence}</>
                : currentSentence || (locale === "zh" ? "点击播放开始朗读…" : "Press play to start reading…")}
            </p>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-5 pb-4 gap-3">
            {/* Skip prev */}
            <button onClick={prev} disabled={currentIdx === 0}
              className="p-2 text-gray-500 hover:text-forest-700 disabled:opacity-30 transition-colors">
              <FiSkipBack size={18} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={isPlaying ? pause : play}
              className="w-11 h-11 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center shadow-brand transition-all hover:scale-105 active:scale-95"
            >
              {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} className="ml-0.5" />}
            </button>

            {/* Skip next */}
            <button onClick={next} disabled={currentIdx >= sentences.current.length - 1}
              className="p-2 text-gray-500 hover:text-forest-700 disabled:opacity-30 transition-colors">
              <FiSkipForward size={18} />
            </button>

            {/* Speed picker */}
            <div className="relative">
              <button onClick={() => { setShowSpeedMenu(v => !v); setShowVoiceMenu(false); }}
                className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                {speed}×<FiChevronDown className="text-[10px]" />
              </button>
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full mb-1 left-0 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden z-10 min-w-[70px]">
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => { setSpeed(s); setShowSpeedMenu(false); if (isPlaying) { stop(); setTimeout(() => { isPlayingRef.current = true; setIsPlaying(true); speakFrom(currentIdx); }, 50); } }}
                        className={`w-full px-3 py-2 text-xs font-medium text-left transition-colors ${speed === s ? "bg-brand-50 text-brand-600" : "hover:bg-gray-50 text-gray-700"}`}>
                        {s}×
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice picker */}
            {voices.length > 1 && (
              <div className="relative flex-1 min-w-0">
                <button onClick={() => { setShowVoiceMenu(v => !v); setShowSpeedMenu(false); }}
                  className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full max-w-[130px] truncate">
                  <span className="truncate">{displayVoice}</span>
                  <FiChevronDown className="text-[10px] flex-shrink-0" />
                </button>
                <AnimatePresence>
                  {showVoiceMenu && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-full mb-1 right-0 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden z-10 w-56 max-h-48 overflow-y-auto">
                      {voices.map(v => (
                        <button key={v.name} onClick={() => { setSelectedVoice(v); setShowVoiceMenu(false); }}
                          className={`w-full px-3 py-2 text-xs text-left transition-colors ${selectedVoice?.name === v.name ? "bg-brand-50 text-brand-600 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}>
                          <span className="font-medium block truncate">{v.name}</span>
                          <span className="text-[10px] text-gray-400">{v.lang}{v.localService ? " · 本地" : " · 在线"}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
