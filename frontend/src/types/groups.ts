/**
 * TypeScript Interfaces for Groups API
 * Base URL: https://stag-saas-messagebot.tech-v2.groupin.app
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type MediaType = 'image' | 'video' | 'document' | 'audio';

export interface Media {
  type: MediaType;
  url: string;           // Must be a valid absolute URL
  name?: string;         // Friendly filename (for document/audio)
  filetype?: string;     // MIME hint (e.g. "application/pdf")
}

export type AffiliationType = 1 | 2 | 3;
export type AffiliationLabel = 'owner' | 'member' | 'admin';

export interface GroupConfig {
  roomname?: string;
  type?: string;                 // e.g. "private", "public", etc.
  subject?: string;
  audio_enabled?: string;        // "true" | "false"
  document_enabled?: string;
  photos_enabled?: string;
  videos_enabled?: string;
  [key: string]: string | undefined;
}

export interface Group {
  room_id: number;
  aff: AffiliationType;          // 1 = owner, 2 = member, 3 = admin
  aff_label: AffiliationLabel;
  can_send: boolean;
  config: GroupConfig;
}

export interface ListGroupsResponseData {
  groups: Group[];
}

export interface SendMessageRequest {
  room_id: number;
  message: string;
  media?: Media;
  multiple_media?: Media[];
}

export interface SendMessageResponseData {
  campaign_id: string | number;
  status?: string;
}

export interface AddMembersRequest {
  room_id: number;
  mobile_numbers: string[];
}

export interface AddMembersResponseData {
  added_count: number;
  failed_numbers?: string[];
  already_members?: string[];
}

export interface GroupListFilters {
  type?: string;
  subject?: string;
  search?: string;
}
