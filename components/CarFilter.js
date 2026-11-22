import { useState, useEffect } from 'react';

export default function CarFilter({ onFilterChange, filters }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [loading, setLoading] = useState(false);

  const simpleUserId = '123e4567-e89b-12d3-a456-426614174000';

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const clearAllFilters = () => {
    onFilterChange('clear', null);
  };

  const hasActiveFilters = () => {
    return filters.title || filters.minPrice || filters.maxPrice || filters.miles_min || filters.miles_max || filters.reg_district || filters.year_min || filters.year_max;
  };

  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/load-filters?user_id=${simpleUserId}`);
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) {
        setSavedFilters(result.data || []);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentFilter = async () => {
    if (!filterName.trim()) return;
    try {
      setLoading(true);
      const response = await fetch('/api/save-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: simpleUserId,
          filter_name: filterName.trim(),
          filter_data: filters
        }),
      });

      const result = await response.json();
      if (result.success) {
        setFilterName('');
        setShowSaveDialog(false);
        loadSavedFilters();
        if (confirm('Filter saved successfully! Do you want to clear current filters?')) {
          clearAllFilters();
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error saving filter.');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilter = (savedFilter) => {
    onFilterChange('load', savedFilter.filter_data);
  };

  const deleteSavedFilter = async (filterId) => {
    try {
      setLoading(true);
      const response = await fetch('/api/delete-filter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter_id: filterId, user_id: simpleUserId }),
      });
      const result = await response.json();
      if (result.success) {
        loadSavedFilters();
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-slate-900/80 border border-white/10 rounded-3xl p-5 mb-8 shadow-xl">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white transition-all cursor-pointer"
        >
          <span>🔍</span>
          <span>Filters</span>
          {hasActiveFilters() && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
          <span className="text-xs text-slate-400">{isExpanded ? '▼' : '▶'}</span>
        </button>

        {hasActiveFilters() && (
          <button 
            onClick={clearAllFilters}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Car Title Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Car Title</label>
            <input
              type="text"
              placeholder="e.g. Civic, Corolla"
              value={filters.title || ''}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Price Range ($)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>

          {/* Miles Range Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Miles Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.miles_min || ''}
                onChange={(e) => handleFilterChange('miles_min', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.miles_max || ''}
                onChange={(e) => handleFilterChange('miles_max', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>

          {/* Registration City */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Registration City</label>
            <select
              value={filters.reg_district || ''}
              onChange={(e) => handleFilterChange('reg_district', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Cities</option>
              {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Other'].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Save Filter Actions */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={!hasActiveFilters() || loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 Save Current Filter
            </button>

            {savedFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Saved:</span>
                {savedFilters.map((sf) => (
                  <div key={sf.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
                    <button 
                      onClick={() => loadSavedFilter(sf)}
                      className="hover:text-indigo-300 font-medium cursor-pointer"
                    >
                      {sf.filter_name}
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete "${sf.filter_name}"?`)) deleteSavedFilter(sf.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Save Filter</h3>
            <p className="text-xs text-slate-400 mb-4">Give your filter a name to save it for later use:</p>
            <input
              type="text"
              placeholder="e.g. Budget Cars in Karachi"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveCurrentFilter}
                disabled={!filterName.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
