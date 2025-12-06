import React from 'react';
import { Load, MatchScore, LoadStatus } from '../types';
import { MapPin, DollarSign, Truck, Calendar, PhoneCall, Send, AlertTriangle } from 'lucide-react';

interface LoadCardProps {
  load: Load;
  onNegotiate: (load: Load) => void;
  onSendOffer: (load: Load) => void;
}

const LoadCard: React.FC<LoadCardProps> = ({ load, onNegotiate, onSendOffer }) => {
  const getBorderColor = (score: MatchScore) => {
    switch (score) {
      case MatchScore.GREEN: return 'border-l-emerald-500';
      case MatchScore.YELLOW: return 'border-l-yellow-400';
      case MatchScore.RED: return 'border-l-red-500';
      default: return 'border-l-gray-300';
    }
  };

  const getScoreBadge = (score: MatchScore) => {
     const classes = "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ";
     switch (score) {
       case MatchScore.GREEN: return <span className={classes + "bg-emerald-100 text-emerald-800"}>Recommended</span>;
       case MatchScore.YELLOW: return <span className={classes + "bg-yellow-100 text-yellow-800"}>Acceptable</span>;
       case MatchScore.RED: return <span className={classes + "bg-red-100 text-red-800"}>Rejected</span>;
     }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 p-5 hover:shadow-md transition-shadow ${getBorderColor(load.score)}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-800">{load.origin} <span className="text-gray-400">→</span> {load.destination}</h3>
            {getScoreBadge(load.score)}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span className="flex items-center gap-1"><Truck size={14} /> {load.equipment}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {load.pickupDate}</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">{load.distance} mi</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">${load.price}</div>
          <div className="text-xs text-gray-500">${(load.price / load.distance).toFixed(2)}/mi</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="p-3 bg-slate-50 rounded-md">
            <span className="block text-xs text-gray-400 uppercase">Target Price</span>
            <span className="font-semibold text-emerald-600">${load.targetPrice}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-md">
            <span className="block text-xs text-gray-400 uppercase">Broker</span>
            <span className="font-semibold text-slate-700">{load.brokerName} <span className="text-yellow-500 text-xs">★ {load.brokerRating}</span></span>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => onNegotiate(load)}
          disabled={load.status === LoadStatus.REJECTED}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhoneCall size={16} />
          {load.status === LoadStatus.NEGOTIATING ? 'Resume Call' : 'AI Negotiate'}
        </button>
        <button 
          onClick={() => onSendOffer(load)}
          disabled={load.status === LoadStatus.REJECTED}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 rounded-md font-medium transition-colors"
        >
          <Send size={16} />
          Email Offer
        </button>
      </div>
      
      {load.score === MatchScore.RED && (
        <div className="mt-3 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} /> Below minimum threshold (${load.minPrice})
        </div>
      )}
    </div>
  );
};

export default LoadCard;
