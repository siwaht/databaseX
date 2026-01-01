"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
    MessageSquare,
    Phone,
    FileText,
    RefreshCw,
    ChevronRight,
    Clock,
    User,
    Search,
    Key,
    CheckCircle,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Play,
    Pause,
    Mic,
    Volume2,
    Download,
    History,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Activity,
    Timer,
    LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { TwilioConversation, TwilioMessage, TwilioTranscription } from "@/lib/twilio/pica-client";
import { ElevenLabsConversation, ElevenLabsConversationDetail, ElevenLabsAgent } from "@/lib/elevenlabs/pica-client";

// Audio Player Component with retry fallback
function AudioPlayer({ 
    audioUrl, 
    title,
    onRetry,
}: { 
    audioUrl: string; 
    title?: string;
    onRetry?: () => void;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 2;

    // Reset state when audioUrl changes
    useEffect(() => {
        setError(null);
        setIsLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setRetryCount(0);
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, [audioUrl]);

    const handleRetry = () => {
        if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            setError(null);
            setIsLoading(true);
            // Force reload by updating the audio src
            if (audioRef.current) {
                audioRef.current.load();
            }
        } else if (onRetry) {
            // Call parent retry handler for alternative fetch method
            setRetryCount(0);
            onRetry();
        }
    };

    const togglePlay = () => {
        if (audioRef.current && !error) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(err => {
                    setError('Failed to play audio');
                    console.error('Audio play error:', err);
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setIsLoading(false);
            setError(null);
            setRetryCount(0);
        }
    };

    const handleError = () => {
        // Auto-retry on first few failures
        if (retryCount < maxRetries) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                if (audioRef.current) {
                    audioRef.current.load();
                }
            }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
            setError('Audio not available or failed to load');
            setIsLoading(false);
        }
    };

    const handleCanPlay = () => {
        setIsLoading(false);
        setError(null);
    };

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.volume = value[0];
            setVolume(value[0]);
        }
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="bg-destructive/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-destructive">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleRetry}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        {retryCount >= maxRetries ? 'Try Alternative' : 'Retry'}
                    </Button>
                </div>
                {retryCount > 0 && retryCount < maxRetries && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Retry attempt {retryCount}/{maxRetries}...
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onError={handleError}
                onCanPlay={handleCanPlay}
                preload="metadata"
            />
            {title && (
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{title}</p>
                    {isLoading && retryCount > 0 && (
                        <span className="text-xs text-muted-foreground">Retrying ({retryCount}/{maxRetries})...</span>
                    )}
                </div>
            )}
            <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" onClick={togglePlay} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                </Button>
                <div className="flex-1 space-y-1">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                        disabled={isLoading}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{isLoading ? '--:--' : formatTime(duration)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-24">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <Slider
                        value={[volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                    />
                </div>
                <Button size="icon" variant="ghost" asChild disabled={isLoading}>
                    <a href={audioUrl} download>
                        <Download className="h-4 w-4" />
                    </a>
                </Button>
            </div>
        </div>
    );
}

// Conversation Detail Dialog
function ConversationDetailDialog({
    conversation,
    onClose,
    onFeedback,
    audioUrl,
    onLoadAudio,
    loadingAudio,
    onRetryAudio,
}: {
    conversation: ElevenLabsConversationDetail | null;
    onClose: () => void;
    onFeedback: (id: string, feedback: 'like' | 'dislike') => void;
    audioUrl?: string;
    onLoadAudio?: () => void;
    loadingAudio?: boolean;
    onRetryAudio?: () => void;
}) {
    if (!conversation) return null;

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const phoneDetails = conversation.metadata?.phone_call_details;
    const dynamicVars = conversation.conversation_initiation_client_data?.dynamic_variables;

    return (
        <Dialog open={!!conversation} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Conversation Details</DialogTitle>
                            <DialogDescription>
                                Duration: {formatDuration(conversation.metadata.call_duration_secs)} • 
                                Status: {conversation.status} •
                                {new Date(conversation.metadata.start_time_unix_secs * 1000).toLocaleString()}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onFeedback(conversation.conversation_id, 'like')}>
                                <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onFeedback(conversation.conversation_id, 'dislike')}>
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-4">
                    {/* Phone Details */}
                    {(phoneDetails || dynamicVars) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Call Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {phoneDetails?.from_number && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">From:</span>
                                        <span className="font-mono">{phoneDetails.from_number}</span>
                                    </div>
                                )}
                                {phoneDetails?.to_number && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">To:</span>
                                        <span className="font-mono">{phoneDetails.to_number}</span>
                                    </div>
                                )}
                                {dynamicVars && Object.keys(dynamicVars).length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">User Info:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(dynamicVars).map(([key, value]) => (
                                                <Badge key={key} variant="outline" className="text-xs">
                                                    {key}: {value}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Audio Player */}
                    {audioUrl ? (
                        <AudioPlayer 
                            key={audioUrl}
                            audioUrl={audioUrl} 
                            title="Call Recording" 
                            onRetry={onRetryAudio}
                        />
                    ) : onLoadAudio ? (
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {conversation.has_audio ? 'Call recording available' : 'Try loading call recording'}
                                    </span>
                                </div>
                                <Button size="sm" variant="outline" onClick={onLoadAudio} disabled={loadingAudio}>
                                    {loadingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                    Load Recording
                                </Button>
                            </div>
                        </Card>
                    ) : null}

                    {/* Summary */}
                    {conversation.analysis?.transcript_summary && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{conversation.analysis.transcript_summary}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Call Outcome */}
                    <div className="flex gap-2">
                        <Badge variant={conversation.analysis?.call_successful === 'success' ? 'default' : 'destructive'}>
                            Call: {conversation.analysis?.call_successful || 'unknown'}
                        </Badge>
                        {conversation.feedback && (
                            <Badge variant="outline">
                                Feedback: {conversation.feedback.score}
                            </Badge>
                        )}
                    </div>

                    {/* Transcript */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Transcript ({conversation.transcript.length} messages)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-3">
                                    {conversation.transcript.map((item, i) => (
                                        <div key={i} className={`flex gap-3 ${item.role === 'agent' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.role === 'agent' ? 'bg-primary/10' : 'bg-muted'}`}>
                                                {item.role === 'agent' ? <Mic className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                                            </div>
                                            <div className={`flex-1 ${item.role === 'agent' ? 'text-right' : ''}`}>
                                                <div className={`inline-block p-3 rounded-lg max-w-[85%] ${item.role === 'agent' ? 'bg-primary/10' : 'bg-muted'}`}>
                                                    <p className="text-sm">{item.message}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{formatDuration(item.time_in_call_secs)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function ConversationsPage() {
    // Main tab selection
    const [mainTab, setMainTab] = useState<'dashboard' | 'conversations'>('dashboard');
    
    // Provider selection
    const [provider, setProvider] = useState<'elevenlabs' | 'twilio'>('elevenlabs');
    
    // ElevenLabs state
    const [elConversations, setElConversations] = useState<ElevenLabsConversation[]>([]);
    const [selectedElConversation, setSelectedElConversation] = useState<ElevenLabsConversationDetail | null>(null);
    const [elAudioUrl, setElAudioUrl] = useState<string | undefined>();
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [elConnectionKey, setElConnectionKey] = useState('');
    const [elApiKey, setElApiKey] = useState(''); // Direct ElevenLabs API key
    const [elFilter, setElFilter] = useState<'all' | 'success' | 'failure'>('all');
    const [elAgents, setElAgents] = useState<ElevenLabsAgent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
    
    // Helper to clean up blob URLs to prevent memory leaks
    const cleanupAudioUrl = useCallback(() => {
        if (elAudioUrl && elAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(elAudioUrl);
        }
    }, [elAudioUrl]);
    
    // Twilio state
    const [twilioConversations, setTwilioConversations] = useState<TwilioConversation[]>([]);
    const [selectedTwilioConv, setSelectedTwilioConv] = useState<TwilioConversation | null>(null);
    const [twilioMessages, setTwilioMessages] = useState<TwilioMessage[]>([]);
    const [twilioTranscriptions, setTwilioTranscriptions] = useState<TwilioTranscription[]>([]);
    const [twilioConnectionKey, setTwilioConnectionKey] = useState('');

    // Shared state
    const [picaSecretKey, setPicaSecretKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isElConnected, setIsElConnected] = useState(false);
    const [isTwilioConnected, setIsTwilioConnected] = useState(false);
    
    // Twilio query state
    const [serviceSid, setServiceSid] = useState('');
    const [channelSid, setChannelSid] = useState('');
    const [accountSid, setAccountSid] = useState('');
    const [recordingSid, setRecordingSid] = useState('');

    // Load saved config
    useEffect(() => {
        const savedSecret = localStorage.getItem('pica_secret_key');
        const savedElConnection = localStorage.getItem('pica_elevenlabs_connection_key');
        const savedTwilioConnection = localStorage.getItem('pica_twilio_connection_key');
        const savedElApiKey = localStorage.getItem('elevenlabs_api_key');
        const savedAgentId = localStorage.getItem('elevenlabs_selected_agent');
        
        if (savedSecret) setPicaSecretKey(savedSecret);
        if (savedElApiKey) {
            setElApiKey(savedElApiKey);
            setIsElConnected(true);
        }
        if (savedElConnection) {
            setElConnectionKey(savedElConnection);
            setIsElConnected(true);
        }
        if (savedTwilioConnection) {
            setTwilioConnectionKey(savedTwilioConnection);
            setIsTwilioConnected(true);
        }
        if (savedAgentId) {
            setSelectedAgentId(savedAgentId);
        }
    }, []);

    const saveConfig = () => {
        localStorage.setItem('pica_secret_key', picaSecretKey);
        if (elApiKey) {
            localStorage.setItem('elevenlabs_api_key', elApiKey);
            setIsElConnected(true);
        }
        if (elConnectionKey) {
            localStorage.setItem('pica_elevenlabs_connection_key', elConnectionKey);
            setIsElConnected(true);
        }
        if (twilioConnectionKey) {
            localStorage.setItem('pica_twilio_connection_key', twilioConnectionKey);
            setIsTwilioConnected(true);
        }
        setIsConfigOpen(false);
        toast.success('Credentials saved');
    };

    const testElevenLabsConnection = async () => {
        // Check if we have direct API key or Pica keys
        const hasDirect = !!elApiKey;
        const hasPica = picaSecretKey && elConnectionKey;
        
        if (!hasDirect && !hasPica) {
            toast.error('Please enter ElevenLabs API Key or Pica credentials');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/elevenlabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'test', 
                    secretKey: picaSecretKey, 
                    connectionKey: elConnectionKey,
                    elevenLabsApiKey: elApiKey,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`ElevenLabs connection successful! (${data.method})`);
                saveConfig();
            } else {
                toast.error(data.error || 'Connection failed');
            }
        } catch (error) {
            toast.error('Failed to test connection');
        } finally {
            setLoading(false);
        }
    };

    const testTwilioConnection = async () => {
        if (!picaSecretKey || !twilioConnectionKey) {
            toast.error('Please enter Pica Secret Key and Twilio Connection Key');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/twilio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey: picaSecretKey, connectionKey: twilioConnectionKey }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Twilio connection successful!');
                saveConfig();
            } else {
                toast.error(data.error || 'Connection failed');
            }
        } catch (error) {
            toast.error('Failed to test connection');
        } finally {
            setLoading(false);
        }
    };

    // ElevenLabs functions
    const fetchElAgents = async () => {
        if (!elApiKey) return;
        try {
            const res = await fetch('/api/elevenlabs?action=agents', {
                headers: {
                    'x-elevenlabs-api-key': elApiKey,
                },
            });
            const data = await res.json();
            if (data.agents) {
                setElAgents(data.agents);
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        }
    };

    // Fetch agents when API key is set
    useEffect(() => {
        if (elApiKey && isElConnected) {
            fetchElAgents();
        }
    }, [elApiKey, isElConnected]);

    const fetchElConversations = async () => {
        if (!isElConnected) {
            toast.error('Please configure ElevenLabs credentials first');
            setIsConfigOpen(true);
            return;
        }
        setLoading(true);
        try {
            let url = '/api/elevenlabs?action=conversations&page_size=50';
            if (elFilter !== 'all') {
                url += `&call_successful=${elFilter}`;
            }
            if (selectedAgentId && selectedAgentId !== 'all') {
                url += `&agent_id=${selectedAgentId}`;
            }
            const res = await fetch(url, {
                headers: {
                    'x-pica-secret': picaSecretKey,
                    'x-pica-connection-key': elConnectionKey,
                    'x-elevenlabs-api-key': elApiKey,
                },
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setElConversations(data.conversations || []);
                toast.success(`Loaded ${data.conversations?.length || 0} conversations`);
            }
        } catch (error) {
            toast.error('Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchElConversationDetail = async (conversationId: string) => {
        setLoading(true);
        try {
            // Fetch conversation details
            const res = await fetch(`/api/elevenlabs?action=conversation&id=${conversationId}`, {
                headers: {
                    'x-pica-secret': picaSecretKey,
                    'x-pica-connection-key': elConnectionKey,
                    'x-elevenlabs-api-key': elApiKey,
                },
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setSelectedElConversation(data);
                // Audio URL will be loaded on demand via the "Load Recording" button
            }
        } catch (error) {
            toast.error('Failed to fetch conversation details');
        } finally {
            setLoading(false);
        }
    };

    // Audio fetch method tracking
    const [audioFetchMethod, setAudioFetchMethod] = useState<'proxy' | 'blob'>('proxy');

    const loadElAudio = async (useAlternative = false) => {
        if (!selectedElConversation) return;
        if (!elApiKey) {
            toast.error('ElevenLabs API key required for audio playback');
            setIsConfigOpen(true);
            return;
        }
        
        setLoadingAudio(true);
        cleanupAudioUrl();
        setElAudioUrl(undefined);
        
        const conversationId = selectedElConversation.conversation_id;
        
        // Debug logging
        console.log('[Audio Load] Starting audio load:', {
            conversationId,
            selectedAgentId,
            hasApiKey: !!elApiKey,
            apiKeyLength: elApiKey?.length,
        });
        
        try {
            const url = `/api/elevenlabs?action=audio&id=${conversationId}&apiKey=${encodeURIComponent(elApiKey)}&t=${Date.now()}`;
            console.log('[Audio Load] Fetching from:', url);
            
            const response = await fetch(url);
            
            console.log('[Audio Load] Response:', {
                status: response.status,
                contentType: response.headers.get('content-type'),
            });
            
            const contentType = response.headers.get('content-type') || '';
            
            if (!response.ok || contentType.includes('application/json')) {
                let errorMsg = 'Audio not available';
                try {
                    const errorData = await response.json();
                    console.log('[Audio Load] Error response:', errorData);
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    // Ignore parse error
                }
                throw new Error(errorMsg);
            }
            
            const audioData = await response.arrayBuffer();
            console.log('[Audio Load] Got audio data:', audioData.byteLength, 'bytes');
            
            if (audioData.byteLength === 0) {
                throw new Error('Audio file is empty');
            }
            
            let mimeType = contentType || 'audio/mpeg';
            if (!mimeType.startsWith('audio/')) {
                mimeType = 'audio/mpeg';
            }
            
            const blob = new Blob([audioData], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            setElAudioUrl(blobUrl);
            setAudioFetchMethod('blob');
            toast.success('Audio loaded successfully');
        } catch (error) {
            console.error('Audio load error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to load audio';
            toast.error(errorMsg);
            setElAudioUrl(undefined);
        } finally {
            setLoadingAudio(false);
        }
    };

    const retryAudioWithAlternative = () => {
        setElAudioUrl(undefined);
        loadElAudio(true);
    };

    const sendFeedback = async (conversationId: string, feedback: 'like' | 'dislike') => {
        try {
            const res = await fetch('/api/elevenlabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'feedback',
                    secretKey: picaSecretKey,
                    connectionKey: elConnectionKey,
                    elevenLabsApiKey: elApiKey,
                    conversationId,
                    feedback,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Feedback sent: ${feedback}`);
            } else {
                toast.error(data.error || 'Failed to send feedback');
            }
        } catch (error) {
            toast.error('Failed to send feedback');
        }
    };

    // Twilio functions
    const fetchTwilioConversations = async () => {
        if (!isTwilioConnected) {
            toast.error('Please configure Twilio credentials first');
            setIsConfigOpen(true);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/twilio?action=conversations', {
                headers: {
                    'x-pica-secret': picaSecretKey,
                    'x-pica-connection-key': twilioConnectionKey,
                },
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setTwilioConversations(data.conversations || []);
                toast.success(`Loaded ${data.conversations?.length || 0} conversations`);
            }
        } catch (error) {
            toast.error('Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchTwilioMessages = async (svcSid?: string, chSid?: string) => {
        const svc = svcSid || serviceSid;
        const ch = chSid || channelSid;
        if (!svc || !ch) {
            toast.error('Please enter Service SID and Channel SID');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `/api/twilio?action=messages&serviceSid=${svc}&channelSid=${ch}`,
                {
                    headers: {
                        'x-pica-secret': picaSecretKey,
                        'x-pica-connection-key': twilioConnectionKey,
                    },
                }
            );
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setTwilioMessages(data.messages || []);
                toast.success(`Loaded ${data.messages?.length || 0} messages`);
            }
        } catch (error) {
            toast.error('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchTwilioTranscriptions = async () => {
        if (!accountSid || !recordingSid) {
            toast.error('Please enter Account SID and Recording SID');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `/api/twilio?action=transcriptions&accountSid=${accountSid}&recordingSid=${recordingSid}`,
                {
                    headers: {
                        'x-pica-secret': picaSecretKey,
                        'x-pica-connection-key': twilioConnectionKey,
                    },
                }
            );
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setTwilioTranscriptions(data.transcriptions || []);
                toast.success(`Loaded ${data.transcriptions?.length || 0} transcriptions`);
            }
        } catch (error) {
            toast.error('Failed to fetch transcriptions');
        } finally {
            setLoading(false);
        }
    };

    const selectTwilioConversation = (conv: TwilioConversation) => {
        setSelectedTwilioConv(conv);
        setServiceSid(conv.chat_service_sid);
        setChannelSid(conv.sid);
        fetchTwilioMessages(conv.chat_service_sid, conv.sid);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isConnected = provider === 'elevenlabs' ? isElConnected : isTwilioConnected;

    // Calculate analytics from conversations
    const analytics = useMemo(() => {
        const totalCalls = elConversations.length;
        const successfulCalls = elConversations.filter(c => c.call_successful === 'success').length;
        const failedCalls = elConversations.filter(c => c.call_successful === 'failure').length;
        const unknownCalls = elConversations.filter(c => c.call_successful === 'unknown').length;
        const totalDuration = elConversations.reduce((acc, c) => acc + c.call_duration_secs, 0);
        const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
        const totalMessages = elConversations.reduce((acc, c) => acc + c.message_count, 0);
        const avgMessages = totalCalls > 0 ? totalMessages / totalCalls : 0;
        const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
        
        // Estimated costs (ElevenLabs pricing approximation)
        // ~$0.08 per minute for conversational AI
        const costPerMinute = 0.08;
        const totalCost = (totalDuration / 60) * costPerMinute;
        const avgCost = totalCalls > 0 ? totalCost / totalCalls : 0;
        const totalCredits = Math.round(totalDuration * 10); // Approximate credits
        const avgCredits = totalCalls > 0 ? Math.round(totalCredits / totalCalls) : 0;
        
        // LLM cost estimation (~$0.002 per message)
        const llmCostPerMessage = 0.002;
        const totalLLMCost = totalMessages * llmCostPerMessage;
        const avgLLMCostPerMin = totalDuration > 0 ? totalLLMCost / (totalDuration / 60) : 0;
        
        // Group by agent with more details
        const byAgent = elConversations.reduce((acc, c) => {
            const agentName = c.agent_name || 'Unknown Agent';
            const agentId = c.agent_id;
            if (!acc[agentId]) {
                acc[agentId] = { 
                    name: agentName,
                    total: 0, 
                    success: 0, 
                    failed: 0, 
                    duration: 0,
                    messages: 0,
                };
            }
            acc[agentId].total++;
            if (c.call_successful === 'success') acc[agentId].success++;
            if (c.call_successful === 'failure') acc[agentId].failed++;
            acc[agentId].duration += c.call_duration_secs;
            acc[agentId].messages += c.message_count;
            return acc;
        }, {} as Record<string, { name: string; total: number; success: number; failed: number; duration: number; messages: number }>);

        // Sort agents by call count
        const sortedAgents = Object.entries(byAgent)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 5); // Top 5 agents

        // Group by date (last 30 days for better chart)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split('T')[0];
        });
        
        const byDate = last30Days.map(date => {
            const dayConvs = elConversations.filter(c => {
                const convDate = new Date(c.start_time_unix_secs * 1000).toISOString().split('T')[0];
                return convDate === date;
            });
            const dayDuration = dayConvs.reduce((acc, c) => acc + c.call_duration_secs, 0);
            const daySuccess = dayConvs.filter(c => c.call_successful === 'success').length;
            return {
                date,
                label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                shortLabel: new Date(date).toLocaleDateString('en-US', { day: 'numeric' }),
                total: dayConvs.length,
                success: daySuccess,
                failed: dayConvs.filter(c => c.call_successful === 'failure').length,
                duration: dayDuration,
                successRate: dayConvs.length > 0 ? (daySuccess / dayConvs.length) * 100 : 0,
            };
        });

        // Get date range for display
        const dateRange = {
            start: last30Days[0],
            end: last30Days[last30Days.length - 1],
            startLabel: new Date(last30Days[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            endLabel: new Date(last30Days[last30Days.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };

        // Peak hour analysis
        const byHour = elConversations.reduce((acc, c) => {
            const hour = new Date(c.start_time_unix_secs * 1000).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        
        const peakHour = Object.entries(byHour).sort(([, a], [, b]) => b - a)[0];

        // Twilio analytics
        const twilioTotal = twilioConversations.length;
        const twilioActive = twilioConversations.filter(c => c.state === 'active').length;

        return {
            totalCalls,
            successfulCalls,
            failedCalls,
            unknownCalls,
            totalDuration,
            avgDuration,
            totalMessages,
            avgMessages,
            successRate,
            totalCost,
            avgCost,
            totalCredits,
            avgCredits,
            totalLLMCost,
            avgLLMCostPerMin,
            byAgent,
            sortedAgents,
            byDate,
            dateRange,
            peakHour: peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null,
            twilioTotal,
            twilioActive,
        };
    }, [elConversations, twilioConversations]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conversations</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        View call recordings, transcripts, summaries and message history
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={provider} onValueChange={(v) => setProvider(v as 'elevenlabs' | 'twilio')}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="elevenlabs">
                                <div className="flex items-center gap-2">
                                    <Mic className="h-4 w-4" />
                                    ElevenLabs
                                </div>
                            </SelectItem>
                            <SelectItem value="twilio">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Twilio
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        {isConnected ? 'Connected' : 'Configure'}
                        {isConnected && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
                    </Button>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'dashboard' | 'conversations')}>
                <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                    <TabsTrigger value="dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="conversations">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Conversations
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    {/* Top Stats Row - Like ElevenLabs Dashboard */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0">
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <p className="text-sm text-muted-foreground">Number of calls</p>
                                    <p className="text-2xl font-bold mt-1">{analytics.totalCalls}</p>
                                </div>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <p className="text-sm text-muted-foreground">Average duration</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {Math.floor(analytics.avgDuration / 60)}:{Math.floor(analytics.avgDuration % 60).toString().padStart(2, '0')}
                                    </p>
                                </div>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <p className="text-sm text-muted-foreground">Total cost</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {analytics.totalCredits.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">credits</span>
                                    </p>
                                </div>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <p className="text-sm text-muted-foreground">Average cost</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {analytics.avgCredits}<span className="text-sm font-normal text-muted-foreground ml-1">credits/call</span>
                                    </p>
                                </div>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <p className="text-sm text-muted-foreground">Total LLM cost</p>
                                    <p className="text-2xl font-bold mt-1">${analytics.totalLLMCost.toFixed(3)}</p>
                                </div>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <p className="text-sm text-muted-foreground">Average LLM cost</p>
                                    <p className="text-2xl font-bold mt-1">
                                        ${analytics.avgLLMCostPerMin.toFixed(5)}<span className="text-sm font-normal text-muted-foreground ml-1">/min</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Call Volume Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Call Volume</CardTitle>
                                    <CardDescription>{analytics.dateRange.startLabel} - {analytics.dateRange.endLabel}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setMainTab('conversations')}>
                                    View calls <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Simple Line Chart Visualization */}
                            <div className="h-[200px] flex items-end gap-1 pt-4">
                                {analytics.byDate.slice(-14).map((day, i) => {
                                    const maxCalls = Math.max(...analytics.byDate.map(d => d.total), 1);
                                    const height = (day.total / maxCalls) * 100;
                                    return (
                                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div className="w-full relative" style={{ height: '160px' }}>
                                                <div 
                                                    className="absolute bottom-0 w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t cursor-pointer"
                                                    style={{ height: `${Math.max(height, 2)}%` }}
                                                >
                                                    <div 
                                                        className="absolute bottom-0 w-full bg-primary rounded-t"
                                                        style={{ height: `${day.total > 0 ? (day.success / day.total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                {/* Tooltip */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md">
                                                    {day.total} calls • {day.success} success
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{i % 2 === 0 ? day.shortLabel : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                                <span>{analytics.dateRange.startLabel}</span>
                                <span>{analytics.dateRange.endLabel}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Success Rate & Most Called Agents Row */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Overall Success Rate */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Overall success rate
                                        <span className="text-muted-foreground cursor-help" title="Percentage of calls marked as successful">ⓘ</span>
                                    </CardTitle>
                                </div>
                                <p className="text-3xl font-bold">{analytics.successRate.toFixed(0)}%</p>
                            </CardHeader>
                            <CardContent>
                                {/* Success Rate Chart */}
                                <div className="h-[150px] flex items-end gap-1">
                                    {analytics.byDate.slice(-14).map((day) => {
                                        return (
                                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                                                <div className="w-full relative" style={{ height: '120px' }}>
                                                    <div 
                                                        className="absolute bottom-0 w-full bg-green-500/80 hover:bg-green-500 transition-colors rounded-t cursor-pointer"
                                                        style={{ height: `${day.successRate}%` }}
                                                    />
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md">
                                                        {day.successRate.toFixed(0)}% success
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Filter</span>
                                        <Badge variant="outline" className="text-xs">Success</Badge>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setMainTab('conversations')}>
                                        View calls <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Most Called Agents */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Most called agents
                                        <span className="text-muted-foreground cursor-help" title="Agents ranked by number of calls">ⓘ</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">Calls</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[180px]">
                                    {analytics.sortedAgents.length > 0 ? (
                                        <div className="space-y-3">
                                            {analytics.sortedAgents.map(([agentId, stats], index) => (
                                                <div key={agentId} className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-muted-foreground w-5">{index + 1}.</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{stats.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{stats.total} calls</span>
                                                            <span>•</span>
                                                            <span className="text-green-600">{stats.success} success</span>
                                                            <span>•</span>
                                                            <span>{Math.floor(stats.duration / stats.total / 60)}:{Math.floor((stats.duration / stats.total) % 60).toString().padStart(2, '0')} avg</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold">{stats.total}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {((stats.success / stats.total) * 100).toFixed(0)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <p className="text-sm">Loading agent data...</p>
                                        </div>
                                    )}
                                </ScrollArea>
                                {analytics.sortedAgents.length > 0 && (
                                    <div className="flex justify-end mt-2">
                                        <Button variant="ghost" size="sm" className="text-xs">
                                            Show all <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Stats Row */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Successful Calls</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <span className="text-2xl font-bold">{analytics.successfulCalls}</span>
                                </div>
                                <Progress value={analytics.successRate} className="mt-2 h-1" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Failed Calls</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                    <span className="text-2xl font-bold">{analytics.failedCalls}</span>
                                </div>
                                <Progress value={analytics.totalCalls > 0 ? (analytics.failedCalls / analytics.totalCalls) * 100 : 0} className="mt-2 h-1 [&>div]:bg-red-500" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Timer className="h-5 w-5 text-blue-500" />
                                    <span className="text-2xl font-bold">
                                        {Math.floor(analytics.totalDuration / 3600)}h {Math.floor((analytics.totalDuration % 3600) / 60)}m
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {analytics.totalMessages.toLocaleString()} messages exchanged
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Peak Hour</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-purple-500" />
                                    <span className="text-2xl font-bold">
                                        {analytics.peakHour ? `${analytics.peakHour.hour}:00` : '--'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {analytics.peakHour ? `${analytics.peakHour.count} calls at peak` : 'No data'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Twilio Stats */}
                    {twilioConversations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Twilio / WhatsApp
                                </CardTitle>
                                <CardDescription>Message conversations from Twilio</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold">{analytics.twilioTotal}</div>
                                        <p className="text-sm text-muted-foreground">Total Conversations</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{analytics.twilioActive}</div>
                                        <p className="text-sm text-muted-foreground">Active</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold">{analytics.twilioTotal - analytics.twilioActive}</div>
                                        <p className="text-sm text-muted-foreground">Closed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => fetchElConversations()} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Refresh ElevenLabs
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchTwilioConversations} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Refresh Twilio
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setMainTab('conversations')}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                View Conversations
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Conversations Tab */}
                <TabsContent value="conversations" className="space-y-4">
                    {/* ElevenLabs Content */}
            {provider === 'elevenlabs' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Select 
                                value={selectedAgentId} 
                                onValueChange={(v) => {
                                    setSelectedAgentId(v);
                                    localStorage.setItem('elevenlabs_selected_agent', v);
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Agents</SelectItem>
                                    {elAgents.map((agent) => (
                                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={elFilter} onValueChange={(v) => setElFilter(v as 'all' | 'success' | 'failure')}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Calls</SelectItem>
                                    <SelectItem value="success">Successful</SelectItem>
                                    <SelectItem value="failure">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                {elConversations.length} conversations
                            </p>
                        </div>
                        <Button onClick={fetchElConversations} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Load Conversations
                        </Button>
                    </div>

                    {elConversations.length === 0 ? (
                        <Card className="p-8">
                            <div className="flex flex-col items-center justify-center text-center">
                                <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                                <h4 className="font-medium">No conversations loaded</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Click "Load Conversations" to fetch voice conversations from ElevenLabs
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {elConversations.map((conv) => (
                                <Card 
                                    key={conv.conversation_id} 
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => fetchElConversationDetail(conv.conversation_id)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Mic className="h-4 w-4 text-primary" />
                                                {conv.agent_name || 'AI Agent'}
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Badge variant={conv.status === 'done' ? 'default' : 'secondary'}>
                                                    {conv.status}
                                                </Badge>
                                                <Badge variant={conv.call_successful === 'success' ? 'default' : 'destructive'}>
                                                    {conv.call_successful}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {formatDuration(conv.call_duration_secs)}
                                            </span>
                                            <span className="flex items-center">
                                                <MessageSquare className="mr-1 h-3 w-3" />
                                                {conv.message_count} messages
                                            </span>
                                            <span className="flex items-center">
                                                <History className="mr-1 h-3 w-3" />
                                                {new Date(conv.start_time_unix_secs * 1000).toLocaleString()}
                                            </span>
                                            <ChevronRight className="h-4 w-4 ml-auto" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Twilio Content */}
            {provider === 'twilio' && (
                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
                        <TabsTrigger value="conversations">
                            <Phone className="mr-2 h-4 w-4" />
                            Conversations
                        </TabsTrigger>
                        <TabsTrigger value="messages">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                        </TabsTrigger>
                        <TabsTrigger value="transcriptions">
                            <FileText className="mr-2 h-4 w-4" />
                            Transcriptions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {twilioConversations.length} Twilio conversations (voice, WhatsApp, SMS)
                            </p>
                            <Button onClick={fetchTwilioConversations} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Load Conversations
                            </Button>
                        </div>

                        {twilioConversations.length === 0 ? (
                            <Card className="p-8">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h4 className="font-medium">No conversations loaded</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Click "Load Conversations" to fetch from Twilio</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {twilioConversations.map((conv) => (
                                    <Card 
                                        key={conv.sid} 
                                        className={`cursor-pointer hover:shadow-md transition-shadow ${selectedTwilioConv?.sid === conv.sid ? 'ring-2 ring-primary' : ''}`}
                                        onClick={() => selectTwilioConversation(conv)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">{conv.friendly_name || conv.unique_name || 'Conversation'}</CardTitle>
                                                <Badge variant={conv.state === 'active' ? 'default' : 'secondary'}>{conv.state}</Badge>
                                            </div>
                                            <CardDescription className="font-mono text-xs">SID: {conv.sid}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {new Date(conv.date_created).toLocaleString()}
                                                </span>
                                                <ChevronRight className="h-4 w-4 ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="messages" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Message History</CardTitle>
                                <CardDescription>
                                    {selectedTwilioConv 
                                        ? `Viewing messages for: ${selectedTwilioConv.friendly_name || selectedTwilioConv.sid}`
                                        : 'Select a conversation or enter SIDs manually'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Chat Service SID</Label>
                                        <Input placeholder="ISxxxxxxxx" value={serviceSid} onChange={(e) => setServiceSid(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Channel/Conversation SID</Label>
                                        <Input placeholder="CHxxxxxxxx" value={channelSid} onChange={(e) => setChannelSid(e.target.value)} />
                                    </div>
                                </div>
                                <Button onClick={() => fetchTwilioMessages()} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Fetch Messages
                                </Button>
                            </CardContent>
                        </Card>
                        
                        {twilioMessages.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">{twilioMessages.length} Messages</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-3">
                                            {twilioMessages.map((msg) => (
                                                <div key={msg.sid} className="flex items-start gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-sm">{msg.from}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(msg.date_created).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="bg-muted p-3 rounded-lg">
                                                            <p className="text-sm">{msg.body}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="transcriptions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Call Transcriptions</CardTitle>
                                <CardDescription>
                                    Enter your Twilio Account SID and Recording SID to fetch call transcriptions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Twilio Account SID</Label>
                                        <Input placeholder="ACxxxxxxxx" value={accountSid} onChange={(e) => setAccountSid(e.target.value)} />
                                        <p className="text-xs text-muted-foreground">Find in Twilio Console → Account Info</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Recording SID</Label>
                                        <Input placeholder="RExxxxxxxx" value={recordingSid} onChange={(e) => setRecordingSid(e.target.value)} />
                                        <p className="text-xs text-muted-foreground">Find in Twilio Console → Monitor → Recordings</p>
                                    </div>
                                </div>
                                <Button onClick={fetchTwilioTranscriptions} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    Fetch Transcriptions
                                </Button>
                            </CardContent>
                        </Card>
                        
                        {twilioTranscriptions.length > 0 && (
                            <div className="space-y-3">
                                {twilioTranscriptions.map((trans) => (
                                    <Card key={trans.sid}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm font-mono">{trans.sid}</CardTitle>
                                                <Badge variant={trans.status === 'completed' ? 'default' : 'secondary'}>{trans.status}</Badge>
                                            </div>
                                            <CardDescription>
                                                Duration: {trans.duration}s • Created: {new Date(trans.date_created).toLocaleString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-muted p-4 rounded-lg">
                                                <p className="text-sm whitespace-pre-wrap">{trans.transcription_text || 'No transcription text available'}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
                </TabsContent>
            </Tabs>

            {/* ElevenLabs Conversation Detail Dialog */}
            <ConversationDetailDialog
                conversation={selectedElConversation}
                onClose={() => {
                    setSelectedElConversation(null);
                    cleanupAudioUrl(); // Revoke blob URL
                    setElAudioUrl(undefined);
                    setAudioFetchMethod('proxy');
                }}
                onFeedback={sendFeedback}
                audioUrl={elAudioUrl}
                onLoadAudio={() => loadElAudio()}
                loadingAudio={loadingAudio}
                onRetryAudio={retryAudioWithAlternative}
            />

            {/* Configuration Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Configure Pica Credentials</DialogTitle>
                        <DialogDescription>
                            Connect to ElevenLabs directly or via Pica passthrough
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="border-b pb-4">
                            <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Mic className="h-4 w-4" /> ElevenLabs (Recommended: Direct API)
                            </p>
                            <div className="space-y-2">
                                <Label>ElevenLabs API Key</Label>
                                <Input 
                                    type="password" 
                                    placeholder="xi-xxxxxxxx (from elevenlabs.io)" 
                                    value={elApiKey} 
                                    onChange={(e) => setElApiKey(e.target.value)} 
                                />
                                <p className="text-xs text-muted-foreground">
                                    Get your API key from{' '}
                                    <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        elevenlabs.io/app/settings/api-keys
                                    </a>
                                </p>
                            </div>
                            <Button className="mt-2" size="sm" variant="outline" onClick={testElevenLabsConnection} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Test ElevenLabs
                            </Button>
                        </div>

                        <div className="border-b pb-4">
                            <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Twilio (via Pica)
                            </p>
                            <div className="space-y-2">
                                <Label>Pica Secret Key</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Your Pica API secret key" 
                                    value={picaSecretKey} 
                                    onChange={(e) => setPicaSecretKey(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2 mt-2">
                                <Label>Twilio Connection Key</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Your Twilio connection key" 
                                    value={twilioConnectionKey} 
                                    onChange={(e) => setTwilioConnectionKey(e.target.value)} 
                                />
                            </div>
                            <Button className="mt-2" size="sm" variant="outline" onClick={testTwilioConnection} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Test Twilio
                            </Button>
                        </div>

                        <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Advanced: ElevenLabs via Pica (optional)
                            </summary>
                            <div className="mt-2 space-y-2">
                                <Label>ElevenLabs Pica Connection Key</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Your ElevenLabs connection key (Pica)" 
                                    value={elConnectionKey} 
                                    onChange={(e) => setElConnectionKey(e.target.value)} 
                                />
                            </div>
                        </details>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
                        <Button onClick={saveConfig}>Save All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
