/**
 * ChatMessages Component
 * Educational Note: Displays the conversation message list with user and AI messages.
 * - User messages: Right-aligned, simple styling
 * - AI messages: Left-aligned with markdown rendering
 * - Shows a loading indicator when waiting for AI response
 */

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '../ui/scroll-area';
import { User, Robot, CircleNotch } from '@phosphor-icons/react';
import type { Message } from '../../lib/api/chats';

interface ChatMessagesProps {
  messages: Message[];
  sending: boolean;
}

/**
 * User Message Component
 * Educational Note: Right-aligned bubble style for user messages
 */
const UserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] flex gap-3">
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User size={16} />
        </div>
      </div>
    </div>
  </div>
);

/**
 * AI Message Component
 * Educational Note: Left-aligned with full markdown rendering support.
 * Uses react-markdown for parsing headers, lists, code blocks, links, etc.
 */
const AIMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex justify-start">
    <div className="max-w-[85%] flex gap-3">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Robot size={16} className="text-primary-foreground" />
        </div>
      </div>
      <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">LocalMind</p>
        {/* Markdown rendering with custom styling */}
        <div className="prose prose-sm prose-stone max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headers
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold mt-4 mb-2 first:mt-0">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h3>
              ),
              // Paragraphs
              p: ({ children }) => (
                <p className="text-sm mb-2 last:mb-0">{children}</p>
              ),
              // Lists
              ul: ({ children }) => (
                <ul className="text-sm list-disc pl-4 mb-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm list-decimal pl-4 mb-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm">{children}</li>
              ),
              // Code blocks
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className="block bg-stone-900 text-stone-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-2">{children}</pre>
              ),
              // Links
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  {children}
                </a>
              ),
              // Bold and italic
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">
                  {children}
                </blockquote>
              ),
              // Horizontal rule
              hr: () => <hr className="border-border my-4" />,
              // Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full text-sm border-collapse border border-border rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted/70">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-muted/30">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-3 py-2 text-left font-semibold border-b border-border">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 border-b border-border">{children}</td>
              ),
              // Images
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt || ''}
                  className="max-w-full h-auto rounded-lg my-2"
                />
              ),
              // Strikethrough (del)
              del: ({ children }) => (
                <del className="line-through text-muted-foreground">{children}</del>
              ),
              // Task lists (checkboxes)
              input: ({ type, checked }) => {
                if (type === 'checkbox') {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="mr-2 rounded border-border"
                    />
                  );
                }
                return <input type={type} />;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Loading Indicator
 * Educational Note: Shows when AI is processing/thinking
 */
const LoadingIndicator: React.FC = () => (
  <div className="flex justify-start">
    <div className="max-w-[85%] flex gap-3">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Robot size={16} className="text-primary-foreground" />
        </div>
      </div>
      <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">LocalMind</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleNotch size={16} className="animate-spin" />
          Thinking...
        </div>
      </div>
    </div>
  </div>
);

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, sending }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or when loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <ScrollArea className="flex-1 px-6">
      <div className="py-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage content={msg.content} />
            ) : (
              <AIMessage content={msg.content} />
            )}
            {msg.error && (
              <p className="text-xs text-destructive text-center mt-1">
                This message had an error
              </p>
            )}
          </div>
        ))}

        {/* Show loading indicator when sending */}
        {sending && <LoadingIndicator />}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
