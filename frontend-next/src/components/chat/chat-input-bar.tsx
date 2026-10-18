"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  Trash2,
  FileDown,
  Printer,
} from "lucide-react";

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  onClearThread: () => void;
  onExportMarkdown: () => void;
  onPrintReport: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasMessages: boolean;
}

export function ChatInputBar({
  onSendMessage,
  onClearThread,
  onExportMarkdown,
  onPrintReport,
  isGenerating,
  disabled = false,
  placeholder = "QUERY REVENUE, LEVERAGE, AUDIT NOTES, OR RISK EXCEPTIONS...",
  hasMessages,
}: ChatInputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating || disabled) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t-2 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[0_-4px_0px_#000000] dark:shadow-[0_-4px_0px_#FFFFFF]">
      <div className="mx-auto max-w-4xl space-y-3">
        {/* Controls row */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-black dark:text-white">
              <kbd className="px-1.5 py-0.5 border border-black dark:border-white bg-white dark:bg-black font-mono text-[9px] shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF]">
                ENTER
              </kbd>
              <span>SUBMIT</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-black dark:text-white">
              <kbd className="px-1.5 py-0.5 border border-black dark:border-white bg-white dark:bg-black font-mono text-[9px] shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF]">
                SHIFT + ENTER
              </kbd>
              <span>LINE BREAK</span>
            </span>
          </div>

          {/* Action buttons (Clear, Export) */}
          {hasMessages && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportMarkdown}
                title="Export conversation to Markdown (.md)"
                className="flex items-center gap-1.5 px-2.5 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-[10px] font-mono font-bold uppercase shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF] cursor-pointer"
              >
                <FileDown className="h-3 w-3" />
                <span>EXPORT MD</span>
              </button>

              <button
                type="button"
                onClick={onPrintReport}
                title="Print or save as PDF"
                className="flex items-center gap-1.5 px-2.5 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-[10px] font-mono font-bold uppercase shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF] cursor-pointer"
              >
                <Printer className="h-3 w-3" />
                <span>PRINT PDF</span>
              </button>

              <button
                type="button"
                onClick={onClearThread}
                title="Clear current conversation"
                className="flex items-center gap-1.5 px-2.5 py-1 border border-black dark:border-white bg-white dark:bg-black hover:bg-[#FF0000] hover:text-white text-black dark:text-white transition-colors text-[10px] font-mono font-bold uppercase shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF] cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>CLEAR</span>
              </button>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="relative flex items-end gap-2 border-2 border-black dark:border-white bg-white dark:bg-black p-2 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isGenerating}
            placeholder={placeholder}
            className="flex-1 max-h-40 min-h-[44px] resize-none bg-transparent px-3 py-2 text-xs font-mono font-bold uppercase text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
          />

          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isGenerating || disabled}
            size="sm"
            className="h-10 px-5 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF0000] hover:text-white dark:hover:bg-[#FF0000] dark:hover:text-white shrink-0 gap-2 font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_#FF0000] cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#FF0000]" />
                <span className="hidden sm:inline">INFERRING...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-[#FF0000]" />
                <span className="hidden sm:inline">EXECUTE</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
