import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Plus,
  MessageSquare,
  ChevronDown,
  Clock,
  Hash,
  Trash2,
  Loader2,
  Mic,
} from 'lucide-react';
import { chatsAPI } from '../lib/api/chats';
import type { Chat, ChatMetadata } from '../lib/api/chats';
import { useToast, ToastContainer } from './ui/toast';

/**
 * ChatPanel Component
 * Educational Note: Enhanced chat interface with multiple chat sessions support.
 * Now uses ElevenLabs real-time WebSocket for speech-to-text transcription.
 */

interface ChatPanelProps {
  projectId: string;
  projectName: string;
}

/**
 * Educational Note: ElevenLabs WebSocket transcription configuration.
 * The token is embedded in the WebSocket URL and expires after 15 min.
 * We fetch a fresh config before each recording session.
 *
 * Security Note: API key never leaves the server - only the token
 * is included in the WebSocket URL for authentication.
 */
interface TranscriptionConfig {
  websocket_url: string;
  model_id: string;
  sample_rate: number;
  encoding: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ projectId, projectName }) => {
  const { toasts, dismissToast, success, error } = useToast();

  // State management
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  const [allChats, setAllChats] = useState<ChatMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [transcriptionConfigured, setTranscriptionConfigured] = useState(false);

  // Refs for audio streaming
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  // Track if a commit was processed to avoid duplicate text insertion
  const commitProcessedRef = useRef<boolean>(false);

  /**
   * Educational Note: Load all chats when component mounts.
   * Also check if transcription is configured.
   */
  useEffect(() => {
    loadChats();
    checkTranscriptionStatus();
  }, [projectId]);

  /**
   * Check if ElevenLabs transcription is configured
   */
  const checkTranscriptionStatus = async () => {
    try {
      const configured = await chatsAPI.isTranscriptionConfigured();
      setTranscriptionConfigured(configured);
    } catch (err) {
      console.error('Error checking transcription status:', err);
      setTranscriptionConfigured(false);
    }
  };

  /**
   * Load all chats for the project
   */
  const loadChats = async () => {
    try {
      setLoading(true);
      const chats = await chatsAPI.listChats(projectId);
      setAllChats(chats);

      // If we have chats and no active chat, load the first one
      if (chats.length > 0 && !activeChat) {
        await loadFullChat(chats[0].id);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
      error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load full chat data including all messages
   */
  const loadFullChat = async (chatId: string) => {
    try {
      const chat = await chatsAPI.getChat(projectId, chatId);
      setActiveChat(chat);
    } catch (err) {
      console.error('Error loading chat:', err);
      error('Failed to load chat');
    }
  };

  /**
   * Educational Note: Send a message and get AI response.
   * The backend handles calling Claude API with the full conversation context.
   */
  const handleSend = async () => {
    if (!message.trim() || !activeChat || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setSending(true);

    try {
      // Send message and get response from Claude
      const result = await chatsAPI.sendMessage(projectId, activeChat.id, userMessage);

      // Update the active chat with new messages
      setActiveChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, result.user_message, result.assistant_message],
          updated_at: new Date().toISOString(),
        };
      });

      // Update the chat metadata in the list
      await loadChats();
    } catch (err) {
      console.error('Error sending message:', err);
      error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  /**
   * Create a new chat
   */
  const handleNewChat = async () => {
    try {
      const newChat = await chatsAPI.createChat(projectId, 'New Chat');

      // Reload chats list
      await loadChats();

      // Load the new chat
      await loadFullChat(newChat.id);
      setShowChatList(false);

      success('New chat created');
    } catch (err) {
      console.error('Error creating chat:', err);
      error('Failed to create chat');
    }
  };

  /**
   * Select a chat from the list
   */
  const handleSelectChat = async (chatId: string) => {
    await loadFullChat(chatId);
    setShowChatList(false);
  };

  /**
   * Delete a chat
   */
  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatsAPI.deleteChat(projectId, chatId);

      // If the deleted chat was active, clear it
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }

      // Reload chats list
      await loadChats();

      success('Chat deleted');
    } catch (err) {
      console.error('Error deleting chat:', err);
      error('Failed to delete chat');
    }
  };

  /**
   * Educational Note: Start real-time transcription with ElevenLabs WebSocket.
   *
   * Flow:
   * 1. Fetch fresh config from backend (includes single-use token)
   * 2. Connect to ElevenLabs WebSocket (token is in URL)
   * 3. Wait for session_started event
   * 4. Get microphone access and create AudioContext
   * 5. Use AudioWorklet to process audio in real-time
   * 6. Send base64-encoded PCM audio chunks to WebSocket
   * 7. Receive partial and committed transcripts
   */
  const startRecording = async () => {
    try {
      // Reset commit tracking for new recording session
      commitProcessedRef.current = false;

      // Always fetch fresh config (token is single-use and expires)
      console.log('Fetching transcription config...');
      const config = await chatsAPI.getTranscriptionConfig();
      console.log('Got config, connecting to WebSocket...');

      // Connect to ElevenLabs WebSocket (token is in the URL)
      const ws = new WebSocket(config.websocket_url);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('ElevenLabs WebSocket connected, waiting for session_started...');
        // Don't start audio capture yet - wait for session_started
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WS message:', data.message_type || data.type, data);

          // Educational Note: ElevenLabs uses message_type field
          const messageType = data.message_type || data.type;

          if (messageType === 'session_started') {
            console.log('Session started, beginning audio capture...');
            // Now start audio capture
            await startAudioCapture(config.sample_rate);
          } else if (messageType === 'partial_transcript' && data.text) {
            setPartialTranscript(data.text);
          } else if (messageType === 'committed_transcript' && data.text) {
            // Mark that a commit was processed (prevents duplicate in stopRecording fallback)
            commitProcessedRef.current = true;
            // Append committed text to message
            setMessage((prev) => {
              if (prev && !prev.endsWith(' ')) {
                return prev + ' ' + data.text;
              }
              return prev + data.text;
            });
            setPartialTranscript('');
          } else if (messageType === 'auth_error') {
            console.error('ElevenLabs auth error:', data.error);
            error('Authentication error: ' + (data.error || 'Invalid token'));
            stopRecording();
          } else if (messageType === 'error' || messageType === 'input_error') {
            console.error('ElevenLabs error:', data);
            error('Transcription error: ' + (data.error || data.message || 'Unknown error'));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        error('Connection error. Please try again.');
        stopRecording();
      };

      ws.onclose = () => {
        console.log('ElevenLabs WebSocket closed');
      };

      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      error('Failed to start transcription. Check API key in settings.');
    }
  };

  /**
   * Educational Note: Start capturing audio from microphone and stream to WebSocket.
   * Uses AudioWorklet for efficient real-time processing without blocking the main thread.
   *
   * ElevenLabs expects audio as JSON messages with base64-encoded PCM data:
   * { message_type: "input_audio_chunk", audio_base_64: "...", sample_rate: 16000 }
   */
  const startAudioCapture = async (sampleRate: number) => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Create AudioContext with target sample rate
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Educational Note: AudioWorklet processes audio in a separate thread.
      // It converts Float32 to Int16 PCM and sends to main thread.
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = [];
            this.bufferSize = 4096; // ~0.25 sec at 16kHz
          }

          process(inputs) {
            const input = inputs[0];
            if (input && input[0]) {
              // Convert Float32 (-1 to 1) to Int16 PCM
              const float32 = input[0];
              for (let i = 0; i < float32.length; i++) {
                const s = Math.max(-1, Math.min(1, float32[i]));
                const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
                this.buffer.push(int16);
              }

              // Send when buffer is full
              if (this.buffer.length >= this.bufferSize) {
                const int16Array = new Int16Array(this.buffer);
                this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
                this.buffer = [];
              }
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      await audioContext.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
      workletNodeRef.current = workletNode;

      // Send audio data to WebSocket as base64-encoded JSON
      workletNode.port.onmessage = (event) => {
        const ws = websocketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          // Convert ArrayBuffer to base64
          const bytes = new Uint8Array(event.data);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const audioBase64 = btoa(binary);

          // Send as JSON message (ElevenLabs format)
          ws.send(JSON.stringify({
            message_type: 'input_audio_chunk',
            audio_base_64: audioBase64,
            sample_rate: sampleRate,
          }));
        }
      };

      source.connect(workletNode);
      // Don't connect to destination (we don't want to hear ourselves)

      console.log('Audio capture started');
    } catch (err) {
      console.error('Failed to start audio capture:', err);
      error('Failed to access microphone. Please check permissions.');
      stopRecording();
    }
  };

  /**
   * Stop recording and clean up resources
   */
  const stopRecording = useCallback(() => {
    // Stop audio capture first
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close WebSocket with commit
    if (websocketRef.current) {
      // Educational Note: Send a manual commit before closing to ensure
      // any remaining audio is transcribed. Without this, partial transcripts
      // would be lost if user stops before VAD detects silence.
      if (websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          message_type: 'input_audio_chunk',
          audio_base_64: '',
          commit: true,
          sample_rate: 16000,
        }));

        // Give a moment for committed_transcript to arrive before closing
        // Also save partial transcript as fallback (only if commit wasn't processed)
        const currentPartial = partialTranscript;
        setTimeout(() => {
          // Only add partial if no committed_transcript was received (fallback)
          if (currentPartial && !commitProcessedRef.current) {
            console.log('Commit not processed, using partial fallback:', currentPartial);
            setMessage((prev) => {
              if (prev && !prev.endsWith(' ')) {
                return prev + ' ' + currentPartial;
              }
              return prev + currentPartial;
            });
            setPartialTranscript('');
          }

          if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
          }
        }, 500);
      } else {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    }

    // If there's a partial transcript and WebSocket was already closed, save it
    // (only if commit wasn't already processed)
    if (partialTranscript && !websocketRef.current && !commitProcessedRef.current) {
      setMessage((prev) => {
        if (prev && !prev.endsWith(' ')) {
          return prev + ' ' + partialTranscript;
        }
        return prev + partialTranscript;
      });
      setPartialTranscript('');
    }

    setIsRecording(false);
    console.log('Recording stopped');
  }, [partialTranscript]);

  /**
   * Toggle recording on/off
   */
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean stop on unmount
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Helper function to format relative time
   */
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Display value combines typed message and partial transcript
  const displayMessage = partialTranscript
    ? message + (message && !message.endsWith(' ') ? ' ' : '') + partialTranscript
    : message;

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Chat with {projectName}</h2>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Case 1: No chats exist - show empty state
  if (allChats.length === 0 && !activeChat) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Chat with {projectName}</h2>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No chats yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a conversation to explore your project sources
            </p>
            <Button onClick={handleNewChat} className="gap-2">
              <Plus className="h-4 w-4" />
              Start New Chat
            </Button>
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Case 2: Chat list view - show all chats
  if (showChatList) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">All Chats</h2>
            </div>
            <Button size="sm" onClick={handleNewChat} className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {allChats.map((chat) => (
              <div
                key={chat.id}
                className="p-3 border rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="flex items-start justify-between mb-1">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">{chat.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(chat.updated_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 cursor-pointer"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  {chat.message_count} messages
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Case 3: Active chat view
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header with dropdown */}
      <div className="border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 gap-2">
                  <span className="font-semibold">{activeChat?.title || 'Chat'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setShowChatList(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View All Chats
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {allChats.slice(0, 5).map((chat) => (
                  <DropdownMenuItem
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={chat.id === activeChat?.id ? 'bg-accent' : ''}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    {chat.title}
                  </DropdownMenuItem>
                ))}
                {allChats.length > 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowChatList(true)}>
                      View more...
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNewChat}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ask questions about your sources or request analysis
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-6">
          {activeChat?.messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {msg.role === 'user' ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {msg.role === 'user' ? 'You' : 'LocalMind'}
                </p>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.error && (
                  <p className="text-xs text-destructive">This message had an error</p>
                )}
              </div>
            </div>
          ))}

          {/* Show loading indicator when sending */}
          {sending && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">LocalMind</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          {/* Microphone Button - Click to toggle recording */}
          <Button
            variant={isRecording ? 'default' : 'outline'}
            size="icon"
            className={`h-10 w-10 flex-shrink-0 ${
              isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
            } ${!transcriptionConfigured ? 'opacity-50' : ''}`}
            onClick={handleMicClick}
            disabled={sending || !transcriptionConfigured}
            title={
              !transcriptionConfigured
                ? 'Set up ElevenLabs API key in settings'
                : isRecording
                ? 'Click to stop recording'
                : 'Click to start recording'
            }
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'text-white' : ''}`} />
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder={
                isRecording
                  ? 'Listening...'
                  : !transcriptionConfigured
                  ? 'Type your message... (voice disabled - set API key)'
                  : 'Ask about your sources...'
              }
              value={displayMessage}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isRecording && handleSend()}
              className={`pr-10 ${partialTranscript ? 'text-muted-foreground' : ''}`}
              disabled={sending || isRecording}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              className="absolute right-1 top-1 h-7 w-7"
              disabled={!message.trim() || sending || isRecording}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
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

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
