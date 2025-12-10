import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Terminal,
    Database,
    Brain,
    ChevronDown,
    ChevronRight,
    Clock,
    Box,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ExecutionStep {
    type: "tool_call" | "tool_result" | "retrieval" | "thought";
    content: string;
    details?: any;
    timestamp: string;
}

interface ThinkingProcessProps {
    steps: ExecutionStep[];
    isExpanded?: boolean;
}

export function ThinkingProcess({ steps, isExpanded = false }: ThinkingProcessProps) {
    const [expanded, setExpanded] = useState(isExpanded);

    if (!steps || steps.length === 0) return null;

    return (
        <div className="mt-2 mb-4 w-full max-w-full">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <Brain className="h-4 w-4" />
                <span>Thinking Process ({steps.length} steps)</span>
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="bg-muted/30 border-muted p-2 space-y-2">
                            {steps.map((step, idx) => (
                                <StepItem key={`${step.timestamp}-${idx}`} step={step} index={idx} />
                            ))}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StepItem({ step, index }: { step: ExecutionStep; index: number }) {
    const [showDetails, setShowDetails] = useState(false);

    const getIcon = () => {
        switch (step.type) {
            case "tool_call": return <Terminal className="h-3 w-3 text-blue-500" />;
            case "tool_result": return <Box className="h-3 w-3 text-green-500" />;
            case "retrieval": return <Database className="h-3 w-3 text-purple-500" />;
            case "thought": return <Brain className="h-3 w-3 text-amber-500" />;
            default: return <Check className="h-3 w-3" />;
        }
    };

    const getLabel = () => {
        switch (step.type) {
            case "tool_call": return "Tool Call";
            case "tool_result": return "Result";
            case "retrieval": return "Context";
            case "thought": return "Thought";
            default: return "Step";
        }
    };

    const hasDetails = step.details && Object.keys(step.details).length > 0;

    return (
        <div className="text-xs border-l-2 border-border pl-3 ml-1 py-1 relative">
            <div
                className={cn(
                    "flex items-start gap-2 cursor-pointer group",
                    !hasDetails && "cursor-default"
                )}
                onClick={() => hasDetails && setShowDetails(!showDetails)}
            >
                <div className="absolute -left-[5px] top-1.5 bg-background rounded-full p-[2px] border border-border">
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] px-1 h-4 font-normal uppercase tracking-wider opacity-70">
                            {getLabel()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                            <Clock className="h-2 w-2" />
                            {new Date(step.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(' ')[0]}
                        </span>
                    </div>

                    <p className="text-foreground/90 font-mono text-[11px] break-words whitespace-pre-wrap leading-relaxed">
                        {step.content}
                    </p>

                    {hasDetails && (
                        <div className="mt-1">
                            {showDetails ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                                <span className="text-[10px] text-primary underline opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Details
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showDetails && hasDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 bg-background/50 rounded p-2 text-[10px] font-mono border border-border/50 overflow-x-auto">
                            <pre>{JSON.stringify(step.details, null, 2)}</pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
