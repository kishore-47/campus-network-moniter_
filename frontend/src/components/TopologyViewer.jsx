import React, { useState, useEffect } from 'react';
import { Network, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { api } from '../api';

const TopologyViewer = () => {
  const [topology, setTopology] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const { token, hasRole } = useAuth();

  useEffect(() => {
    fetchTopology();
  }, []);

  const fetchTopology = async () => {
    try {
      const response = await fetch(api('/topology'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTopology(data);
      }
    } catch (error) {
      console.error('Error fetching topology:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (type) => {
    const colors = {
      'Router': 'bg-red-500',
      'Switch': 'bg-blue-500',
      'Server': 'bg-green-500',
      'Firewall': 'bg-orange-500',
      'Computer': 'bg-purple-500',
      'Mobile': 'bg-pink-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getNodeIcon = (type) => {
    const icons = {
      'Router': '🔀',
      'Switch': '🔄',
      'Server': '🖥️',
      'Firewall': '🛡️',
      'Computer': '💻',
      'Mobile': '📱'
    };
    return icons[type] || '📡';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading topology...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="text-blue-400" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-white">Network Topology</h2>
            <p className="text-gray-400">Visual representation of your network infrastructure</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchTopology}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          {hasRole('operator') && (
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all">
              <Plus size={18} />
              Add Link
            </button>
          )}
        </div>
      </div>

      {/* Topology Visualization */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        {topology.nodes.length === 0 ? (
          <div className="text-center py-12">
            <Network className="mx-auto text-gray-500 mb-4" size={64} />
            <p className="text-gray-400">No topology data available</p>
            <p className="text-gray-500 text-sm mt-2">Add network links to visualize your topology</p>
          </div>
        ) : (
          <div className="relative min-h-[600px] bg-gray-900/50 rounded-lg p-8">
            {/* Simple Network Diagram */}
            <div className="grid grid-cols-4 gap-8">
              {topology.nodes.map((node, index) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`${getNodeColor(node.type)} rounded-xl p-4 cursor-pointer transform transition-all hover:scale-110 hover:shadow-xl ${selectedNode?.id === node.id ? 'ring-4 ring-white' : ''}`}
                >
                  <div className="text-4xl text-center mb-2">{getNodeIcon(node.type)}</div>
                  <div className="text-white text-center">
                    <p className="font-semibold text-sm truncate">{node.label}</p>
                    <p className="text-xs opacity-75">{node.type}</p>
                    <p className="text-xs opacity-50 font-mono">{node.ip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Connection Lines (simplified) */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
              {topology.edges.map((edge, index) => (
                <line
                  key={index}
                  x1="25%"
                  y1="25%"
                  x2="75%"
                  y2="75%"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.5"
                />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Device Details Panel */}
      {selectedNode && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 animate-slideUp">
          <h3 className="text-xl font-bold text-white mb-4">Device Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-white font-semibold">{selectedNode.label}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Type</p>
              <p className="text-white font-semibold">{selectedNode.type}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">IP Address</p>
              <p className="text-white font-mono">{selectedNode.ip}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Location</p>
              <p className="text-white">{selectedNode.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Device Types</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {Object.entries({
            'Router': '🔀',
            'Switch': '🔄',
            'Server': '🖥️',
            'Firewall': '🛡️',
            'Computer': '💻',
            'Mobile': '📱'
          }).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`${getNodeColor(type)} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}>
                {icon}
              </div>
              <span className="text-white text-sm">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopologyViewer;