export type UUID = string;
export interface UIMessage {
  id: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BranchMessage extends UIMessage {
  /**
   * Unique identifier for this message
   */
  id: UUID;
  
  /**
   * Reference to the parent message ID. Null for the first message in a conversation.
   */
  parentId: UUID | null;

  /**
   * Timestamp when the message was created
   */
  created_at: Date;
}

export interface AdjacencyMap {
  [messageId: UUID]: {
    parentId: UUID | null;
    childIds: UUID[];
  };
}

export interface BranchingChatOptions {
  /**
   * Initial leaf message ID to start from
   */
  initialCurrentLeafId?: UUID;

  /**
   * Initial messages to populate the conversation
   */
  initialMessages?: BranchMessage[];
}
