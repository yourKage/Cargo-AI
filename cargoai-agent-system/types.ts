export enum LoadStatus {
    PENDING = 'PENDING',
    NEGOTIATING = 'NEGOTIATING',
    BOOKED = 'BOOKED',
    REJECTED = 'REJECTED'
}

export enum MatchScore {
    GREEN = 'GREEN',   // Recommended
    YELLOW = 'YELLOW', // Acceptable
    RED = 'RED'        // Rejected
}

export interface Load {
    id: string;
    origin: string;
    destination: string;
    pickupDate: string;
    equipment: string;
    weight: number;
    price: number; // The broker's posted price
    distance: number;
    brokerName: string;
    brokerRating: number;
    score: MatchScore;
    status: LoadStatus;
    targetPrice: number; // Calculated by our Decision Agent
    minPrice: number;    // Dispatcher threshold
    notes?: string;
}

export interface DispatcherSettings {
    minPricePerMile: number;
    preferredRegions: string[];
    excludedBrokers: string[];
    negotiationAggressiveness: 'Soft' | 'Normal' | 'Aggressive';
    autoReply: boolean;
    voiceAgentEnabled: boolean;
}

export interface NegotiationSession {
    id: string;
    loadId: string;
    startTime: number;
    transcript: { speaker: 'agent' | 'broker'; text: string; timestamp: number }[];
    currentOffer: number;
    status: 'active' | 'completed' | 'failed';
}

// Gemini Live Types
export interface LiveConfig {
    model: string;
    systemInstruction: string;
    voiceName: string;
}
