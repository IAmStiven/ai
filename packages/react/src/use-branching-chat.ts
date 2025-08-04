import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseChatOptions, UseChatHelpers } from './use-chat';
import { useChat } from './use-chat';
import type { BranchMessage, UUID } from './types/branching-chat';
import {
  buildAdjacency,
  findLatestLeafDescendant,
  getConversationPath,
  getSiblingIdsSorted,
} from './utils/branching-chat';

export type UseBranchingChatHelpers = UseChatHelpers<BranchMessage> & {
  /**
   * Select a specific branch in the conversation tree
   */
  selectBranch: (messageId: UUID) => void;

  /**
   * Get sibling message IDs sorted by creation date
   */
  getSiblingIdsSortedByDate: (messageId: UUID) => UUID[];
};

export interface UseBranchingChatOptions
  extends Omit<UseChatOptions<BranchMessage>, 'chat'> {
  /**
   * Initial leaf message ID to start from
   */
  initialCurrentLeafId?: UUID;

  /**
   * Initial messages to populate the conversation
   */
  initialMessages?: BranchMessage[];
}

export function useBranchingChat({
  initialMessages = [],
  initialCurrentLeafId,
  ...options
}: UseBranchingChatOptions = {}): UseBranchingChatHelpers {
  const [messages, setMessages] = useState<BranchMessage[]>(initialMessages);
  
  // Build and memoize the adjacency map
  const adjacency = useMemo(() => buildAdjacency(messages), [messages]);

  // Keep track of the current active leaf message
  const [currentLeafId, setCurrentLeafId] = useState<UUID | undefined>(() => {
    if (initialCurrentLeafId) return initialCurrentLeafId;
    if (messages.length === 0) return undefined;
    return findLatestLeafDescendant(messages[0].id, messages, adjacency);
  });

  // Get visible messages based on current path
  const visibleMessages = useMemo(() => {
    if (!currentLeafId || messages.length === 0) return [];
    const path = getConversationPath(currentLeafId, adjacency);
    return messages.filter(m => path.includes(m.id));
  }, [messages, currentLeafId, adjacency]);

  // Initialize useChat with visible messages
  const chat = useChat({
    ...options,
    initialMessages: visibleMessages,
  });

  // Update visible messages when chat messages change
  useEffect(() => {
    setMessages(prevMessages => {
      const newMessages = chat.messages.map(m => ({
        ...m,
        parentId: prevMessages.find(pm => pm.id === m.id)?.parentId || null,
        created_at: new Date(),
      }));
      
      return [...prevMessages.filter(m => !newMessages.find(nm => nm.id === m.id)), ...newMessages];
    });
  }, [chat.messages]);

  // Select a specific branch
  const selectBranch = useCallback((messageId: UUID) => {
    setCurrentLeafId(messageId);
  }, []);

  // Get sibling IDs sorted by date
  const getSiblingIdsSortedByDate = useCallback(
    (messageId: UUID) => getSiblingIdsSorted(messageId, messages, adjacency),
    [messages, adjacency],
  );

  return {
    ...chat,
    messages: visibleMessages,
    selectBranch,
    getSiblingIdsSortedByDate,
  };
}
