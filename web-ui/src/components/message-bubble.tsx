import { AssistantMessageContent } from './assistant-message-content'
import { MessageAttachments } from './message-attachments'
import type { DisplayMessage } from '@/stores/messages'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: DisplayMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          isUser
            ? 'max-w-[75%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground'
            : 'w-full text-foreground',
        )}
      >
        {isUser ? (
          <>
            <MessageAttachments attachments={message.attachments} />
            {message.content ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : null}
          </>
        ) : (
          <AssistantMessageContent message={message} />
        )}

        {message.isStreaming && !isUser && (
          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current" />
        )}
      </div>
    </div>
  )
}
