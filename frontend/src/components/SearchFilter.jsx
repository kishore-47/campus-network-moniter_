import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const SearchFilter = ({ searchTerm, setSearchTerm, filterType, setFilterType, filterStatus, setFilterStatus }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6 animate-slideDown">
      {/* Search */}
      <div className="flex-1 min-w-[250px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Filter by Type */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="pl-10 pr-8 py-3 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
        >
          <option value="all" className="bg-gray-800">All Types</option>
          <option value="Router" className="bg-gray-800">Router</option>
          <option value="Switch" className="bg-gray-800">Switch</option>
          <option value="Server" className="bg-gray-800">Server</option>
          <option value="Firewall" className="bg-gray-800">Firewall</option>
        </select>
      </div>

      {/* Filter by Status */}
      <div className="relative">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
        >
          <option value="all" className="bg-gray-800">All Status</option>
          <option value="UP" className="bg-gray-800">UP Only</option>
          <option value="DOWN" className="bg-gray-800">DOWN Only</option>
        </select>
      </div>
    </div>
  );
};

export default SearchFilter;