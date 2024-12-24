import React, {useEffect, useState} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart} from 'recharts';
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
  Link as LinkIcon
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

  useEffect(() => {
    if (website) {
      checkWebsite();
    }
  }, [website]);

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

  const checkWebsite = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/status/${encodeURIComponent(website)}`);
      const data = await response.json();
      setWebsiteData(data);

      const report_response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/monitor/outage-history/${encodeURIComponent(website)}`);
      const report_data = await report_response.json();
      setReportData(report_data);
      toast.success('Website status retrieved successfully');
    } catch (error) {
      console.error('Error checking website:', error);
      toast.error('Failed to retrieve website status');
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

  const copyUrlToClipboard = () => {
    if (websiteData?.url) {
      navigator.clipboard.writeText(websiteData.url);
      toast.success('URL copied to clipboard');
    }
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

          <Card className="mb-6 bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
            <CardContent className="flex space-x-4 p-6">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://www.example.com)"
                className="flex-grow bg-[#2C2C2C] border-[#3C3C3C] text-white text-lg py-3"
              />
              <Button
                onClick={checkWebsite}
                disabled={isLoading}
                className="flex items-center text-lg py-3 px-6"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" /> Checking...
                  </>
                ) : (
                  <>Check<ChevronRight className="ml-2" /></>
                )}
              </Button>
            </CardContent>
          </Card>

          {websiteData && (
            <div className="space-y-6">
              <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
                <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <CardTitle className="flex items-center text-white">
                        {websiteData.url}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={copyUrlToClipboard}
                        >
                          <Copy size={16} />
                        </Button>
                      </CardTitle>
                      {renderStatusBadge()}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setReportDialogOpen(true)}
                    >
                      Report Issue
                    </Button>
                  </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      width={window.innerWidth / 4}
                      height={300}
                      data={websiteData.history}
                      className="w-full"
                    >
                      <XAxis
                        dataKey="last_checked"
                        tickFormatter={(dateStr, index) => {
                          {/* if (index === 0) return '';*/}
                          return new Date(dateStr).toLocaleTimeString('ru-RU', {
                            timeZone: 'Europe/Moscow',
                            hourCycle: 'h23',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        }}
                        stroke="#666"
                      />
                      <YAxis stroke="#666" label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', fill: '#666', dy: 72 }} domain={[
                        Math.min(...websiteData.history.map(item => item.response_time)),
                        'auto',
                      ]}/>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2C2C2C',
                          borderColor: '#3C3C3C',
                          color: '#FFF'
                        }}
                      />
                      <Line type="monotone" dataKey="response_time" stroke="#4CAF50" name="Response Time"  strokeWidth={3} dot={false}/>
                    </LineChart>
                  </CardContent>
                </Card>

                <Card className="bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Outage History in the last 24 hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AreaChart
                      width={window.innerWidth / 4}
                      height={300}
                      data={reportData}
                      className="w-full"
                    >
                      <XAxis
                        dataKey="name"
                        tickFormatter={(dateStr, index) => {
                          {/* if (index === 0) return '';*/}
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
                  </CardContent>
                </Card>
              </div>
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
                    onClick={() => setReportDialogOpen(false)} // This will close the dialog
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