import React, {useEffect, useState} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parse, format } from 'date-fns';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart, ResponsiveContainer} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/AlertDialog';
import {
  Globe,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Copy,
  Link as LinkIcon, Search
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Input } from '../components/ui/Input';

const WebsiteMonitorDashboard = () => {
  const { website } = useParams();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [websiteData, setWebsiteData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (website) {
      checkWebsite();
    }
  }, [website]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, "d MMMM HH:mm");
  };

  const submitReport = async () => {
    if (!website) {
      toast.error('No website data available');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/report/${encodeURIComponent(website)}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const result = await response.json();
      toast.success(result.message);
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  let successToastShown = false;
  const checkWebsite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/status/${encodeURIComponent(website)}`);
      if (!response.ok) {
        throw new Error("This website is not being monitored yet. Monitoring starts right now.\n Please try again.");
      }
      const data = await response.json();
      setWebsiteData(data);

      const report_response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/outage-history/${encodeURIComponent(website)}`);
      if (!report_response.ok) {
        throw new Error('Outage history not found');
      }
      const report_data = await report_response.json();
      setReportData(report_data);

      if (!successToastShown) {
        toast.success('Website status retrieved successfully');
        successToastShown = true;
      }
    } catch (error) {
      console.error('Error checking website:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to retrieve website status');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = () => {
    if (!websiteData) return null;
    return websiteData.is_down ? (
      <div className="bg-red-700 text-white px-4 py-2 rounded-full flex items-center justify-center">
        <AlertCircle className="mr-2" /> Down
      </div>
    ) : (
      <div className="bg-green-700 text-white px-4 py-2 rounded-full flex items-center justify-center">
        <Globe className="mr-2" /> Up
      </div>
    );
  };

  const getTimeAgo = (timestamp) => {
    const secondsAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (secondsAgo < 60) {
      return `${secondsAgo} seconds ago`;
    } else if (secondsAgo < 3600) {
      const minutesAgo = Math.floor(secondsAgo / 60);
      return `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
    } else if (secondsAgo < 86400) {
      const hoursAgo = Math.floor(secondsAgo / 3600);
      return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    } else {
      const daysAgo = Math.floor(secondsAgo / 86400);
      return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }
  };


  const copyUrlToClipboard = () => {
    if (websiteData?.url) {
      navigator.clipboard.writeText(websiteData.url);
      toast.success('URL copied to clipboard');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const url = e.target.search.value;
    if (url) {
      const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      navigate(`/monitor/${encodeURIComponent(cleanUrl)}`);
    }
  };

  const CustomTooltipResponseTime = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2C2C2C] border border-[#3C3C3C] p-3 rounded-lg">
          <p className="text-white">{formatDate(label)}</p>
          <p className="text-white">Response Time: {payload[0].value} ms</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipOutage = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2C2C2C] border border-[#3C3C3C] p-3 rounded-lg">
          <p className="text-white">{formatDate(label)}</p>
          <p className="text-white">Outages: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const renderCharts = () => {
      if (!websiteData?.history || !reportData) {
        return (
          <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl p-6">
            <div className="text-center text-gray-400">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p className="text-lg">No monitoring data available for this website yet.</p>
              <p className="mt-2">Please check back later or try monitoring a different website.</p>
            </div>
          </Card>
        );
      }
     var last_t_down;
     if (websiteData?.last_down === "Never"){
       last_t_down = "Never went down"
     } else {
       last_t_down = getTimeAgo(parse(websiteData?.last_down, "dd.MM.yyyy HH:mm:ss", new Date()))
     }
     return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
                <CardContent className="p-6">
                  <div className="text-white">
                    <p className="text-sm">Last time down:</p>
                    <p className="text-lg font-semibold">{last_t_down}</p>
                  </div>
                </CardContent>
              </Card>
             <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
                <CardContent className="p-6">
                  <div className="text-white">
                    <p className="text-sm">Last time checked:</p>
                    <p className="text-lg font-semibold">{getTimeAgo(websiteData?.last_checked)}</p>
                  </div>
                </CardContent>
              </Card>
            <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Response Time in the last 24 hours</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={websiteData.history}>
                    <XAxis
                      dataKey="last_checked"
                      tickFormatter={(dateStr, index) => {
                        return new Date(dateStr).toLocaleTimeString('ru-RU', {
                          timeZone: 'Europe/Moscow',
                          hourCycle: 'h23',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }}                      stroke="#666"
                    />
                    <YAxis
                      stroke="#666"
                      label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', fill: '#666', dy: 72 }}
                      domain={[
                        Math.min(...websiteData.history.map(item => item.response_time)),
                        'auto',
                      ]}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <Tooltip
                      content={<CustomTooltipResponseTime />}
                      contentStyle={{
                        backgroundColor: '#2C2C2C',
                        borderColor: '#3C3C3C',
                        color: '#FFF'
                      }}
                    />
                    <Line type="monotone" dataKey="response_time" stroke="#4CAF50" name="Response Time" strokeWidth={3} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Outage History in the last 24 hours</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData}>
                    <XAxis
                      dataKey="name"
                      tickFormatter={(dateStr, index) => {
                        return new Date(dateStr).toLocaleTimeString('ru-RU', {
                          timeZone: 'Europe/Moscow',
                          hourCycle: 'h23',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }}
                      stroke="#666"
                    />
                    <YAxis stroke="#666" label={{ value: 'Outages', angle: -90, position: 'insideLeft', fill: '#666', dy: 30 }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <Tooltip
                      content={<CustomTooltipOutage />}
                      contentStyle={{
                        backgroundColor: '#2C2C2C',
                        borderColor: '#3C3C3C',
                        color: '#FFF'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reportCount"
                      stroke="#DA4040"
                      fill="#DA4040"
                      fillOpacity={0.5}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212] flex flex-col">
      <Toaster position="top-right" richColors />

      <div className="container mx-auto px-6 py-12 flex-grow max-w-6xl">
        <div className="w-full">
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
                  className="flex-grow text-lg bg-[#2C2C2C] border-[#3C3C3C] text-white"
                />
                <Button type="submit" className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Search className="mr-2"/>
                  Monitor
                </Button>
              </form>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <RefreshCw className="animate-spin text-purple-500" size={48} />
            </div>
          ) : error ? (
            <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl p-6">
              <div className="text-center text-gray-400">
                <AlertCircle className="mx-auto mb-4" size={48} />
                <p className="text-2xl whitespace-pre-wrap">{error}</p>
                <Button
                  onClick={checkWebsite}
                  className="mt-4"
                  variant="outline"
                >
                  <RefreshCw className="mr-2" />
                  Retry
                </Button>
              </div>
            </Card>
          ) : websiteData && (
            <div className="space-y-6">
              <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <CardTitle className="flex items-center text-white break-all">
                      <span className="text-base sm:text-lg md:text-xl truncate max-w-[180px] xs:max-w-[240px] sm:max-w-none">
                        {websiteData.url}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 shrink-0"
                        onClick={copyUrlToClipboard}
                      >
                        <Copy size={16} />
                      </Button>
                    </CardTitle>
                    <div className="shrink-0">
                      {renderStatusBadge()}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setReportDialogOpen(true)}
                    className="w-full sm:w-auto shrink-0"
                  >
                    Report Issue
                  </Button>
                </CardHeader>
              </Card>

              {renderCharts()}
            </div>
          )}

          <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <AlertDialogContent className="bg-[#1E1E1E] border-[#2C2C2C]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Report Website Issue</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Help us understand the problem with this website
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="bg-[#2C2C2C] text-white hover:bg-[#3C3C3C]"
                  onClick={() => setReportDialogOpen(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-purple-700 text-white hover:bg-purple-600"
                  onClick={submitReport}
                >
                  Submit Report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </div>
  );
};

export default WebsiteMonitorDashboard;