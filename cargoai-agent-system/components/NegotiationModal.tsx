import React, { useState, useEffect, useRef } from 'react';
import { Load } from '../types';
import { geminiLiveService } from '../services/geminiLiveService';
import { VoiceVisualizer } from './VoiceVisualizer';
import { X, Mic, MicOff, PhoneOff, DollarSign, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface NegotiationModalProps {
  load: Load;
  onClose: () => void;
  dispatcherSettings: any;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({ load, onClose, dispatcherSettings }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<{ text: string, isUser: boolean }[]>([]);
  const [livePrice, setLivePrice] = useState<number>(load.price);
  const [negotiationStatus, setNegotiationStatus] = useState<string>('negotiating');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Event Handlers for Service Events
    const handleStarted = (e: Event) => {
        console.log("Negotiation Started", (e as CustomEvent).detail);
    };

    const handleEnded = (e: Event) => {
        console.log("Negotiation Ended", (e as CustomEvent).detail);
        setIsConnected(false);
    };

    const handlePriceUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        console.log("Price Update:", detail);
        if (detail.price !== undefined) setLivePrice(detail.price);
        if (detail.status) setNegotiationStatus(detail.status);
    };

    geminiLiveService.addEventListener('negotiationStarted', handleStarted);
    geminiLiveService.addEventListener('negotiationEnded', handleEnded);
    geminiLiveService.addEventListener('priceUpdate', handlePriceUpdate);

    // Auto-connect when modal opens
    connectToAgent();

    return () => {
      geminiLiveService.removeEventListener('negotiationStarted', handleStarted);
      geminiLiveService.removeEventListener('negotiationEnded', handleEnded);
      geminiLiveService.removeEventListener('priceUpdate', handlePriceUpdate);
      geminiLiveService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const connectToAgent = async () => {
    setError(null);
    try {
      const systemInstruction = `
        You are an aggressive but professional logistics negotiator named "Alex". 
        You represent a trucking company. You are calling a broker named ${load.brokerName} regarding a load from ${load.origin} to ${load.destination}.
        
        Details:
        - Current Offer: $${load.price}
        - Our Target: $${load.targetPrice}
        - Our Floor (Walk away): $${load.minPrice}
        - Equipment: ${load.equipment}
        - Distance: ${load.distance} miles

        Goal: Negotiate the price up. Start by expressing interest but mentioning the rate is a bit tight for the current market. 
        Aim for $${load.targetPrice}. Do not go below $${load.minPrice}.
        
        STRATEGY & RESILIENCE:
        - If the broker rejects your offer, DO NOT set status to 'rejected' and DO NOT say goodbye.
        - Instead, PIVOT immediately to value propositions: mention 24/7 tracking, reliable driver, and insurance.
        - Then, propose a slightly lower counter-offer (closer to their number but still above floor).
        - Keep the status as 'negotiating'.
        
        CLOSING RULES:
        - Only set status to 'walk_away' if the broker explicitly states they have no more room AND the price is below our floor ($${load.minPrice}).
        - If the price is above $${load.minPrice} and the broker won't budge further, ACCEPT the load (set status to 'agreed'). Do not lose a profitable load by being too greedy.
        
        Be concise. Negotiation style: ${dispatcherSettings.negotiationAggressiveness}.

        IMPORTANT: You have a tool called 'update_negotiation_state'. 
        You MUST call this tool whenever:
        1. You propose a new price.
        2. The broker proposes a new price that you acknowledge.
        3. A deal is reached (set status to 'agreed').
        4. The negotiation fails (set status to 'rejected' or 'walk_away').
      `;

      await geminiLiveService.connect(
        {
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          systemInstruction: systemInstruction,
          voiceName: 'Puck'
        },
        (text, isUser) => {
          setTranscripts(prev => [...prev, { text, isUser }]);
        }
      );
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect", error);
      setError("Failed to connect to voice agent. Please check microphone permissions and try again.");
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
      await geminiLiveService.disconnect();
      setIsConnected(false);
      onClose();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'agreed': return { color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50', icon: <CheckCircle className="w-5 h-5" />, label: 'Deal Agreed' };
      case 'walk_away': return { color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', icon: <XCircle className="w-5 h-5" />, label: 'Walk Away' };
      case 'rejected': return { color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', icon: <XCircle className="w-5 h-5" />, label: 'Rejected' };
      default: return { color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50', icon: <Activity className="w-5 h-5 animate-pulse" />, label: 'Negotiating' };
    }
  };

  const statusConfig = getStatusConfig(negotiationStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-slate-700">
        
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
               AI Negotiator <span className="text-xs font-normal text-slate-400 bg-slate-700 px-2 py-0.5 rounded">Active</span>
            </h2>
            <div className="text-xs text-slate-400">Target: ${load.targetPrice} • Floor: ${load.minPrice}</div>
          </div>
          <button onClick={handleDisconnect} className="text-slate-400 hover:text-white p-2">
            <X size={20} />
          </button>
        </div>

        {/* Live Status & Price Board */}
        <div className="p-6 bg-slate-900 flex flex-col items-center justify-center border-b border-slate-800 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute inset-0 opacity-10 ${negotiationStatus === 'agreed' ? 'bg-emerald-500' : negotiationStatus === 'walk_away' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4 backdrop-blur-md ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                {statusConfig.icon}
                <span className="font-semibold text-sm uppercase tracking-wide">{statusConfig.label}</span>
            </div>

            <div className="text-center z-10">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Current Offer</div>
                <div className={`text-5xl font-bold font-mono tracking-tight flex items-center justify-center ${statusConfig.color}`}>
                    <span className="text-2xl mr-1 text-slate-500">$</span>
                    {livePrice}
                </div>
            </div>
        </div>

        {/* Visualizer & Error */}
        <div className="px-6 py-4 bg-slate-900">
            {error ? (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : (
                <VoiceVisualizer isActive={isConnected && negotiationStatus === 'negotiating'} />
            )}
        </div>

        {/* Live Transcript */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50" ref={scrollRef}>
          {transcripts.length === 0 && !error && (
            <div className="text-center text-slate-600 italic text-sm mt-10">
                AI is connecting to broker...
            </div>
          )}
          {transcripts.map((t, i) => (
            <div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                t.isUser 
                  ? 'bg-slate-700 text-slate-200 rounded-br-none' 
                  : 'bg-blue-600 text-white rounded-bl-none shadow-lg'
              }`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-center items-center gap-6">
             <button 
                onClick={handleDisconnect}
                className="flex flex-col items-center justify-center gap-1 group"
             >
                <div className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg group-hover:scale-105">
                    <PhoneOff size={24} />
                </div>
                <span className="text-xs text-slate-400 font-medium">End Call</span>
             </button>
        </div>

      </div>
    </div>
  );
};
