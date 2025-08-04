import type { BranchMessage, UUID, AdjacencyMap } from '../types/branching-chat';

/**
 * Builds an adjacency map from a list of messages
 */
export function buildAdjacency(messages: BranchMessage[]): AdjacencyMap {
  const adjacency: AdjacencyMap = {};

  // Initialize the map with empty child arrays
  for (const message of messages) {
    adjacency[message.id] = {
      parentId: message.parentId,
      childIds: [],
    };
  }

  // Populate child IDs
  for (const message of messages) {
    if (message.parentId && adjacency[message.parentId]) {
      adjacency[message.parentId].childIds.push(message.id);
    }
  }

  return adjacency;
}

/**
 * Gets the path from root to the specified message ID
 */
export function getConversationPath(
  messageId: UUID,
  adjacency: AdjacencyMap,
): UUID[] {
  const path: UUID[] = [];
  let currentId: UUID | null = messageId;

  while (currentId !== null) {
    path.unshift(currentId);
    currentId = adjacency[currentId]?.parentId || null;
  }

  return path;
}

/**
 * Finds the latest leaf descendant of a given message
 */
export function findLatestLeafDescendant(
  messageId: UUID,
  messages: BranchMessage[],
  adjacency: AdjacencyMap,
): UUID {
  let currentId = messageId;

  while (adjacency[currentId]?.childIds.length > 0) {
    const childIds = adjacency[currentId].childIds;
    const sortedChildren = childIds
      .map(id => messages.find(m => m.id === id))
      .filter((m): m is BranchMessage => m !== undefined)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    if (sortedChildren.length === 0) break;
    currentId = sortedChildren[0].id;
  }

  return currentId;
}

/**
 * Gets sibling message IDs sorted by creation date
 */
export function getSiblingIdsSorted(
  messageId: UUID,
  messages: BranchMessage[],
  adjacency: AdjacencyMap,
): UUID[] {
  const parentId = adjacency[messageId]?.parentId;
  if (!parentId) return [messageId];

  return adjacency[parentId].childIds
    .map(id => messages.find(m => m.id === id))
    .filter((m): m is BranchMessage => m !== undefined)
    .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    .map(m => m.id);
}
