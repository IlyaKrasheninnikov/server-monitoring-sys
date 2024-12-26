import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Globe, Search, AlertCircle, ArrowRight } from 'lucide-react';

const TOP_WEBSITES = [
  'google.com', 'facebook.com', 'x.com', 'netflix.com', 'youtube.com',
  'gmail.com', 'outlook.com', 'steamcommunity.com', 'whatsapp.com', 'live.com',
  'instagram.com', 'dropbox.com', 'battle.net', 'vk.com', 'reddit.com',
  'pinterest.com', 'spotify.com', 'twitch.tv', 'web.telegram.org', 'ya.ru', "faceit.com"
];

const MainDashboard = () => {
  const [websitesData, setWebsitesData] = useState({});
  const [recentlyChecked, setRecentlyChecked] = useState([]);
  const [downSites, setDownSites] = useState([]);
  const [lastReported, setLastReported] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllWebsitesData = async () => {
      const promises = TOP_WEBSITES.map(website =>
        fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/status/${encodeURIComponent(website)}`)
          .then(res => res.json())
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const data = {};
      const downSitesList = [];
      const recentList = [];

      results.forEach((result, index) => {
        if (result) {
          const website = TOP_WEBSITES[index];
          data[website] = result;

          if (result.is_down) {
            downSitesList.push({ website, lastChecked: result.history[result.history.length - 1].last_checked });
          }

          recentList.push({
            website,
            lastChecked: result.history[result.history.length - 1].last_checked
          });
        }
      });

      setWebsitesData(data);
      setDownSites(downSitesList.sort((a, b) => new Date(b.lastChecked) - new Date(a.lastChecked)));
      setRecentlyChecked(recentList.sort((a, b) => new Date(b.lastChecked) - new Date(a.lastChecked)).slice(0, 5));
    };

    // Fetch last reported sites
    const fetchLastReported = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/recent-reports`);
        const data = await response.json();
        setLastReported(data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent reports:', error);
      }
    };

    fetchAllWebsitesData();
    fetchLastReported();
    const interval = setInterval(fetchAllWebsitesData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const url = e.target.search.value;
    if (url) {
      const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      navigate(`/monitor/${encodeURIComponent(cleanUrl)}`);
    }
  };

  const handleWebsiteClick = (website) => {
    navigate(`/monitor/${encodeURIComponent(website)}`);
  };

  const renderMiniGraph = (data) => {
    if (!data?.history?.length) return null;

    const strokeColor = data.is_down ? '#ef4444' : '#4CAF50';

    return (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data.history.slice(-10)}>
          <Line
            type="monotone"
            dataKey="response_time"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212]">
      <div className="container mx-auto px-6 py-12">
        <Link to="/" className="block mb-12">
          <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            Website Health Dashboard
          </h1>
        </Link>

        <Card className="mb-12 bg-[#1E1E1E] border-[#2C2C2C]">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <Input
                name="search"
                placeholder="Enter website URL (e.g., example.com)"
                className="flex-grow bg-[#2C2C2C] border-[#3C3C3C] text-white"
              />
              <Button type="submit" className="flex items-center">
                <Search className="mr-2" />
                Monitor
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOP_WEBSITES.map((website) => {
                const data = websitesData[website];
                return (
                  <Card
                    key={website}
                    className="bg-[#1E1E1E] border-[#2C2C2C] cursor-pointer hover:bg-[#252525] transition-colors"
                    onClick={() => handleWebsiteClick(website)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-medium bg-gradient-to-r from-[#ca4ad4] to-[#9a44db] bg-clip-text text-transparent">
                        {website}
                      </CardTitle>
                      {data && (
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          data.is_down ? 'bg-red-700 text-white' : 'bg-green-700 text-white'
                        }`}>
                          {data.is_down ? <AlertCircle className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {data ? (
                        <>
                          {renderMiniGraph(data)}
                          <div className="mt-2 text-xs text-gray-400">
                            Last checked: {new Date(data.history?.[data.history?.length - 1]?.last_checked).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        <div className="h-[60px] flex items-center justify-center text-gray-500">
                          Loading...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-[#1E1E1E] border-[#2C2C2C]">
              <CardHeader>
                <CardTitle className="text-lg">Latest Sites Checked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentlyChecked.map((site) => (
                    <div
                      key={site.website}
                      className="flex items-center justify-between p-2 hover:bg-[#252525] rounded cursor-pointer"
                      onClick={() => handleWebsiteClick(site.website)}
                    >
                      <span className="text-sm text-gray-300">{site.website}</span>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#2C2C2C]">
              <CardHeader>
                <CardTitle className="text-lg">Down Right Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {downSites.length > 0 ? (
                    downSites.map((site) => (
                      <div
                        key={site.website}
                        className="flex items-center justify-between p-2 hover:bg-[#252525] rounded cursor-pointer"
                        onClick={() => handleWebsiteClick(site.website)}
                      >
                        <span className="text-sm text-red-400">{site.website}</span>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-2">
                      All sites are up! 🎉
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#2C2C2C]">
              <CardHeader>
                <CardTitle className="text-lg">Last Reported</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lastReported.map((report) => (
                    <div
                      key={report.website}
                      className="flex items-center justify-between p-2 hover:bg-[#252525] rounded cursor-pointer"
                      onClick={() => handleWebsiteClick(report.website)}
                    >
                      <span className="text-sm text-gray-300">{report.website}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;