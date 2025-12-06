import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LoadCard from './components/LoadCard';
import { NegotiationModal } from './components/NegotiationModal';
import { ImportModal } from './components/ImportModal';
import { Load, MatchScore, LoadStatus, DispatcherSettings } from './types';
import { LayoutDashboard, Settings, ListFilter, Bell, Plus, Activity, RefreshCw, Upload } from 'lucide-react';
import { apiService } from './services/apiService';

// Default dispatcher ID - in production, this should come from authentication
// For now, you can set it via localStorage or environment variable
const getDefaultDispatcherId = (): string => {
  return '3cec6a34-b018-452e-be22-ed1513267639';
};

const SidebarLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link to={to} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
            {icon}
            {label}
        </Link>
    );
}

function App() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [topLoads, setTopLoads] = useState<Load[]>([]);
  const [activeNegotiation, setActiveNegotiation] = useState<Load | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatcherId] = useState<string>(getDefaultDispatcherId());
  const [showTop5, setShowTop5] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalLoads: 0,
    greenLoads: 0,
    activeNegotiations: 0,
    avgRatePerMile: 0
  });
  const [settings, setSettings] = useState<DispatcherSettings>({
      minPricePerMile: 2.0,
      preferredRegions: ['Midwest', 'South'],
      excludedBrokers: [],
      negotiationAggressiveness: 'Normal',
      autoReply: false,
      voiceAgentEnabled: true
  });

  // Fetch data from backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top 5 loads
      const top5 = await apiService.getTopLoads(dispatcherId, 5);
      setTopLoads(top5);

      // Fetch all loads
      const allLoads = await apiService.getAllLoads(dispatcherId);
      setLoads(allLoads);

      // Calculate stats
      const greenCount = allLoads.filter(l => l.score === MatchScore.GREEN).length;
      const totalRate = allLoads.reduce((sum, l) => sum + (l.price / l.distance), 0);
      const avgRate = allLoads.length > 0 ? totalRate / allLoads.length : 0;

      setStats({
        totalLoads: allLoads.length,
        greenLoads: greenCount,
        activeNegotiations: 0, // TODO: Fetch from negotiation API
        avgRatePerMile: avgRate
      });

      // Load dispatcher config if available
      try {
        const config = await apiService.getDispatcherConfig(dispatcherId);
        if (config) {
          setSettings(prev => ({
            ...prev,
            minPricePerMile: config.minPricePerMile || prev.minPricePerMile,
            negotiationAggressiveness: config.negotiationAggressiveness || prev.negotiationAggressiveness,
          }));
        }
      } catch (err) {
        console.warn('Could not load dispatcher config:', err);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatcherId]);

  const handleNegotiate = (load: Load) => {
      setActiveNegotiation(load);
  };

  const handleSendOffer = (load: Load) => {
      alert(`Offer sent for load ${load.id} via Email/API`);
  };

  const Dashboard = () => (
      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">Total Loads</div>
                  <div className="text-2xl font-bold text-slate-800">{stats.totalLoads}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">Approved (Green)</div>
                  <div className="text-2xl font-bold text-emerald-600">{stats.greenLoads}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">Active Negotiations</div>
                  <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                    {stats.activeNegotiations} {stats.activeNegotiations > 0 && <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full animate-pulse">Live</span>}
                  </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500 mb-1">Avg Rate/Mile</div>
                  <div className="text-2xl font-bold text-slate-800">${stats.avgRatePerMile.toFixed(2)}</div>
              </div>
          </div>

          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                  {showTop5 ? 'Top 5 Recommended Loads' : 'All Filtered Loads'}
              </h2>
              <div className="flex gap-2">
                  <button 
                      onClick={() => setShowTop5(!showTop5)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                  >
                      {showTop5 ? 'Show All' : 'Show Top 5'}
                  </button>
                  <button 
                      onClick={fetchData}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                  >
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                  <button 
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                  >
                      <Upload size={16} /> Import JSON
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                      <ListFilter size={16} /> Filter
                  </button>
              </div>
          </div>

          {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">Error loading data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                      onClick={fetchData}
                      className="mt-2 text-sm underline hover:no-underline"
                  >
                      Try again
                  </button>
              </div>
          )}

          {loading && loads.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={32} className="animate-spin text-emerald-600" />
                      <p className="text-slate-500">Loading loads...</p>
                  </div>
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-4">
                  {(showTop5 ? topLoads : loads).length === 0 ? (
                      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                          <p className="text-slate-500">No loads found. Check your dispatcher ID or backend connection.</p>
                      </div>
                  ) : (
                      (showTop5 ? topLoads : loads).map(load => (
                          <LoadCard 
                            key={load.id} 
                            load={load} 
                            onNegotiate={handleNegotiate}
                            onSendOffer={handleSendOffer}
                          />
                      ))
                  )}
              </div>
          )}
      </div>
  );

  const SettingsPage = () => (
      <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Dispatcher Configuration</h2>
          
          <div className="space-y-6">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Rate Per Mile ($)</label>
                  <input type="number" defaultValue={settings.minPricePerMile} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Voice Agent Aggressiveness</label>
                  <div className="grid grid-cols-3 gap-2">
                      {['Soft', 'Normal', 'Aggressive'].map((level) => (
                          <button 
                            key={level}
                            onClick={() => setSettings({...settings, negotiationAggressiveness: level as any})}
                            className={`py-2 px-4 rounded-lg text-sm font-medium border ${settings.negotiationAggressiveness === level ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}
                          >
                              {level}
                          </button>
                      ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {settings.negotiationAggressiveness === 'Aggressive' ? 'Agent will push hard for higher rates and risk ending calls.' : 'Agent will prioritize securing the load.'}
                  </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                      <div className="font-medium text-slate-800">Auto-Negotiate Green Loads</div>
                      <div className="text-sm text-slate-500">Automatically start negotiation for high-match loads.</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.voiceAgentEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setSettings({...settings, voiceAgentEnabled: !settings.voiceAgentEnabled})}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.voiceAgentEnabled ? 'translate-x-6' : ''}`}></div>
                  </div>
              </div>

              <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                  Save Configuration
              </button>
          </div>
      </div>
  );

  return (
    <Router>
        <div className="flex h-screen bg-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                        <Activity className="text-emerald-500" />
                        Cargo<span className="text-emerald-500">AI</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Agent System v1.0</p>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <SidebarLink to="/notifications" icon={<Bell size={20} />} label="Notifications" />
                    <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">JD</div>
                        <div>
                            <div className="text-sm font-medium">John Doe</div>
                            <div className="text-xs text-slate-400">Dispatcher</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/notifications" element={<div className="text-slate-500">No new notifications.</div>} />
                </Routes>
            </main>

            {/* Modals */}
            {activeNegotiation && (
                <NegotiationModal 
                    load={activeNegotiation} 
                    onClose={() => setActiveNegotiation(null)} 
                    dispatcherSettings={settings}
                />
            )}
            {showImportModal && (
                <ImportModal
                    dispatcherId={dispatcherId}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    </Router>
  );
}

export default App;
