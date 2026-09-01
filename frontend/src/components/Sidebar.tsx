'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Pin, 
  PinOff,
  Edit2, 
  Search, 
  Cpu, 
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { ChatSession } from '@/types/chat';
import { formatSessionDate } from '@/utils/formatters';
import Modal from './Modal';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  isOpen,
  onClose
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [renameModalSession, setRenameModalSession] = useState<ChatSession | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [deleteModalSession, setDeleteModalSession] = useState<ChatSession | null>(null);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const regularSessions = filteredSessions.filter((s) => !s.isPinned);

  const handleOpenRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameModalSession(session);
    setNewTitleInput(session.title);
  };

  const handleSaveRename = () => {
    if (renameModalSession && newTitleInput.trim()) {
      onRenameSession(renameModalSession.id, newTitleInput.trim());
      setRenameModalSession(null);
    }
  };

  const handleOpenDelete = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalSession(session);
  };

  const handleConfirmDelete = () => {
    if (deleteModalSession) {
      onDeleteSession(deleteModalSession.id);
      setDeleteModalSession(null);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#1e1f20] text-gray-200 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#333538] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Branding & New Chat */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-gray-100">Gemini AI</h1>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider">ENTERPRISE EDITION</span>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#282a2c] hover:bg-[#333538] text-gray-100 text-sm font-medium transition-all border border-[#3b3d40] hover:border-gray-500 group shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>New Chat</span>
          </button>

          {/* Search Filter */}
          {sessions.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#282a2c]/60 border border-[#333538] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Pinned Chats Section */}
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-amber-400" />
                <span>Pinned</span>
              </div>
              {pinnedSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  onTogglePin={(e) => {
                    e.stopPropagation();
                    onTogglePinSession(session.id);
                  }}
                  onOpenRename={(e) => handleOpenRename(session, e)}
                  onOpenDelete={(e) => handleOpenDelete(session, e)}
                />
              ))}
            </div>
          )}

          {/* Regular Chats Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Recent Chats
            </div>
            {regularSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-500">
                {searchTerm ? 'No matching chats found.' : 'No recent conversations yet.'}
              </div>
            ) : (
              regularSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  onTogglePin={(e) => {
                    e.stopPropagation();
                    onTogglePinSession(session.id);
                  }}
                  onOpenRename={(e) => handleOpenRename(session, e)}
                  onOpenDelete={(e) => handleOpenDelete(session, e)}
                />
              ))
            )}
          </div>
        </div>

        {/* Bottom: Info Bar */}
        <div className="p-3 border-t border-[#333538] bg-[#1a1a1c]/90 text-[11px] text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>DevOps Architecture</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            v1.0.0
          </span>
        </div>
      </aside>

      {/* Rename Dialog Modal */}
      <Modal
        isOpen={!!renameModalSession}
        onClose={() => setRenameModalSession(null)}
        title="Rename Conversation"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newTitleInput}
            onChange={(e) => setNewTitleInput(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#333538] bg-gray-50 dark:bg-[#282a2c] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Conversation title"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRenameModalSession(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRename}
              disabled={!newTitleInput.trim()}
              className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
            >
              Save Title
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalSession}
        onClose={() => setDeleteModalSession(null)}
        title="Delete Conversation?"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-200">&quot;{deleteModalSession?.title}&quot;</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModalSession(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface SessionRowProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onOpenRename: (e: React.MouseEvent) => void;
  onOpenDelete: (e: React.MouseEvent) => void;
}

function SessionRow({
  session,
  isActive,
  onSelect,
  onTogglePin,
  onOpenRename,
  onOpenDelete
}: SessionRowProps) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#282a2c] text-white font-medium shadow-inner'
          : 'text-gray-400 hover:bg-[#282a2c]/60 hover:text-gray-200'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
        <span className="truncate">{session.title}</span>
      </div>

      {/* Action Buttons on Hover */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          onClick={onTogglePin}
          className="p-1 hover:text-amber-400 rounded transition-colors"
          title={session.isPinned ? 'Unpin chat' : 'Pin chat'}
          aria-label="Toggle pin"
        >
          {session.isPinned ? <PinOff className="w-3 h-3 text-amber-400" /> : <Pin className="w-3 h-3" />}
        </button>

        <button
          onClick={onOpenRename}
          className="p-1 hover:text-blue-400 rounded transition-colors"
          title="Rename chat"
          aria-label="Rename conversation"
        >
          <Edit2 className="w-3 h-3" />
        </button>

        <button
          onClick={onOpenDelete}
          className="p-1 hover:text-red-400 rounded transition-colors"
          title="Delete chat"
          aria-label="Delete conversation"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}