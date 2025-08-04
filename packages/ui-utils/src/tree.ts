import type { BranchMessage, UUID, AdjacencyData } from './types/branching-chat';

/**
 * Build adjacency structures for the conversation tree.
 * If a message has no parentId, we treat it as a child of "__root__".
 */
export function buildAdjacency(messages: BranchMessage[]): AdjacencyData {
  const messagesById: Record<UUID, BranchMessage> = {};
  const childrenMap: Record<string, UUID[]> = {};

  for (const msg of messages) {
    messagesById[msg.id] = msg;

    const parentId = msg.annotations?.[0]?.parentId ?? '__root__';

    if (!childrenMap[parentId]) {
      childrenMap[parentId] = [];
    }
    childrenMap[parentId].push(msg.id);
  }

  return { messagesById, childrenMap };
}

/**
 * Reconstruct a linear conversation path from the root to the current leaf.
 */
export function getConversationPath(
  messagesById: Record<UUID, BranchMessage>,
  leafId: UUID | undefined,
  allMessages?: BranchMessage[]
): BranchMessage[] {
  const path: BranchMessage[] = [];
  if (leafId && messagesById[leafId]) {
    let current = messagesById[leafId];
    while (current) {
      path.unshift(current);
      const parentId = current.annotations?.[0]?.parentId;
      if (!parentId || !messagesById[parentId]) break;
      current = messagesById[parentId];
    }
  }
  return path;
}

/**
 * Recursively collect all "leaf" nodes that are descendants of `fromId`.
 * A leaf is a node with zero children.
 */
function findDescendantLeaves(
  messagesById: Record<UUID, BranchMessage>,
  childrenMap: Record<string, UUID[]>,
  fromId: UUID,
  leaves: BranchMessage[]
) {
  const children = childrenMap[fromId] || [];
  if (!children.length) {
    // If no children, `fromId` itself is a leaf
    leaves.push(messagesById[fromId]);
    return;
  }
  for (const childId of children) {
    findDescendantLeaves(messagesById, childrenMap, childId, leaves);
  }
}

/**
 * Finds all terminal descendants of `fromId` (i.e. leaves) and returns
 * the single leaf with the greatest `created_at`. If `fromId` itself has
 * no children, `fromId` is returned.
 */
export function findLatestLeafDescendant(
  messagesById: Record<UUID, BranchMessage>,
  childrenMap: Record<string, UUID[]>,
  fromId: UUID
): BranchMessage {
  const node = messagesById[fromId];
  const allLeaves: BranchMessage[] = [];
  findDescendantLeaves(messagesById, childrenMap, fromId, allLeaves);
  if (!allLeaves.length) {
    // `fromId` might be a leaf if we have no children
    return node;
  }
  // Return the most recently created leaf
  let latest = allLeaves[0];
  for (let i = 1; i < allLeaves.length; i++) {
    const leaf = allLeaves[i];
    if (leaf.created_at.getTime() > latest.created_at.getTime()) {
      latest = leaf;
    }
  }
  return latest;
}

/**
 * Return the IDs of all sibling messages, sorted by created_at ascending,
 * where siblings share the same parentId (or both are root).
 */
export function getSiblingIdsSorted(
  messagesById: Record<UUID, BranchMessage>,
  childrenMap: Record<string, UUID[]>,
  messageId: UUID
): UUID[] {
  const msg = messagesById[messageId];
  if (!msg) return [];

  const parentId = msg.annotations?.[0]?.parentId ?? '__root__';

  // slice so we can safely sort in place
  const childIds = (childrenMap[parentId] || []).slice();
  childIds.sort(
    (a, b) =>
      messagesById[a].created_at.getTime() -
      messagesById[b].created_at.getTime()
  );
  return childIds;
}
