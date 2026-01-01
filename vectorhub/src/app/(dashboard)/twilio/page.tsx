"use client";

import { useState, useEffect } from "react";
import {
    MessageSquare,
    Phone,
    FileText,
    RefreshCw,
    Settings,
    ChevronRight,
    Clock,
    User,
    Search,
    Key,
    CheckCircle,
    XCircle,
    Loader2,
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
    TwilioConversation,
    TwilioMessage,
    TwilioTranscription,
} from "@/lib/twilio/pica-client";

export default function TwilioPage() {
    // State
    const [conversations, setConversations] = useState<TwilioConversation[]>([]);
    const [messages, setMessages] = useState<TwilioMessage[]>([]);
    const [transcriptions, setTranscriptions] = useState<TwilioTranscription[]>([]);
    const [loading, setLoading] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    // Config state
    const [picaSecretKey, setPicaSecretKey] = useState('');
    const [picaConnectionKey, setPicaConnectionKey] = useState('');
    
    // Query state for messages
    const [serviceSid, setServiceSid] = useState('');
    const [channelSid, setChannelSid] = useState('');
    
    // Query state for transcriptions
    const [accountSid, setAccountSid] = useState('');
    const [recordingSid, setRecordingSid] = useState('');

    // Selected conversation for viewing messages
    const [selectedConversation, setSelectedConversation] = useState<TwilioConversation | null>(null);

    // Load saved config
    useEffect(() => {
        const savedSecret = localStorage.getItem('pica_secret_key');
        const savedConnection = localStorage.getItem('pica_connection_key');
        if (savedSecret) setPicaSecretKey(savedSecret);
        if (savedConnection) setPicaConnectionKey(savedConnection);
        if (savedSecret && savedConnection) {
            setIsConnected(true);
        }
    }, []);

    const saveConfig = () => {
        localStorage.setItem('pica_secret_key', picaSecretKey);
        localStorage.setItem('pica_connection_key', picaConnectionKey);
        setIsConnected(true);
        setIsConfigOpen(false);
        toast.success('Pica credentials saved');
    };

    const testConnection = async () => {
        if (!picaSecretKey || !picaConnectionKey) {
            toast.error('Please enter both keys');
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch('/api/twilio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secretKey: picaSecretKey,
                    connectionKey: picaConnectionKey,
                }),
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('Connection successful!');
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

    const fetchConversations = async () => {
        if (!isConnected) {
            toast.error('Please configure Pica credentials first');
            setIsConfigOpen(true);
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch('/api/twilio?action=conversations', {
                headers: {
                    'x-pica-secret': picaSecretKey,
                    'x-pica-connection-key': picaConnectionKey,
                },
            });
            const data = await res.json();
            
            if (data.error) {
                toast.error(data.error);
            } else {
                setConversations(data.conversations || []);
                toast.success(`Loaded ${data.conversations?.length || 0} conversations`);
            }
        } catch (error) {
            toast.error('Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
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
                        'x-pica-connection-key': picaConnectionKey,
                    },
                }
            );
            const data = await res.json();
            
            if (data.error) {
                toast.error(data.error);
            } else {
                setMessages(data.messages || []);
                toast.success(`Loaded ${data.messages?.length || 0} messages`);
            }
        } catch (error) {
            toast.error('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchTranscriptions = async () => {
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
                        'x-pica-connection-key': picaConnectionKey,
                    },
                }
            );
            const data = await res.json();
            
            if (data.error) {
                toast.error(data.error);
            } else {
                setTranscriptions(data.transcriptions || []);
                toast.success(`Loaded ${data.transcriptions?.length || 0} transcriptions`);
            }
        } catch (error) {
            toast.error('Failed to fetch transcriptions');
        } finally {
            setLoading(false);
        }
    };

    const handleConversationClick = (conv: TwilioConversation) => {
        setSelectedConversation(conv);
        // Auto-fill service and channel SIDs
        setServiceSid(conv.chat_service_sid);
        setChannelSid(conv.sid);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Twilio Integration</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Access Twilio conversations, messages, and transcriptions via Pica Passthrough
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        {isConnected ? 'Connected' : 'Configure'}
                        {isConnected && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="conversations">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Conversations
                    </TabsTrigger>
                    <TabsTrigger value="messages">
                        <Phone className="mr-2 h-4 w-4" />
                        Messages
                    </TabsTrigger>
                    <TabsTrigger value="transcriptions">
                        <FileText className="mr-2 h-4 w-4" />
                        Transcriptions
                    </TabsTrigger>
                </TabsList>

                {/* Conversations Tab */}
                <TabsContent value="conversations" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            View all Twilio conversations (voice calls, WhatsApp, SMS)
                        </p>
                        <Button onClick={fetchConversations} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Load Conversations
                        </Button>
                    </div>

                    {conversations.length === 0 ? (
                        <Card className="p-8">
                            <div className="flex flex-col items-center justify-center text-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                                <h4 className="font-medium">No conversations loaded</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Click "Load Conversations" to fetch from Twilio
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {conversations.map((conv) => (
                                <Card 
                                    key={conv.sid} 
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleConversationClick(conv)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">
                                                {conv.friendly_name || conv.unique_name || conv.sid}
                                            </CardTitle>
                                            <Badge variant={conv.state === 'active' ? 'default' : 'secondary'}>
                                                {conv.state}
                                            </Badge>
                                        </div>
                                        <CardDescription className="font-mono text-xs">
                                            SID: {conv.sid}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {new Date(conv.date_created).toLocaleDateString()}
                                            </span>
                                            <ChevronRight className="h-4 w-4 ml-auto" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Fetch Channel Messages</CardTitle>
                            <CardDescription>
                                Enter the Twilio Chat Service SID and Channel SID to load messages
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Chat Service SID</Label>
                                    <Input
                                        placeholder="ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={serviceSid}
                                        onChange={(e) => setServiceSid(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Starts with IS, from Twilio Conversations
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Channel/Conversation SID</Label>
                                    <Input
                                        placeholder="CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={channelSid}
                                        onChange={(e) => setChannelSid(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Starts with CH, or use conversation SID
                                    </p>
                                </div>
                            </div>
                            <Button onClick={fetchMessages} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                Fetch Messages
                            </Button>
                        </CardContent>
                    </Card>

                    {messages.length > 0 && (
                        <div className="space-y-3">
                            {messages.map((msg) => (
                                <Card key={msg.sid}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">{msg.from}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(msg.date_created).toLocaleString()}
                                                    </span>
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

                {/* Transcriptions Tab */}
                <TabsContent value="transcriptions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Fetch Call Transcriptions</CardTitle>
                            <CardDescription>
                                Enter the Twilio Account SID and Recording SID to load transcriptions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Twilio Account SID</Label>
                                    <Input
                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={accountSid}
                                        onChange={(e) => setAccountSid(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Found in your Twilio Console dashboard
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Twilio Recording SID</Label>
                                    <Input
                                        placeholder="RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={recordingSid}
                                        onChange={(e) => setRecordingSid(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Starts with RE, from call recordings
                                    </p>
                                </div>
                            </div>
                            <Button onClick={fetchTranscriptions} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                Fetch Transcriptions
                            </Button>
                        </CardContent>
                    </Card>

                    {transcriptions.length > 0 && (
                        <div className="space-y-3">
                            {transcriptions.map((trans) => (
                                <Card key={trans.sid}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-mono">
                                                {trans.sid}
                                            </CardTitle>
                                            <Badge variant={trans.status === 'completed' ? 'default' : 'secondary'}>
                                                {trans.status}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            Duration: {trans.duration}s • {new Date(trans.date_created).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm bg-muted p-3 rounded-lg">
                                            {trans.transcription_text || 'No transcription text available'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Configuration Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure Pica Credentials</DialogTitle>
                        <DialogDescription>
                            Enter your Pica API credentials to connect to Twilio via Passthrough.
                            Get these from <a href="https://picaos.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">picaos.com</a>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Pica Secret Key</Label>
                            <Input
                                type="password"
                                placeholder="Your Pica API secret key"
                                value={picaSecretKey}
                                onChange={(e) => setPicaSecretKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Found in your Pica dashboard under API Keys
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Pica Twilio Connection Key</Label>
                            <Input
                                type="password"
                                placeholder="Your Twilio connection key from Pica"
                                value={picaConnectionKey}
                                onChange={(e) => setPicaConnectionKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Created when you connect Twilio in Pica
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={testConnection} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Test & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
