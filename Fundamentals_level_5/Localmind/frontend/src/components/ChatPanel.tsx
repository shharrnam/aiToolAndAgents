import React, { useState } from 'react';
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
} from 'lucide-react';

/**
 * ChatPanel Component
 * Educational Note: Enhanced chat interface with multiple chat sessions support.
 * Features empty state, chat list, and chat switching capabilities.
 */

interface ChatPanelProps {
  projectName: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Dummy chats data
const dummyChats: Chat[] = [
  {
    id: '1',
    name: 'Project Overview',
    lastMessage: 'I\'d be happy to summarize the project requirements...',
    timestamp: '2 hours ago',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m ready to help you with your project. You can ask me questions about your sources, request summaries, or have me generate content based on your documents.',
      },
      {
        id: '2',
        role: 'user',
        content: 'Can you summarize the main points from the project requirements?',
      },
      {
        id: '3',
        role: 'assistant',
        content: 'I\'d be happy to summarize the project requirements for you. Based on the documents you\'ve added, here are the main points:\n\n1. **Core Functionality**: Build a local-first productivity tool\n2. **Key Features**: Document management, AI chat interface, and content generation\n3. **Tech Stack**: React frontend with Flask backend\n4. **Timeline**: MVP completion by end of Q4\n\nWould you like me to elaborate on any specific aspect?',
      },
    ],
  },
  {
    id: '2',
    name: 'Technical Implementation',
    lastMessage: 'The authentication flow should use JWT tokens...',
    timestamp: 'Yesterday',
    messages: [
      {
        id: '1',
        role: 'user',
        content: 'How should we implement the authentication system?',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'The authentication flow should use JWT tokens for secure session management. Based on your project structure, I recommend implementing a token-based authentication system with refresh tokens.',
      },
    ],
  },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ projectName }) => {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<Chat | null>(dummyChats[0]); // Start with first chat or null
  const [showChatList, setShowChatList] = useState(false);
  // For demo, you can set this to [] to see the empty state
  const [allChats, setAllChats] = useState<Chat[]>(dummyChats);

  const handleSend = () => {
    if (message.trim() && activeChat) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleNewChat = () => {
    console.log('Creating new chat');
    // Create a new chat and set it as active
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      name: `New Chat`,
      lastMessage: '',
      timestamp: 'Just now',
      messages: [],
    };
    setActiveChat(newChat);
    setShowChatList(false);
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setShowChatList(false);
  };

  const handleDeleteChat = (chatId: string) => {
    console.log('Deleting chat:', chatId);
    // Remove the chat from the list
    const updatedChats = allChats.filter(chat => chat.id !== chatId);
    setAllChats(updatedChats);

    // If the deleted chat was active, clear the active chat
    if (activeChat?.id === chatId) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0] : null);
    }
  };

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
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">{chat.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {chat.timestamp}
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
                <p
                  className="text-xs text-muted-foreground line-clamp-2 cursor-pointer"
                  onClick={() => handleSelectChat(chat)}
                >
                  {chat.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
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
                  <span className="font-semibold">{activeChat?.name || 'Chat'}</span>
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
                    onClick={() => handleSelectChat(chat)}
                    className={chat.id === activeChat?.id ? 'bg-accent' : ''}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    {chat.name}
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
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Ask about your sources..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              className="absolute right-1 top-1 h-7 w-7"
              disabled={!message.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          LocalMind can make mistakes. Please double-check important information.
        </p>
      </div>
    </div>
  );
};