import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  PlusCircle,
  Shield,
  Crown,
  UserCheck,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Key,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import type { Group, MediaType, Media, ApiResponse, SendMessageResponseData } from '../types/groups';
import { groupsApi, GroupsApiClient, DEFAULT_GROUPS_API_BASE } from '../api/groupsClient';
import { api } from '../api';

interface GroupMessengerProps {
  onNavigateToChecker?: () => void;
}

interface CampaignLog {
  id: string;
  roomId: number;
  roomName: string;
  type: 'text' | 'media' | 'gallery' | 'members_added';
  preview: string;
  timestamp: string;
  campaignId?: string | number;
  count?: number;
}

export const GroupMessenger: React.FC<GroupMessengerProps> = ({ onNavigateToChecker }) => {
  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Message Form State
  const [messageMode, setMessageMode] = useState<'text' | 'single_media' | 'gallery'>('text');
  const [textMessage, setTextMessage] = useState<string>('');
  
  // Single Media State
  const [singleMediaType, setSingleMediaType] = useState<MediaType>('image');
  const [singleMediaUrl, setSingleMediaUrl] = useState<string>('');
  const [singleMediaName, setSingleMediaName] = useState<string>('');
  const [singleMediaFileType, setSingleMediaFileType] = useState<string>('');
  const [singleMediaCaption, setSingleMediaCaption] = useState<string>('');

  // Gallery State
  const [galleryItems, setGalleryItems] = useState<Media[]>([]);
  const [galleryCaption, setGalleryCaption] = useState<string>('');
  const [newGalleryItem, setNewGalleryItem] = useState<{ type: MediaType; url: string; name: string }>({
    type: 'image',
    url: '',
    name: ''
  });

  // Add Members State
  const [newMembersInput, setNewMembersInput] = useState<string>('');
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [selectedJobToImport, setSelectedJobToImport] = useState<string>('');
  const [isImportingNumbers, setIsImportingNumbers] = useState<boolean>(false);

  // Operation Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<{ title: string; message: string; campaignId?: string | number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Settings & API Key modal/controls
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(groupsApi.getApiKey());
  const [useProxy, setUseProxy] = useState<boolean>(groupsApi.isUsingProxy());
  const [baseUrlInput, setBaseUrlInput] = useState<string>(groupsApi.getBaseUrl());

  // History log in current session
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);

  // Load Groups
  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await groupsApi.listGroups({
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });

      if (res.success && res.data?.groups) {
        setGroups(res.data.groups);
        // Retain or set selected group
        if (selectedGroup) {
          const stillThere = res.data.groups.find(g => g.room_id === selectedGroup.room_id);
          setSelectedGroup(stillThere || res.data.groups[0] || null);
        } else if (res.data.groups.length > 0) {
          setSelectedGroup(res.data.groups[0]);
        }
      } else {
        setError(res.message || 'Failed to fetch groups');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Groups API');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGroups();
    // Load dynamic config from backend .env
    groupsApi.getBackendConfig().then(cfg => {
      if (cfg?.base_url) {
        setBaseUrlInput(cfg.base_url);
      }
    }).catch(() => {});

    // Load recent jobs for the 1-click import feature
    api.getRecentJobs().then(jobs => {
      if (Array.isArray(jobs)) setRecentJobs(jobs);
    }).catch(() => {});
  }, [typeFilter]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const name = g.config.roomname || `Room ${g.room_id}`;
      const subject = g.config.subject || '';
      const type = g.config.type || '';
      const matchesSearch = searchQuery === '' || 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.room_id.toString().includes(searchQuery);
      
      const matchesType = typeFilter === 'all' || type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [groups, searchQuery, typeFilter]);

  // Check media permission
  const checkMediaPermission = (group: Group, mediaType: MediaType) => {
    return GroupsApiClient.isMediaAllowed(group, mediaType);
  };

  // Handle Save Settings
  const handleSaveConfig = () => {
    groupsApi.setApiKey(apiKeyInput);
    groupsApi.setUseProxy(useProxy);
    groupsApi.setBaseUrl(baseUrlInput);

    localStorage.setItem('groupin_groups_api_key', apiKeyInput);
    localStorage.setItem('groupin_groups_use_proxy', String(useProxy));
    localStorage.setItem('groupin_groups_base_url', baseUrlInput);

    setShowConfigModal(false);
    fetchGroups();
  };

  // Handle Send Message
  const handleSendMessage = async () => {
    if (!selectedGroup) return;
    setError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    try {
      let res: ApiResponse<SendMessageResponseData> | undefined;
      if (messageMode === 'text') {
        if (!textMessage.trim()) {
          throw new Error('Please enter a message text.');
        }
        res = await groupsApi.sendMessage({
          room_id: selectedGroup.room_id,
          message: textMessage.trim()
        });
        
        setCampaignLogs(prev => [{
          id: `log-${Date.now()}`,
          roomId: selectedGroup.room_id,
          roomName: selectedGroup.config.roomname || `Room ${selectedGroup.room_id}`,
          type: 'text',
          preview: textMessage.slice(0, 45) + (textMessage.length > 45 ? '...' : ''),
          timestamp: new Date().toLocaleTimeString(),
          campaignId: res?.data?.campaign_id
        }, ...prev]);

        setTextMessage('');
      } else if (messageMode === 'single_media') {
        if (!singleMediaUrl.trim()) {
          throw new Error('Please enter a valid media URL.');
        }
        if (!checkMediaPermission(selectedGroup, singleMediaType)) {
          throw new Error(`${singleMediaType.toUpperCase()} attachments are disabled by this group\'s configuration.`);
        }

        res = await groupsApi.sendMessage({
          room_id: selectedGroup.room_id,
          message: singleMediaCaption.trim(),
          media: {
            type: singleMediaType,
            url: singleMediaUrl.trim(),
            name: singleMediaName.trim() || undefined,
            filetype: singleMediaFileType.trim() || undefined
          }
        });

        setCampaignLogs(prev => [{
          id: `log-${Date.now()}`,
          roomId: selectedGroup.room_id,
          roomName: selectedGroup.config.roomname || `Room ${selectedGroup.room_id}`,
          type: 'media',
          preview: `[${singleMediaType}] ${singleMediaCaption || singleMediaUrl.slice(0, 30)}`,
          timestamp: new Date().toLocaleTimeString(),
          campaignId: res?.data?.campaign_id
        }, ...prev]);

        setSingleMediaUrl('');
        setSingleMediaCaption('');
        setSingleMediaName('');
        setSingleMediaFileType('');
      } else if (messageMode === 'gallery') {
        if (galleryItems.length === 0) {
          throw new Error('Please add at least one media item to the gallery (up to 10).');
        }

        res = await groupsApi.sendMessage({
          room_id: selectedGroup.room_id,
          message: galleryCaption.trim(),
          multiple_media: galleryItems
        });

        setCampaignLogs(prev => [{
          id: `log-${Date.now()}`,
          roomId: selectedGroup.room_id,
          roomName: selectedGroup.config.roomname || `Room ${selectedGroup.room_id}`,
          type: 'gallery',
          preview: `${galleryItems.length} media items: ${galleryCaption || 'No caption'}`,
          timestamp: new Date().toLocaleTimeString(),
          campaignId: res?.data?.campaign_id
        }, ...prev]);

        setGalleryItems([]);
        setGalleryCaption('');
      }

      if (res?.success) {
        setActionSuccess({
          title: 'Broadcast Dispatched Successfully!',
          message: `Campaign has been scheduled and queued for delivery to Room #${selectedGroup.room_id}.`,
          campaignId: res.data?.campaign_id
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Item to Gallery
  const handleAddGalleryItem = () => {
    if (!newGalleryItem.url.trim()) return;
    if (galleryItems.length >= 10) {
      setError('A gallery can have a maximum of 10 media items.');
      return;
    }
    if (selectedGroup && !checkMediaPermission(selectedGroup, newGalleryItem.type)) {
      setError(`${newGalleryItem.type.toUpperCase()} attachments are disabled for this group.`);
      return;
    }

    setGalleryItems(prev => [
      ...prev,
      {
        type: newGalleryItem.type,
        url: newGalleryItem.url.trim(),
        name: newGalleryItem.name.trim() || undefined
      }
    ]);
    setNewGalleryItem({ type: 'image', url: '', name: '' });
  };

  // Remove Item from Gallery
  const handleRemoveGalleryItem = (index: number) => {
    setGalleryItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Add Members
  const handleAddMembers = async () => {
    if (!selectedGroup) return;
    setError(null);
    setActionSuccess(null);

    const numbers = newMembersInput
      .split(/[\n,]+/)
      .map(n => n.trim().replace(/[^0-9+]/g, ''))
      .filter(n => n.length >= 10);

    if (numbers.length === 0) {
      setError('Please provide at least one valid mobile number (10-15 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await groupsApi.addMembers({
        room_id: selectedGroup.room_id,
        mobile_numbers: numbers
      });

      if (res.success) {
        setActionSuccess({
          title: 'Members Added Successfully',
          message: `${res.data?.added_count || numbers.length} member(s) have been added to ${selectedGroup.config.roomname || `Room ${selectedGroup.room_id}`}.`
        });

        setCampaignLogs(prev => [{
          id: `log-${Date.now()}`,
          roomId: selectedGroup.room_id,
          roomName: selectedGroup.config.roomname || `Room ${selectedGroup.room_id}`,
          type: 'members_added',
          preview: `Added ${res.data?.added_count || numbers.length} members`,
          timestamp: new Date().toLocaleTimeString(),
          count: res.data?.added_count || numbers.length
        }, ...prev]);

        setNewMembersInput('');
      } else {
        setError(res.message || 'Failed to add members');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Import verified numbers from past verification job
  const handleImportVerifiedJobNumbers = async () => {
    if (!selectedJobToImport) return;
    setIsImportingNumbers(true);
    try {
      // Fetch results for this job where status is FOUND / exists is true
      const results = await api.getJobResults(selectedJobToImport, 1, 100, undefined, 'FOUND');
      if (results?.items && results.items.length > 0) {
        const foundNumbers = results.items
          .filter(item => item.groupin_account_exists)
          .map(item => item.mobile_number);

        if (foundNumbers.length === 0) {
          setError('No verified active Groupin accounts found in the selected job.');
        } else {
          // Append to input
          const existing = newMembersInput.trim();
          const combined = existing ? `${existing}\n${foundNumbers.join('\n')}` : foundNumbers.join('\n');
          setNewMembersInput(combined);
          setActionSuccess({
            title: 'Numbers Imported!',
            message: `Loaded ${foundNumbers.length} verified Groupin numbers from job ${selectedJobToImport}.`
          });
        }
      } else {
        setError('No verified accounts found in this job report.');
      }
    } catch (err: any) {
      setError(`Failed to import numbers from job: ${err.message}`);
    } finally {
      setIsImportingNumbers(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Group Messenger & Broadcast Hub
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                SaaS MessageBot
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Target rooms, check media permissions, broadcast content & synchronize verified members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            API Key & Route
            {useProxy && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Backend Proxy Active"></span>
            )}
          </button>

          <button
            onClick={fetchGroups}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Groups
          </button>
        </div>
      </div>

      {/* Alert / Notification Bars */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{actionSuccess.title}</p>
              <p className="text-emerald-700 mt-0.5">{actionSuccess.message}</p>
              {actionSuccess.campaignId && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold text-emerald-800">Campaign ID:</span>
                  <code className="px-2 py-0.5 rounded bg-emerald-100/80 font-mono text-[11px] font-bold text-emerald-900 border border-emerald-300">
                    {actionSuccess.campaignId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(String(actionSuccess.campaignId), 'top-camp')}
                    className="p-1 hover:bg-emerald-200 rounded text-emerald-700 transition"
                    title="Copy Campaign ID"
                  >
                    {copiedId === 'top-camp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold text-base">×</button>
        </div>
      )}

      {/* Main Grid: Left Side Groups List, Right Side Active Group Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Group Selector & List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Your Groups & Rooms</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredGroups.length} available
              </span>
            </div>

            {/* Search and Type Filter */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search rooms or subjects..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Types</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="broadcast">Broadcast</option>
              </select>
            </div>

            {/* Groups Scrollable List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  Loading groups from SaaS bot...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  No matching groups found.
                </div>
              ) : (
                filteredGroups.map(group => {
                  const isSelected = selectedGroup?.room_id === group.room_id;
                  const isOwner = group.aff === 1;
                  const isAdmin = group.aff === 3;
                  const roomName = group.config.roomname || `Room ${group.room_id}`;

                  return (
                    <div
                      key={group.room_id}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {roomName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{group.room_id}
                          </span>
                        </div>

                        {/* Affiliation Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <Crown className="w-3 h-3 text-amber-600" />
                              Owner
                            </span>
                          ) : isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                              <Shield className="w-3 h-3 text-purple-600" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              Member
                            </span>
                          )}
                        </div>
                      </div>

                      {group.config.subject && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                          {group.config.subject}
                        </p>
                      )}

                      {/* Config Media Capabilities Matrix */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-medium">Allowed:</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`flex items-center gap-0.5 ${
                              checkMediaPermission(group, 'image')
                                ? 'text-emerald-700 font-medium'
                                : 'text-slate-300 line-through'
                            }`}
                            title={checkMediaPermission(group, 'image') ? 'Photos Enabled' : 'Photos Disabled'}
                          >
                            <ImageIcon className="w-3 h-3" />
                            Img
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              checkMediaPermission(group, 'video')
                                ? 'text-emerald-700 font-medium'
                                : 'text-slate-300 line-through'
                            }`}
                            title={checkMediaPermission(group, 'video') ? 'Videos Enabled' : 'Videos Disabled'}
                          >
                            <Video className="w-3 h-3" />
                            Vid
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              checkMediaPermission(group, 'document')
                                ? 'text-emerald-700 font-medium'
                                : 'text-slate-300 line-through'
                            }`}
                            title={checkMediaPermission(group, 'document') ? 'Documents Enabled' : 'Documents Disabled'}
                          >
                            <FileText className="w-3 h-3" />
                            Doc
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              checkMediaPermission(group, 'audio')
                                ? 'text-emerald-700 font-medium'
                                : 'text-slate-300 line-through'
                            }`}
                            title={checkMediaPermission(group, 'audio') ? 'Audio Enabled' : 'Audio Disabled'}
                          >
                            <Music className="w-3 h-3" />
                            Aud
                          </span>
                        </div>

                        {group.can_send && (
                          <span className="ml-auto text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Can Send
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Session Dispatched Activity Log */}
          {campaignLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Recent Dispatches
                </span>
                <span className="text-[10px] text-slate-400">{campaignLogs.length} logged</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {campaignLogs.map(log => (
                  <div key={log.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800">{log.roomName}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[10px] truncate">{log.preview}</p>
                    {log.campaignId && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-700 font-mono">
                        <span>Campaign: {log.campaignId}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Group Workspace & Message Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedGroup ? (
            <>
              {/* Group Header Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {selectedGroup.config.roomname || `Room ${selectedGroup.room_id}`}
                      </h2>
                      <span className="text-xs font-mono text-slate-400">
                        (ID: {selectedGroup.room_id})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedGroup.config.subject || 'Standard Discussion Room'} • Type:{' '}
                      <span className="font-semibold capitalize text-slate-700">
                        {selectedGroup.config.type || 'Standard'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Your Role:</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      selectedGroup.aff === 1
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : selectedGroup.aff === 3
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedGroup.aff_label}
                    </span>
                  </div>
                </div>

                {/* Media Capability Banner */}
                <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Channel Capabilities:</span>
                  {(['image', 'video', 'document', 'audio'] as MediaType[]).map(type => {
                    const allowed = checkMediaPermission(selectedGroup, type);
                    return (
                      <span
                        key={type}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          allowed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        }`}
                      >
                        {allowed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                        {type.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Message Composer Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Broadcast Composer</h3>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setMessageMode('text')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        messageMode === 'text'
                          ? 'bg-white text-blue-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Text Only
                    </button>
                    <button
                      onClick={() => setMessageMode('single_media')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        messageMode === 'single_media'
                          ? 'bg-white text-blue-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Single Media
                    </button>
                    <button
                      onClick={() => setMessageMode('gallery')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        messageMode === 'gallery'
                          ? 'bg-white text-blue-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Gallery (Multi)
                    </button>
                  </div>
                </div>

                {/* Sub-form 1: Text-Only */}
                {messageMode === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Group Message
                      </label>
                      <textarea
                        value={textMessage}
                        onChange={e => setTextMessage(e.target.value)}
                        placeholder="Write your announcement, campaign or update for this group..."
                        rows={4}
                        className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-form 2: Single Media */}
                {messageMode === 'single_media' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Media Type
                        </label>
                        <select
                          value={singleMediaType}
                          onChange={e => setSingleMediaType(e.target.value as MediaType)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="image">Image (PNG, JPG, WEBP)</option>
                          <option value="video">Video (MP4)</option>
                          <option value="document">Document (PDF, DOCX)</option>
                          <option value="audio">Audio (MP3, WAV)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          File Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={singleMediaName}
                          onChange={e => setSingleMediaName(e.target.value)}
                          placeholder="e.g. quarterly_report.pdf"
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {!checkMediaPermission(selectedGroup, singleMediaType) && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Warning: <strong>{singleMediaType.toUpperCase()}</strong> uploads are disabled in this room's configuration. The server may reject this request.
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Absolute Media URL
                      </label>
                      <input
                        type="url"
                        value={singleMediaUrl}
                        onChange={e => setSingleMediaUrl(e.target.value)}
                        placeholder="https://example.com/assets/banner.png"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Message / Caption
                      </label>
                      <textarea
                        value={singleMediaCaption}
                        onChange={e => setSingleMediaCaption(e.target.value)}
                        placeholder="Add an optional caption for this media..."
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-form 3: Gallery (Multiple Media) */}
                {messageMode === 'gallery' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Add Media Item to Gallery (Max 10)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={newGalleryItem.type}
                          onChange={e => setNewGalleryItem(prev => ({ ...prev, type: e.target.value as MediaType }))}
                          className="p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="document">Document</option>
                          <option value="audio">Audio</option>
                        </select>

                        <input
                          type="url"
                          value={newGalleryItem.url}
                          onChange={e => setNewGalleryItem(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="Media URL (https://...)"
                          className="sm:col-span-2 p-2 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddGalleryItem}
                          disabled={!newGalleryItem.url.trim() || galleryItems.length >= 10}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 transition"
                        >
                          + Add to Gallery ({galleryItems.length}/10)
                        </button>
                      </div>
                    </div>

                    {/* Gallery Items List */}
                    {galleryItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-700">Gallery Items Queue:</span>
                        <div className="space-y-1.5">
                          {galleryItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {item.type}
                                </span>
                                <span className="text-slate-600 font-mono text-[11px] truncate">{item.url}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryItem(idx)}
                                className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gallery Caption / Overall Message
                      </label>
                      <textarea
                        value={galleryCaption}
                        onChange={e => setGalleryCaption(e.target.value)}
                        placeholder="Add caption to accompany this media gallery..."
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}

                {/* Dispatch Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Endpoint: <code className="font-mono text-slate-600">POST /groups/send-message</code>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={isSubmitting || !selectedGroup.can_send}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-bounce' : ''}`} />
                    {isSubmitting ? 'Dispatching...' : 'Send to Group'}
                  </button>
                </div>
              </div>

              {/* Add Members Section (Available only for Owner: aff === 1) */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Add Group Members</h3>
                  </div>

                  {selectedGroup.aff === 1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <Crown className="w-3 h-3 text-amber-600" />
                      Owner Authorized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Owner Permission Required (Current: {selectedGroup.aff_label})
                    </span>
                  )}
                </div>

                {selectedGroup.aff === 1 ? (
                  <div className="space-y-4">
                    {/* Supercharged Integration Feature: 1-Click Import from Checker */}
                    {recentJobs.length > 0 && (
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            1-Click Import Verified Numbers from Checker
                          </span>
                          {onNavigateToChecker && (
                            <button
                              onClick={onNavigateToChecker}
                              className="text-[11px] text-blue-700 hover:underline flex items-center gap-0.5"
                            >
                              Open Checker <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-blue-700">
                          Instantly load verified Groupin accounts from a completed batch verification job directly into this group.
                        </p>
                        <div className="flex gap-2">
                          <select
                            value={selectedJobToImport}
                            onChange={e => setSelectedJobToImport(e.target.value)}
                            className="flex-1 p-2 rounded-lg border border-blue-200 text-xs bg-white text-slate-800 focus:outline-none"
                          >
                            <option value="">Select a recent verification job...</option>
                            {recentJobs.map(j => (
                              <option key={j.job_id} value={j.job_id}>
                                {j.job_id} ({j.filename}) — {j.accounts_found} Accounts Found
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleImportVerifiedJobNumbers}
                            disabled={!selectedJobToImport || isImportingNumbers}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50"
                          >
                            {isImportingNumbers ? 'Loading...' : 'Import Verified'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Numbers (10–15 digits, comma or newline separated)
                      </label>
                      <textarea
                        value={newMembersInput}
                        onChange={e => setNewMembersInput(e.target.value)}
                        placeholder="9876543210, +919876543211&#10;9123456789"
                        rows={3}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[11px] text-slate-400">
                        Endpoint: <code className="font-mono text-slate-600">POST /groups/add-members</code>
                      </span>
                      <button
                        onClick={handleAddMembers}
                        disabled={isSubmitting || !newMembersInput.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        {isSubmitting ? 'Adding...' : 'Add Members to Room'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Member Additions Restricted</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Only the group owner (affiliation level 1) can invite or add new members via the SaaS Bot API. Your current role is <strong>{selectedGroup.aff_label}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Group Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Select a group or room from the list on the left to start sending broadcast messages or managing members.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* API Key & Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Groups API Connection Settings</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  x-api-key (API Secret)
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="Enter your SaaS Groups API Key..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Passed as <code>x-api-key</code> on all requests.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Base API URL
                </label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={e => setBaseUrlInput(e.target.value)}
                  placeholder={DEFAULT_GROUPS_API_BASE}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Use Backend Proxy (Recommended)</span>
                  <input
                    type="checkbox"
                    checked={useProxy}
                    onChange={e => setUseProxy(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Routing requests via the FastAPI backend prevents browser CORS errors, keeps credentials secure, and provides mock fallback during outages.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs"
              >
                Save & Reconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
