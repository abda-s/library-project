import { useEffect, useState, useMemo } from 'react'; // Import useMemo
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../Layout';

// Predefined colors for different tags
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#413ea0',
  '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'
];

// Time window options in milliseconds
const TIME_WINDOWS = {
  '30sec': 30 * 1000,
  '1min': 60 * 1000,
};

const RFIDChartPage = () => {
  const navigate = useNavigate();
  const [rawTagData, setRawTagData] = useState({}); // Store all incoming data
  const [activeTags, setActiveTags] = useState(new Set());
  const [timeWindow, setTimeWindow] = useState('1min'); // Default to 1 minute

  useEffect(() => {
    const socket = io('http://localhost:4000');

    socket.on('tag_scanned', (data) => {
      if (data.status === 'scanning' && data.tagId) {
        setActiveTags(prev => new Set([...prev, data.tagId]));
      }
    });

    socket.on('raw_rfid_data', (data) => {
      console.log(data);

      if (data.port === '2') {
        const { tagId, timestamp, rssi } = data; // timestamp is the ISO string
        const timeMs = new Date(timestamp).getTime(); // Convert ISO string to milliseconds

        // Add tagId to activeTags if not already there
        setActiveTags(prev => new Set([...prev, tagId]));

        setRawTagData(prev => ({
          ...prev,
          [tagId]: [...(prev[tagId] || []), {
            timestamp: timeMs,
            rssi: Number(rssi),
            tagId
          }]
        }));
      }
    });

    return () => socket.disconnect();
  }, []);

  // Filter data based on the selected time window
  const filteredTagData = useMemo(() => {
    const now = Date.now();
    const windowDuration = TIME_WINDOWS[timeWindow];
    const threshold = now - windowDuration;

    const filteredData = {};
    Object.keys(rawTagData).forEach(tagId => {
      filteredData[tagId] = rawTagData[tagId].filter(
        dataPoint => dataPoint.timestamp >= threshold
      );
    });
    return filteredData;
  }, [rawTagData, timeWindow]); // Re-filter when raw data or time window changes

  // Format timestamp for display
  const formatXAxis = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Layout>
      <div className="min-h-screen p-8">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back
          </button>
          <h1 className="text-3xl font-bold mt-4">RFID Signal Strength (Port 2)</h1>
          <p className="text-gray-600 mt-2">Real-time RSSI values for detected tags</p>
        </div>

        {/* Time Window Selection */}
        <div className="mb-4">
          <label htmlFor="timeWindow" className="mr-2 font-medium">Show last:</label>
          <select
            id="timeWindow"
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="30sec">30 Seconds</option>
            <option value="1min">1 Minute</option>
          </select>
        </div>

        <div className="h-[600px] bg-white rounded-lg p-4 shadow-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                type="number"
                domain={['dataMin', 'dataMax']} // Use dataMin/dataMax for dynamic range
                scale="time"
                label={{
                  value: 'Time',
                  position: 'bottom'
                }}
              />
              <YAxis
                label={{
                  value: 'RSSI (dBm)',
                  angle: -90,
                  position: 'left'
                }}
                domain={[-100, 0]}
              />
              <Tooltip
                labelFormatter={(value) => formatXAxis(value)}
              />
              <Legend />
              {Array.from(activeTags).map((tagId, index) => (
                <Line
                  key={tagId}
                  type="monotone"
                  dataKey="rssi"
                  data={filteredTagData[tagId]} // Use filtered data here
                  name={tagId}
                  stroke={COLORS[index % COLORS.length]}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default RFIDChartPage;