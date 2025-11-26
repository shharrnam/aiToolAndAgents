/**
 * ChatInput Component
 * Educational Note: Input area with microphone button for voice input,
 * text field for typing, and send button. Displays partial transcripts
 * in real-time while recording.
 */

import React, { useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { PaperPlaneTilt, Microphone, CircleNotch } from '@phosphor-icons/react';

interface ChatInputProps {
  message: string;
  partialTranscript: string;
  isRecording: boolean;
  sending: boolean;
  transcriptionConfigured: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onMicClick: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  message,
  partialTranscript,
  isRecording,
  sending,
  transcriptionConfigured,
  onMessageChange,
  onSend,
  onMicClick,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Display value combines typed message and partial transcript
  const displayMessage = partialTranscript
    ? message + (message && !message.endsWith(' ') ? ' ' : '') + partialTranscript
    : message;

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Max height of ~4 lines (approx 100px), min height of 40px
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [displayMessage]);

  // Handle key down - Enter sends, Shift+Enter adds new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
      e.preventDefault(); // Prevent new line
      onSend();
    }
    // Shift+Enter will naturally add a new line (default textarea behavior)
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2 items-end">
        {/* Microphone Button - Click to toggle recording */}
        <Button
          variant={isRecording ? 'default' : 'outline'}
          size="icon"
          className={`h-10 w-10 flex-shrink-0 ${
            isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
          } ${!transcriptionConfigured ? 'opacity-50' : ''}`}
          onClick={onMicClick}
          disabled={sending || !transcriptionConfigured}
          title={
            !transcriptionConfigured
              ? 'Set up ElevenLabs API key in settings'
              : isRecording
              ? 'Click to stop recording'
              : 'Click to start recording'
          }
        >
          <Microphone size={16} className={isRecording ? 'text-white' : ''} />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={
              isRecording
                ? 'Listening...'
                : !transcriptionConfigured
                ? 'Type your message... (voice disabled - set API key)'
                : 'Ask about your sources... (Shift+Enter for new line)'
            }
            value={displayMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`pr-10 min-h-[40px] max-h-[100px] resize-none ${
              partialTranscript ? 'text-muted-foreground' : ''
            }`}
            disabled={sending || isRecording}
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onSend}
            className="absolute right-1 bottom-1 h-7 w-7"
            disabled={!message.trim() || sending || isRecording}
          >
            {sending ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <PaperPlaneTilt size={14} />
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        {isRecording
          ? 'Listening... Click mic to stop'
          : !transcriptionConfigured
          ? 'Voice input requires ElevenLabs API key (App Settings)'
          : 'Click mic to speak, or type your message'}
      </p>
    </div>
  );
};
