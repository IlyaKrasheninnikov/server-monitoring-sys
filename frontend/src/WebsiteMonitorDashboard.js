import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from './components/ui/Card';
import { Button } from './components/ui/Button';
import { TextField } from './components/ui/TextField';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from './components/ui/Tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './components/ui/AlertDialog';
import {
  Globe,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const WebsiteMonitorDashboard = () => {
  const [url, setUrl] = useState('');
  const [websiteData, setWebsiteData] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const checkWebsite = async () => {
    try {
      const response = await fetch(`http://localhost:8000/monitor/status/${encodeURIComponent(url)}`);
      const data = await response.json();
      setWebsiteData(data);
    } catch (error) {
      console.error('Error checking website:', error);
    }
  };

  const renderStatusBadge = () => {
    if (!websiteData) return null;
    return websiteData.is_down ? (
      <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center justify-center">
        <AlertCircle className="mr-2" /> Down
      </div>
    ) : (
      <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center justify-center">
        <Globe className="mr-2" /> Up
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-5xl font-extrabold mb-8 text-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text">
        Is It Down Right Now?
      </h1>

      <Card className="mb-6">
        <CardContent className="flex space-x-4 p-6">
          <TextField
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL (e.g., https://www.example.com)"
            className="flex-grow"
          />
          <Button onClick={checkWebsite} variant="default">
            Check Status <ChevronRight className="ml-2" />
          </Button>
        </CardContent>
      </Card>

      {websiteData && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>{websiteData.url}</CardTitle>
              {renderStatusBadge()}
            </div>
            <Button
              variant="destructive"
              onClick={() => setReportDialogOpen(true)}
            >
              Report Issue
            </Button>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="overview">
              <TabsContent value="overview">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="flex items-center p-4">
                      <Clock className="mr-4" />
                      <div>
                        <div>Response Time</div>
                        <div className="text-2xl">{websiteData.response_time} ms</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center p-4">
                      <AlertCircle className="mr-4" />
                      <div>
                        <div>Last Time Down</div>
                        <div className="text-2xl">{websiteData.last_down ? new Date(websiteData.last_down).toLocaleString() : 'N/A'}</div>
                      </div>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardContent className="flex items-center p-4">
                      <AlertCircle className="mr-4" />
                      <div>
                        <div>URL checked</div>
                        <div className="text-2xl">{websiteData.url}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="history">
                <LineChart width={900} height={300} data={websiteData.history}>
                  <XAxis dataKey="last_checked" tickFormatter={(dateStr) => new Date(dateStr).toLocaleTimeString()} />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="response_time" stroke="#8884d8" />
                </LineChart>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Website Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Help us understand the problem with this website
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Submit Report</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WebsiteMonitorDashboard;
