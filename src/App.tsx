import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, MapPin, Building2, Search, Download, Play, Pause, RefreshCw, ChevronDown, CheckCircle2, AlertCircle, Clock, ExternalLink, Table, Database, Settings, Trash2, Eye } from 'lucide-react';

// Define proper type for venues
interface VenueMap {
  [key: string]: string[];
}

// Types
interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  category: string;
  url: string;
  status: 'upcoming' | 'ongoing' | 'expired';
  imageUrl: string;
  price: string;
  description: string;
  lastUpdated: string;
  source: string;
}

interface ScrapingConfig {
  enabled: boolean;
  intervalMinutes: number;
  autoUpdate: boolean;
}

// Mock data generator - simulates scraping from BookMyShow/District
const generateMockEvents = (city: string): Event[] => {
  const categories = ['Concert', 'Sports', 'Theater', 'Comedy', 'Workshop', 'Exhibition', 'Festival', 'Conference'];
  const venues: VenueMap = {
    'Mumbai': ['Jio Garden', 'NSCI Dome', 'Royal Opera House', 'St. Andrews Auditorium', 'Brabourne Stadium', 'Prithvi Theatre'],
    'Delhi': ['Jawaharlal Nehru Stadium', 'India Habitat Centre', 'Kamani Auditorium', 'Talkatora Stadium', 'Pragati Maidan', 'Lodhi Garden'],
    'Bangalore': ['Palace Grounds', 'Chowdiah Memorial Hall', 'Koramangala Indoor Stadium', 'BIEC', 'Rangashankara', 'UB City'],
    'Hyderabad': ['HICC', 'Shilpakala Vedika', 'Gachibowli Stadium', 'Lamakaan', 'Taramati Baradari', 'Inorbit Mall'],
    'Chennai': ['Music Academy', 'Valluvar Kottam', 'MA Chidambaram Stadium', 'Kalaignar Arangam', 'Express Avenue', 'Phoenix MarketCity'],
    'Pune': ['Shivaji Nagar Stadium', 'Bal Gandharva Rangmandir', 'Pune International Exhibition Centre', 'Oxford Golf Club', 'Westend Mall']
  };

  const eventNames = [
    'Sunburn Festival', 'Comedy Nights with Kapil', 'Hockey World Cup', 'Bollywood Music Festival',
    'Stand-Up Comedy Showcase', 'Tech Conference 2024', 'Food & Beer Festival', 'Art Expo India',
    'Yoga & Wellness Summit', 'Electronic Music Night', 'Classical Music Concert', 'Fashion Week Grand Finale',
    'Business Leadership Summit', 'Children\'s Theatre Festival', 'Marathon Challenge', 'Photography Exhibition'
  ];

  const descriptions = [
    'An unforgettable experience featuring top artists from around the world.',
    'Join us for an evening of laughter, music, and entertainment.',
    'Premier sporting event featuring the best teams in competition.',
    'Celebrating the finest in culture, art, and entertainment.',
    'Network with industry leaders and innovators.',
    'Family-friendly event with activities for all ages.',
    'Experience the best of Indian and international talent.',
    'A must-attend event for enthusiasts and professionals alike.'
  ];

  const cityVenues = venues[city] || ['Convention Center', 'City Arena', 'Event Plaza'];
  
  return Array.from({ length: 15 }, (_, i) => {
    const daysFromNow = Math.floor(Math.random() * 90) - 15; // -15 to 75 days
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + daysFromNow);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDateOnly = new Date(eventDate);
    eventDateOnly.setHours(0, 0, 0, 0);
    
    let status: 'upcoming' | 'ongoing' | 'expired' = 'upcoming';
    if (eventDateOnly < today) {
      status = 'expired';
    } else if (daysFromNow <= 2) {
      status = 'ongoing';
    }

    return {
      id: `event-${city.toLowerCase()}-${Date.now()}-${i}`,
      name: eventNames[i % eventNames.length],
      date: eventDate.toISOString().split('T')[0],
      venue: cityVenues[i % cityVenues.length],
      city,
      category: categories[i % categories.length],
      url: `https://bookmyshow.com/events/${city.toLowerCase()}/${i}`,
      status,
      imageUrl: `https://picsum.photos/400/200?random=${Date.now() + i}`,
      price: `₹${Math.floor(Math.random() * 5000 + 500).toLocaleString()}`,
      description: descriptions[i % descriptions.length],
      lastUpdated: new Date().toISOString(),
      source: i % 3 === 0 ? 'District' : 'BookMyShow'
    };
  });
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'logs'>('events');
  const [config, setConfig] = useState<ScrapingConfig>({
    enabled: true,
    intervalMinutes: 30,
    autoUpdate: true
  });
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];
  const categories = ['Concert', 'Sports', 'Theater', 'Comedy', 'Workshop', 'Exhibition', 'Festival', 'Conference'];

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // Filter events
  useEffect(() => {
    let filtered = [...events];
    
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(e => e.source === sourceFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, statusFilter, categoryFilter, sourceFilter]);

  // Fetch events with deduplication and updates
  const fetchEvents = useCallback(async (manual = false) => {
    setIsLoading(true);
    if (manual) addLog(`🔍 Manual scraping initiated for ${selectedCity}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newEvents = generateMockEvents(selectedCity);
    
    setEvents(prev => {
      const existingMap = new Map(prev.map(e => [`${e.name}-${e.date}-${e.venue}`, e]));
      let added = 0;
      let updated = 0;
      let expired = 0;
      
      const merged = newEvents.map(newEvent => {
        const key = `${newEvent.name}-${newEvent.date}-${newEvent.venue}`;
        const existing = existingMap.get(key);
        
        if (existing) {
          if (existing.status !== newEvent.status) {
            updated++;
            return { ...newEvent, id: existing.id, lastUpdated: new Date().toISOString() };
          }
          return existing;
        }
        added++;
        return newEvent;
      });
      
      // Count expired events
      expired = merged.filter(e => e.status === 'expired').length;
      
      if (manual || added > 0 || updated > 0) {
        addLog(`✅ Scraping complete: +${added} new, ${updated} updated, ${expired} expired`);
      }
      
      return merged;
    });
    
    setLastFetched(new Date());
    setIsLoading(false);
  }, [selectedCity, addLog]);

  // Auto-refresh interval
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    fetchEvents();
    addLog(`⏰ Auto-refresh scheduled every ${config.intervalMinutes} minutes`);
    
    const interval = setInterval(() => {
      fetchEvents();
    }, config.intervalMinutes * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAutoRefresh, config.intervalMinutes, fetchEvents, addLog]);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredEvents.map(e => ({
      'Event Name': e.name,
      'Date': e.date,
      'Venue': e.venue,
      'City': e.city,
      'Category': e.category,
      'Price': e.price,
      'Status': e.status.toUpperCase(),
      'Source': e.source,
      'URL': e.url,
      'Last Updated': e.lastUpdated
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-fit column widths
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length)) * 1.2
    }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, `pixie-events-${selectedCity.toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    addLog(`📥 Exported ${filteredEvents.length} events to Excel`);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ongoing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-3 h-3" />;
      case 'ongoing': return <Play className="w-3 h-3" />;
      case 'expired': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getSourceIcon = (source: string) => {
    return source === 'BookMyShow' ? '🎬' : '🎭';
  };

  // Stats calculation
  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    expired: events.filter(e => e.status === 'expired').length,
    bookmyshow: events.filter(e => e.source === 'BookMyShow').length,
    district: events.filter(e => e.source === 'District').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Pixie Event Scout</h1>
                <p className="text-sm text-slate-500">Photobooth Opportunity Discovery Tool</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{stats.total} events</span>
              </div>
              
              {lastFetched && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="w-4 h-4" />
                  <span>Last sync: {lastFetched.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* City Selection */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">Target City</label>
              <div className="relative">
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    <span className="font-semibold text-slate-900">{selectedCity}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showCityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {cities.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setShowCityDropdown(false);
                          setEvents([]);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${selectedCity === city ? 'bg-rose-50 text-rose-700' : 'text-slate-700'}`}
                      >
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Upcoming</div>
                <div className="text-2xl font-bold text-emerald-700">{stats.upcoming}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Ongoing</div>
                <div className="text-2xl font-bold text-amber-700">{stats.ongoing}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Expired</div>
                <div className="text-2xl font-bold text-slate-600">{stats.expired}</div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
                <div className="text-xs text-rose-600 font-medium uppercase tracking-wide mb-1">Sources</div>
                <div className="text-lg font-bold text-rose-700">🎬 {stats.bookmyshow} 🎭 {stats.district}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <button
                onClick={() => fetchEvents(true)}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${isLoading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 shadow-lg shadow-rose-200'}`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Scraping Events...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Scrape Now
                  </>
                )}
              </button>
              
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all border-2 ${isAutoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {isAutoRefresh ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Auto-Refresh ON
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Auto-Refresh OFF
                  </>
                )}
              </button>

              <button
                onClick={exportToExcel}
                disabled={filteredEvents.length === 0}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${filteredEvents.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200'}`}
              >
                <Download className="w-5 h-5" />
                Export Excel ({filteredEvents.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'events' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Table className="w-5 h-5" />
            Events ({filteredEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Settings className="w-5 h-5" />
            Activity Logs ({logs.length})
          </button>
        </div>

        {activeTab === 'events' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search events by name, venue, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">All</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">All</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Source:</span>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">All</option>
                    <option value="BookMyShow">BookMyShow 🎬</option>
                    <option value="District">District 🎭</option>
                  </select>
                </div>

                {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || sourceFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setSourceFilter('all');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className={`bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 group ${event.status === 'expired' ? 'opacity-70' : ''}`}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                          {event.status.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700 border border-slate-200">
                          {getSourceIcon(event.source)} {event.source}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => window.open(event.url, '_blank')}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-600 hover:text-rose-600 hover:bg-white transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                          {event.name}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-rose-600 font-bold text-lg mb-3">
                        {event.price}
                      </div>
                      
                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{event.city}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                          {event.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => window.open(event.url, '_blank')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-medium hover:from-rose-600 hover:to-orange-600 transition-all shadow-sm"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Events Found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  {events.length === 0 
                    ? "Click 'Scrape Now' to discover events in your city!"
                    : "Try adjusting your filters or search terms."}
                </p>
                {events.length === 0 && (
                  <button
                    onClick={() => fetchEvents(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-orange-600 shadow-lg shadow-rose-200 transition-all"
                  >
                    <Search className="w-5 h-5" />
                    Discover Events
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Scraping Configuration
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-medium text-slate-900">Auto-Update</div>
                      <div className="text-sm text-slate-500">Enable automatic scraping</div>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, autoUpdate: !prev.autoUpdate }))}
                      className={`w-14 h-7 rounded-full transition-all relative ${config.autoUpdate ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-md ${config.autoUpdate ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Refresh Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={config.intervalMinutes}
                      onChange={(e) => setConfig(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) || 30 }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl border border-rose-100">
                    <h4 className="font-semibold text-rose-900 mb-3">Data Points Collected</h4>
                    <ul className="text-sm text-rose-800 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Event Name & Description
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Date & Time
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Venue & City
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Category & Price
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Source Platform & URL
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-semibold text-slate-900 mb-3">Deduplication Strategy</h4>
                    <p className="text-sm text-slate-600">
                      Events are deduplicated using a composite key of <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">name + date + venue</code>. Existing events are updated with new status and pricing information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Activity Logs */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Activity Logs</h3>
                  <button
                    onClick={() => setLogs([])}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
                <div className="p-5 h-96 overflow-y-auto font-mono text-sm bg-slate-900">
                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-300">
                          <span className="text-slate-500">▸</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-500">No activity yet. Start by scraping events!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative h-64">
              <img
                src={selectedEvent.imageUrl}
                alt={selectedEvent.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-3 bg-white/90 rounded-full text-slate-700 hover:text-rose-600 hover:bg-white transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedEvent.status)}`}>
                    {getStatusIcon(selectedEvent.status)}
                    {selectedEvent.status.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200">
                    {getSourceIcon(selectedEvent.source)} {selectedEvent.source}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white">{selectedEvent.name}</h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="text-3xl font-bold text-rose-600">{selectedEvent.price}</div>
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                  {selectedEvent.category}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date</div>
                  <div className="font-semibold text-slate-900">
                    {new Date(selectedEvent.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">City</div>
                  <div className="font-semibold text-slate-900">{selectedEvent.city}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl col-span-2">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Venue</div>
                  <div className="font-semibold text-slate-900">{selectedEvent.venue}</div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-3">About This Event</h3>
                <p className="text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              </div>
              
              <div className="text-sm text-slate-500 mb-6">
                Last updated: {new Date(selectedEvent.lastUpdated).toLocaleString()}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => window.open(selectedEvent.url, '_blank')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:from-rose-600 hover:to-orange-600 shadow-lg shadow-rose-200 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  View on {selectedEvent.source}
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing Camera component import
function Camera({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
