/**
 * Lead Capture Store
 * Manages leads for callback requests and inquiries
 */

import { Lead, LeadStatus, LeadSource, LeadPriority } from "@/types/booking";

// In-memory store (replace with database in production)
let leads: Lead[] = [];

export async function listLeads(): Promise<Lead[]> {
    return [...leads].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getLead(id: string): Promise<Lead | null> {
    return leads.find(l => l.id === id) || null;
}

export async function createLead(lead: Lead): Promise<Lead> {
    leads.push(lead);
    return lead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    leads[index] = { 
        ...leads[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
    };
    return leads[index];
}

export async function deleteLead(id: string): Promise<boolean> {
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    leads.splice(index, 1);
    return true;
}

export async function getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    return leads.filter(l => l.status === status);
}

export async function getLeadsBySource(source: LeadSource): Promise<Lead[]> {
    return leads.filter(l => l.source === source);
}

export async function getLeadStats(): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
    byPriority: Record<LeadPriority, number>;
}> {
    const stats = {
        total: leads.length,
        byStatus: { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 } as Record<LeadStatus, number>,
        bySource: { website: 0, chatbot: 0, referral: 0, social: 0, other: 0 } as Record<LeadSource, number>,
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 } as Record<LeadPriority, number>,
    };

    for (const lead of leads) {
        stats.byStatus[lead.status]++;
        stats.bySource[lead.source]++;
        stats.byPriority[lead.priority]++;
    }

    return stats;
}
