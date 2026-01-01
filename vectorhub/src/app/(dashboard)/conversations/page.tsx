"use client";

import { useState, useEffect } from "react";
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
    Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { TwilioConversation, TwilioMessage, TwilioTranscription } from "@/lib/twilio/pica-client";
import { ElevenLabsConversation, ElevenLabsConversationDetail } from "@/lib/elevenlabs/pica-client";

export default function ConversationsPage() {
    // Provider selection
    const [provider, setProvider] = useState<'elevenlabs' | 'twilio'>('elevenlabs');
    
    // ElevenLabs state
    const [elConversations, setElConversations] = useState<ElevenLabsConversation[]>([]);
    const [selectedElConversation, setSelectedElConversation] = useState<ElevenLabsConversationDetail | null>(null);
    const [elConnectionKey, setElConnectionKey] = useState('');
    
    // Twilio state
    const [twilioConversations, setTwilioConversations] = useState<TwilioConversation[]>([]);
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
        
        if (savedSecret) setPicaSecretKey(savedSecret);
        if (savedElConnection) {
            setElConnectionKey(savedElConnection);
            setIsElConnected(true);
        }
        if (savedTwilioConnection) {
            setTwilioConnectionKey(savedTwilioConnection);
            setIsTwilioConnected(true);
        }
    }, []);

    const saveConfig = () => {
        localStorage.setItem('pica_secret_key', picaSecretKey);
        if (elConnectionKey) {
            localStorage.setItem('pica_elevenlabs_connection_key', elConnectionKey);
            setIsElConnected(true);
        }
        if (twilioConnectionKey) {
            localStorage.setItem('pica_twilio_connection_key', twilioConnectionKey);
            setIsTwilioConnected(true);
        }
        setIsConfigOpen(false);
        toast.success('Pica credentials saved');
    };

    const testElevenLabsConnection = async () => {
        if (!picaSecretKey || !elConnectionKey) {
            toast.error('Please enter Pica Secret Key and ElevenLabs Connection Key');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/elevenlabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test', secretKey: picaSecretKey, connectionKey: elConnectionKey }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('ElevenLabs connection successful!');
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
    const fetchElConversations = async () => {
        if (!isElConnected) {
            toast.error('Please configure ElevenLabs credentials first');
            setIsConfigOpen(true);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/elevenlabs?action=conversations', {
                headers: {
                    'x-pica-secret': picaSecretKey,
                    'x-pica-connection-key': elConnectionKey,
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
            const res = await fetch(`/api/elevenlabs?action=conversation&id=${conversationId}`, {
                headers: {
                    'x-pica-secret': picaSecretKey,
                    'x-pica-connection-key': elConnectionKey,
                },
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setSelectedElConversation(data);
            }
        } catch (error) {
            toast.error('Failed to fetch conversation details');
        } finally {
            setLoading(false);
        }
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

    const fetchTwilioMessages = async () => {
        if (!serviceSid || !channelSid) {
            toast.error('Please enter Service SID and Channel SID');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `/api/twilio?action=messages&serviceSid=${serviceSid}&channelSid=${channelSid}`,
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

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isConnected = provider === 'elevenlabs' ? isElConnected : isTwilioConnected;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conversations</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Access voice and chat conversations via Pica Passthrough
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

            {/* ElevenLabs Content */}
            {provider === 'elevenlabs' && (
                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                        <TabsTrigger value="conversations">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Conversations
                        </TabsTrigger>
                        <TabsTrigger value="transcript">
                            <FileText className="mr-2 h-4 w-4" />
                            Transcript
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                View ElevenLabs voice conversations with transcripts and summaries
                            </p>
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
                                        Click "Load Conversations" to fetch from ElevenLabs
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
                                                <CardTitle className="text-base">{conv.agent_name || 'AI Agent'}</CardTitle>
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
                                                <span>{conv.message_count} messages</span>
                                                <span>{new Date(conv.start_time_unix_secs * 1000).toLocaleDateString()}</span>
                                                <ChevronRight className="h-4 w-4 ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="transcript" className="space-y-4">
                        {selectedElConversation ? (
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Conversation Details</CardTitle>
                                                <CardDescription>
                                                    Duration: {formatDuration(selectedElConversation.metadata.call_duration_secs)} • 
                                                    Status: {selectedElConversation.status}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => sendFeedback(selectedElConversation.conversation_id, 'like')}>
                                                    <ThumbsUp className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => sendFeedback(selectedElConversation.conversation_id, 'dislike')}>
                                                    <ThumbsDown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {selectedElConversation.analysis?.transcript_summary && (
                                        <CardContent>
                                            <div className="bg-muted p-3 rounded-lg">
                                                <p className="text-sm font-medium mb-1">Summary</p>
                                                <p className="text-sm text-muted-foreground">{selectedElConversation.analysis.transcript_summary}</p>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Transcript</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {selectedElConversation.transcript.map((item, i) => (
                                            <div key={i} className={`flex gap-3 ${item.role === 'agent' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${item.role === 'agent' ? 'bg-primary/10' : 'bg-muted'}`}>
                                                    {item.role === 'agent' ? <Mic className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                                                </div>
                                                <div className={`flex-1 ${item.role === 'agent' ? 'text-right' : ''}`}>
                                                    <div className={`inline-block p-3 rounded-lg max-w-[80%] ${item.role === 'agent' ? 'bg-primary/10' : 'bg-muted'}`}>
                                                        <p className="text-sm">{item.message}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{formatDuration(item.time_in_call_secs)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="p-8">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h4 className="font-medium">No conversation selected</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Select a conversation from the list to view its transcript
                                    </p>
                                </div>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* Twilio Content */}
            {provider === 'twilio' && (
                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="conversations">Conversations</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                        <TabsTrigger value="transcriptions">Transcriptions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">View Twilio conversations (voice, WhatsApp, SMS)</p>
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
                                    <Card key={conv.sid} className="cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => { setServiceSid(conv.chat_service_sid); setChannelSid(conv.sid); }}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">{conv.friendly_name || conv.unique_name || conv.sid}</CardTitle>
                                                <Badge variant={conv.state === 'active' ? 'default' : 'secondary'}>{conv.state}</Badge>
                                            </div>
                                            <CardDescription className="font-mono text-xs">SID: {conv.sid}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center"><Clock className="mr-1 h-3 w-3" />{new Date(conv.date_created).toLocaleDateString()}</span>
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
                                <CardTitle className="text-base">Fetch Channel Messages</CardTitle>
                                <CardDescription>Enter the Chat Service SID and Channel SID</CardDescription>
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
                                <Button onClick={fetchTwilioMessages} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Fetch Messages
                                </Button>
                            </CardContent>
                        </Card>
                        {twilioMessages.length > 0 && (
                            <div className="space-y-3">
                                {twilioMessages.map((msg) => (
                                    <Card key={msg.sid}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm">{msg.from}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(msg.date_created).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm">{msg.body}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="transcriptions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Fetch Call Transcriptions</CardTitle>
                                <CardDescription>Enter the Twilio Account SID and Recording SID</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Twilio Account SID</Label>
                                        <Input placeholder="ACxxxxxxxx" value={accountSid} onChange={(e) => setAccountSid(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Recording SID</Label>
                                        <Input placeholder="RExxxxxxxx" value={recordingSid} onChange={(e) => setRecordingSid(e.target.value)} />
                                    </div>
                                </div>
                                <Button onClick={fetchTwilioTranscriptions} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
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
                                            <CardDescription>Duration: {trans.duration}s</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm bg-muted p-3 rounded-lg">{trans.transcription_text || 'No text available'}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* Configuration Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Configure Pica Credentials</DialogTitle>
                        <DialogDescription>
                            Enter your Pica API credentials from <a href="https://picaos.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">picaos.com</a>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Pica Secret Key (shared)</Label>
                            <Input type="password" placeholder="Your Pica API secret key" value={picaSecretKey} onChange={(e) => setPicaSecretKey(e.target.value)} />
                        </div>
                        
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3 flex items-center gap-2"><Mic className="h-4 w-4" /> ElevenLabs Connection</p>
                            <div className="space-y-2">
                                <Label>ElevenLabs Connection Key</Label>
                                <Input type="password" placeholder="Your ElevenLabs connection key" value={elConnectionKey} onChange={(e) => setElConnectionKey(e.target.value)} />
                            </div>
                            <Button className="mt-2" size="sm" variant="outline" onClick={testElevenLabsConnection} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Test ElevenLabs
                            </Button>
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> Twilio Connection</p>
                            <div className="space-y-2">
                                <Label>Twilio Connection Key</Label>
                                <Input type="password" placeholder="Your Twilio connection key" value={twilioConnectionKey} onChange={(e) => setTwilioConnectionKey(e.target.value)} />
                            </div>
                            <Button className="mt-2" size="sm" variant="outline" onClick={testTwilioConnection} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Test Twilio
                            </Button>
                        </div>
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
