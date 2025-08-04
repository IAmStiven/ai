import type { UIMessage } from 'ai';

export type UUID = string;

export interface BranchMessageAnnotations {
  parentId?: UUID;
  name?: string;
  modelId?: string;
}

export interface BranchMessage extends UIMessage {
  id: UUID;
  created_at: Date;
  annotations?: Array<BranchMessageAnnotations>;
  experimental_attachments?: Array<any>; // TODO: Define attachment type
}

export type BranchMessageCreate = Omit<BranchMessage, 'id' | 'created_at'> &
  Partial<Pick<BranchMessage, 'id' | 'created_at'>>;

export interface AdjacencyData {
  messagesById: Record<UUID, BranchMessage>;
  childrenMap: Record<string, UUID[]>; // parentId (or '__root__') -> array of child message IDs
}
