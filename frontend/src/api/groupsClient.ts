import type {
  ApiResponse,
  Group,
  ListGroupsResponseData,
  SendMessageRequest,
  SendMessageResponseData,
  AddMembersRequest,
  AddMembersResponseData,
  GroupListFilters,
  MediaType
} from '../types/groups';

export const DEFAULT_GROUPS_API_BASE = 'https://stag-saas-messagebot.tech-v2.groupin.app/api/v1';
export const BACKEND_PROXY_GROUPS_BASE = '/api/groupin/groups';

export class GroupsApiClient {
  private apiKey: string;
  private baseUrl: string;
  private useProxy: boolean;

  constructor(apiKey: string = '', baseUrl: string = DEFAULT_GROUPS_API_BASE, useProxy: boolean = true) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.useProxy = useProxy;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setUseProxy(use: boolean) {
    this.useProxy = use;
  }

  public isUsingProxy(): boolean {
    return this.useProxy;
  }

  private async _request<T>(method: string, path: string, options: { body?: unknown; params?: Record<string, string | undefined> } = {}): Promise<ApiResponse<T>> {
    // Determine effective target URL
    let urlStr: string;
    if (this.useProxy) {
      urlStr = `${BACKEND_PROXY_GROUPS_BASE}${path}`;
    } else {
      urlStr = `${this.baseUrl}${path}`;
    }

    const url = new URL(urlStr, window.location.origin);

    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, v);
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    try {
      const res = await fetch(url.toString(), {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const json: ApiResponse<T> = await res.json();

      if (!res.ok || !json.success) {
        const error: any = new Error(json.message || `HTTP ${res.status}`);
        error.status = res.status;
        error.code = json.error;
        error.data = json.data;
        throw error;
      }

      return json;
    } catch (err: any) {
      // If direct request failed with NetworkError/CORS, suggest switching to proxy
      if (!this.useProxy && (err.name === 'TypeError' || err.message?.includes('Failed to fetch'))) {
        throw new Error('Connection failed or blocked by browser CORS. Switch to "Backend Proxy" mode or check network.');
      }
      throw err;
    }
  }

  // 1. List Groups (GET /groups/list)
  async listGroups(filters: GroupListFilters = {}): Promise<ApiResponse<ListGroupsResponseData>> {
    return this._request<ListGroupsResponseData>('GET', '/list', {
      params: {
        type: filters.type,
        subject: filters.subject,
      }
    });
  }

  // 2. Send Group Message (POST /groups/send-message)
  async sendMessage(payload: SendMessageRequest): Promise<ApiResponse<SendMessageResponseData>> {
    return this._request<SendMessageResponseData>('POST', '/send-message', {
      body: payload
    });
  }

  // 3. Add Group Members (POST /groups/add-members)
  async addMembers(payload: AddMembersRequest): Promise<ApiResponse<AddMembersResponseData>> {
    return this._request<AddMembersResponseData>('POST', '/add-members', {
      body: payload
    });
  }

  // Fetch backend-configured environment settings
  async getBackendConfig(): Promise<{ base_url: string; has_api_key: boolean; use_mock: boolean }> {
    try {
      const res = await fetch(`${BACKEND_PROXY_GROUPS_BASE}/config`);
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.base_url) {
          this.baseUrl = json.data.base_url;
        }
        return json.data;
      }
    } catch {
      // fallback
    }
    return { base_url: this.baseUrl, has_api_key: false, use_mock: true };
  }


  // Helper: check if a media type is allowed in a given group
  static isMediaAllowed(group: Group, mediaType: MediaType): boolean {
    const configMap: Record<MediaType, string> = {
      image: 'photos_enabled',
      video: 'videos_enabled',
      document: 'document_enabled',
      audio: 'audio_enabled',
    };
    const key = configMap[mediaType];
    return !key || group.config[key] !== 'false';
  }
}

// Global singleton instance with localStorage persistence for convenience
const savedApiKey = typeof window !== 'undefined' ? localStorage.getItem('groupin_groups_api_key') || '' : '';
const savedUseProxy = typeof window !== 'undefined' ? localStorage.getItem('groupin_groups_use_proxy') !== 'false' : true;

export const groupsApi = new GroupsApiClient(savedApiKey, DEFAULT_GROUPS_API_BASE, savedUseProxy);
