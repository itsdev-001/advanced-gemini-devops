'use client';

import React from 'react';
import { Menu, Sparkles, Moon, Sun, Shield, Plus } from 'lucide-react';
import { GeminiModelInfo } from '@/types/chat';

interface HeaderProps {
  models: GeminiModelInfo[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({
  models,
  selectedModel,
  onSelectModel,
  onToggleSidebar,
  onNewChat,
  theme,
  onToggleTheme
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-[#333538] bg-white dark:bg-[#131314] px-4 flex items-center justify-between transition-colors z-20">
      {/* Left: Mobile Sidebar Toggle & New Chat & Model Selector */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c] md:hidden transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onNewChat}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c] md:hidden transition-colors"
          title="New Chat"
          aria-label="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Gemini Model Selector */}
        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#1e1f20] hover:bg-gray-200 dark:hover:bg-[#282a2c] border border-gray-200 dark:border-[#333538] transition-all">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer pr-3"
              aria-label="Select Gemini Model"
            >
              {models.map((m) => (
                <option 
                  key={m.id} 
                  value={m.id} 
                  className="bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-gray-100 py-1"
                >
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right: Portfolio Badges & Theme Toggle */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5" />
          <span>Server-side API Gateway</span>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors"
          title="Toggle Dark / Light Mode"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
    </header>
  );
}