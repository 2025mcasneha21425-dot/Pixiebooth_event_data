import { useState, useEffect } from 'react';

export function App() {
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'expired'>('upcoming');

  // Mock cities data
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  // Mock event data structure
  const mockEvents = [
    {
      id: 1,
      name: 'Tech Conference 2024',
      date: '2024-12-15',
      venue: 'Bandra Kurla Complex',
      city: 'Mumbai',
      category: 'Technology',
      url: 'https://bookmyshow.com/events/tech-conference-2024',
      status: 'upcoming',
      platform: 'BookMyShow'
    },
    {
      id: 2,
      name: 'Music Festival Winter Edition',
      date: '2024-12-20',
      venue: 'Jio World Garden',
      city: 'Mumbai',
      category: 'Music',
      url: 'https://district.in/events/music-festival-winter',
      status: 'upcoming',
      platform: 'District'
    },
    {
      id: 3,
      name: 'Art Exhibition - Modern Masters',
      date: '2024-11-30',
      venue: 'National Gallery of Modern Art',
      city: 'Mumbai',
      category: 'Arts',
      url: 'https://bookmyshow.com/events/art-exhibition-modern',
      status: 'upcoming',
      platform: 'BookMyShow'
    },
    {
      id: 4,
      name: 'Food & Wine Festival',
      date: '2024-10-15',
      venue: 'Phoenix Marketcity',
      city: 'Mumbai',
      category: 'Food',
      url: 'https://district.in/events/food-wine-festival',
      status: 'expired',
      platform: 'District'
    }
  ];

  // Simulate data fetching
  const fetchEvents = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEvents(mockEvents.filter(event => 
      event.city === selectedCity && 
      (activeTab === 'upcoming' ? event.status === 'upcoming' : event.status === 'expired')
    ));
    setLastUpdated(new Date().toLocaleString());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCity, activeTab]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const filteredEvents = events.filter(event => 
    activeTab === 'upcoming' ? event.status === 'upcoming' : event.status === 'expired'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pixie Event Discovery Tool</h1>
          <p className="text-gray-600">Track and discover upcoming events for photobooth installations</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* City Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select City
            </label>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityChange(city)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCity === city
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'upcoming'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming Events ({mockEvents.filter(e => e.city === selectedCity && e.status === 'upcoming').length})
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'expired'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expired Events ({mockEvents.filter(e => e.city === selectedCity && e.status === 'expired').length})
            </button>
          </div>

          {/* Last Updated Info */}
          {lastUpdated && (
            <div className="text-sm text-gray-500 mb-4">
              Last updated: {lastUpdated}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Events Table */}
          {!isLoading && (
            <div className="overflow-x-auto">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No {activeTab} events found for {selectedCity}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Event Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Venue</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Platform</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <a 
                            href={event.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            {event.name}
                          </a>
                        </td>
                        <td className="py-3 px-4">{new Date(event.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{event.venue}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {event.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            event.platform === 'BookMyShow' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {event.platform}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            event.status === 'upcoming' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {event.status === 'upcoming' ? 'Active' : 'Expired'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">Data Extraction</h3>
            <p className="text-sm text-gray-600">Scrapes BookMyShow & District platforms</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">Automated Updates</h3>
            <p className="text-sm text-gray-600">Runs every 6 hours via scheduled jobs</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">Google Sheets Sync</h3>
            <p className="text-sm text-gray-600">Real-time data storage with deduplication</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">Expiry Handling</h3>
            <p className="text-sm text-gray-600">Auto-marks past events as expired</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Pixie Event Discovery Tool - Full Stack Developer Intern Assignment</p>
          <p className="mt-1">Option A: Partial Build - Frontend Interface</p>
        </div>
      </div>
    </div>
  );
}