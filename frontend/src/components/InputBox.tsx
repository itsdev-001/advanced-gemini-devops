'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Square } from 'lucide-react';

interface InputBoxProps {
  onSendMessage: (payload: {
    prompt: string;
    imageBase64?: string;
    imageMimeType?: string;
    imagePreview?: string;
  }) => void;
  isStreaming: boolean;
  onStopStream: () => void;
}

export default function InputBox({ onSendMessage, isStreaming, onStopStream }: InputBoxProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedImage({
        base64: base64Data,
        mimeType: file.type
      });
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!prompt.trim() && !selectedImage) || isStreaming) return;

    onSendMessage({
      prompt: prompt.trim(),
      imageBase64: selectedImage?.base64,
      imageMimeType: selectedImage?.mimeType,
      imagePreview: imagePreview || undefined
    });

    setPrompt('');
    handleRemoveImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 180) + 'px';
    setPrompt(target.value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-[#1e1f20] rounded-2xl border border-gray-300 dark:border-[#333538] focus-within:border-blue-500 dark:focus-within:border-purple-500 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all p-3"
      >
        {/* Attached image preview thumbnail */}
        {imagePreview && (
          <div className="relative inline-block mb-2 p-1 bg-gray-100 dark:bg-[#282a2c] rounded-xl border border-gray-300 dark:border-[#3b3d40]">
            <img src={imagePreview} alt="Upload thumbnail" className="h-16 w-16 object-cover rounded-lg" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#282a2c] rounded-xl transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Auto-expanding prompt textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask Gemini anything or explore cloud architectures..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none max-h-44 py-1.5 px-1 leading-relaxed"
          />

          {/* Send or Stop Streaming button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStream}
              className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center shadow-sm animate-pulse focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Stop streaming"
              aria-label="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!prompt.trim() && !selectedImage}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                prompt.trim() || selectedImage
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-500/20'
                  : 'bg-gray-200 dark:bg-[#282a2c] text-gray-400 cursor-not-allowed'
              }`}
              title="Send prompt"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
      <div className="text-center mt-2 text-[11px] text-gray-400 dark:text-gray-500">
        Gemini AI Enterprise Edition — Server-side API Gateway
      </div>
    </div>
  );
}