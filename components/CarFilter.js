import { useState, useEffect } from 'react';
import styles from '../styles/CarFilter.module.css';

export default function CarFilter({ onFilterChange, filters }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple user ID - can be any unique identifier (UUID format)
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

  // Load saved filters from database
  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/load-filters?user_id=${simpleUserId}`);
      
      // Check if response is ok
      if (!response.ok) {
        console.error('❌ API response not ok:', response.status, response.statusText);
        
        // Try to get error details from response
        try {
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          
          // Show user-friendly error message
          if (response.status === 500) {
            alert('Server error loading filters. Please try again later.');
          } else {
            alert('Failed to load filters. Please try again.');
          }
        } catch (e) {
          alert('Failed to load filters. Please try again.');
        }
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ API returned non-JSON response:', contentType);
        alert('Server error. Please try again.');
        return;
      }
      
      const result = await response.json();
      console.log('✅ Filters API response:', result);
      
      if (result.success) {
        setSavedFilters(result.data || []);
        console.log('✅ Saved filters loaded:', result.data?.length || 0, 'filters');
      } else {
        console.error('❌ API returned error:', result.error);
        alert(`Error loading filters: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Network error loading filters:', error);
      alert('Network error loading filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentFilter = async () => {
    console.log('Save filter clicked!');
    console.log('Filter name:', filterName);
    console.log('Current filters:', filters);
    console.log('Simple user ID:', simpleUserId);
    
    if (!filterName.trim()) {
      alert('Please enter a filter name.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Sending save request...');
      
      const requestBody = {
        user_id: simpleUserId,
        filter_name: filterName.trim(),
        filter_data: filters
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/save-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      // Check if response is ok
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        alert('Failed to save filter. Please try again.');
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        alert('Server error. Please try again.');
        return;
      }
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        setFilterName('');
      setShowSaveDialog(false);
        loadSavedFilters(); // Reload filters
        
        // Show success message and ask if user wants to clear filters
        const shouldClear = confirm('Filter saved successfully! Do you want to clear the current filters?');
        if (shouldClear) {
          clearAllFilters();
        }
      } else {
        console.error('Failed to save filter:', result.error);
        alert(`Error saving filter: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving filter:', error);
      alert('Network error saving filter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilter = (savedFilter) => {
    onFilterChange('load', savedFilter.filter_data);
    // Show success message
    alert(`Filter "${savedFilter.filter_name}" loaded successfully!`);
  };

  const deleteSavedFilter = async (filterId) => {
    try {
      setLoading(true);
      const response = await fetch('/api/delete-filter', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter_id: filterId,
          user_id: simpleUserId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        loadSavedFilters(); // Reload filters
        alert('Filter deleted successfully!');
      } else {
        console.error('Failed to delete filter:', result.error);
        alert(`Error deleting filter: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
      alert('Network error deleting filter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterHeader}>
      <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
      >
          <span>🔍</span>
          <span>Filters</span>
          {hasActiveFilters() && <span className={styles.activeIndicator}>●</span>}
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </button>

        {hasActiveFilters() && (
          <button 
            className={styles.clearButton}
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className={styles.filterContent}>
          {/* Car Title Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Car Title</label>
            <input
              type="text"
              placeholder="Search by car title..."
              value={filters.title || ''}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          {/* Price Range Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Price Range ($)</label>
            <div className={styles.priceRange}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className={styles.priceInput}
                min="0"
              />
              <span className={styles.priceSeparator}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className={styles.priceInput}
                min="0"
              />
            </div>
          </div>

          {/* Miles Range Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Miles Range</label>
            <div className={styles.priceRange}>
              <input
                type="number"
                placeholder="Min Miles"
                value={filters.miles_min || ''}
                onChange={(e) => handleFilterChange('miles_min', e.target.value)}
                className={styles.priceInput}
                min="0"
              />
              <span className={styles.priceSeparator}>-</span>
              <input
                type="number"
                placeholder="Max Miles"
                value={filters.miles_max || ''}
                onChange={(e) => handleFilterChange('miles_max', e.target.value)}
                className={styles.priceInput}
                min="0"
              />
            </div>
          </div>

          {/* Year Range Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Year Range</label>
            <div className={styles.priceRange}>
              <input
                type="number"
                placeholder="Min Year"
                value={filters.year_min || ''}
                onChange={(e) => handleFilterChange('year_min', e.target.value)}
                className={styles.priceInput}
                min="1980"
                max="2024"
              />
              <span className={styles.priceSeparator}>-</span>
              <input
                type="number"
                placeholder="Max Year"
                value={filters.year_max || ''}
                onChange={(e) => handleFilterChange('year_max', e.target.value)}
                className={styles.priceInput}
                min="1980"
                max="2024"
              />
            </div>
          </div>

          {/* City Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Registration City</label>
            <select
              value={filters.reg_district || ''}
              onChange={(e) => handleFilterChange('reg_district', e.target.value)}
              className={styles.filterSelect}
            >
                             <option value="">All Cities</option>
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Multan">Multan</option>
              <option value="Peshawar">Peshawar</option>
              <option value="Quetta">Quetta</option>
              <option value="Gujranwala">Gujranwala</option>
              <option value="Sialkot">Sialkot</option>
              <option value="Bahawalpur">Bahawalpur</option>
              <option value="Sargodha">Sargodha</option>
              <option value="Sukkur">Sukkur</option>
              <option value="Larkana">Larkana</option>
              <option value="Sheikhupura">Sheikhupura</option>
              <option value="Rahim Yar Khan">Rahim Yar Khan</option>
              <option value="Jhang">Jhang</option>
              <option value="Gujrat">Gujrat</option>
              <option value="Mardan">Mardan</option>
              <option value="Kasur">Kasur</option>
              <option value="Dera Ghazi Khan">Dera Ghazi Khan</option>
              <option value="Sahiwal">Sahiwal</option>
              <option value="Nawabshah">Nawabshah</option>
              <option value="Mirpur Khas">Mirpur Khas</option>
              <option value="Okara">Okara</option>
              <option value="Mandi Bahauddin">Mandi Bahauddin</option>
              <option value="Jacobabad">Jacobabad</option>
              <option value="Saddiqabad">Saddiqabad</option>
              <option value="Muzaffargarh">Muzaffargarh</option>
              <option value="Murree">Murree</option>
              <option value="Abbottabad">Abbottabad</option>
              <option value="Jhelum">Jhelum</option>
              <option value="Mianwali">Mianwali</option>
              <option value="Toba Tek Singh">Toba Tek Singh</option>
              <option value="Khanewal">Khanewal</option>
              <option value="Dera Ismail Khan">Dera Ismail Khan</option>
              <option value="Vehari">Vehari</option>
              <option value="Nowshera">Nowshera</option>
              <option value="Charsadda">Charsadda</option>
              <option value="Jampur">Jampur</option>
              <option value="Attock">Attock</option>
              <option value="Kot Addu">Kot Addu</option>
              <option value="Rawalakot">Rawalakot</option>
              <option value="Gilgit">Gilgit</option>
              <option value="Skardu">Skardu</option>
              <option value="Chitral">Chitral</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Save Filter Section */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Save Current Filter</label>
            <div className={styles.saveFilterSection}>
              <button
                className={styles.saveFilterBtn}
                onClick={() => {
                  console.log('Save Filter button clicked!');
                  console.log('Has active filters:', hasActiveFilters());
                  console.log('Loading state:', loading);
                  setShowSaveDialog(true);
                }}
                disabled={!hasActiveFilters() || loading}
              >
                💾 Save Filter
              </button>
            </div>
          </div>

          {/* Saved Filters Section */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              💾 Saved Filters ({savedFilters.length})
            </label>
            {savedFilters.length > 0 ? (
              <div className={styles.savedFiltersList}>
                {savedFilters.map((savedFilter) => (
                  <div key={savedFilter.id} className={styles.savedFilterItem}>
                    <button
                      className={styles.loadFilterBtn}
                      onClick={() => loadSavedFilter(savedFilter)}
                      disabled={loading}
                      title={`Load filter: ${savedFilter.filter_name}`}
                    >
                      📋 {savedFilter.filter_name}
                    </button>
                    <button
                      className={styles.deleteFilterBtn}
                      onClick={() => {
                        if (confirm(`Delete filter "${savedFilter.filter_name}"?`)) {
                          deleteSavedFilter(savedFilter.id);
                        }
                      }}
                      title="Delete filter"
                    >
                      🗑️
                  </button>
                </div>
              ))}
              </div>
            ) : (
              <div className={styles.noFiltersMessage}>
                <p>No saved filters yet. Create and save your first filter!</p>
              </div>
            )}
          </div>
            </div>
          )}

      {/* Save Filter Dialog */}
          {showSaveDialog && (
            <div className={styles.saveDialog}>
          <div className={styles.saveDialogContent}>
            <h3>Save Filter</h3>
            <p>Give your filter a name to save it for later use:</p>
              <input
                type="text"
              placeholder="e.g., Budget Cars in Karachi"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              className={styles.saveDialogInput}
              autoFocus
            />
            <div className={styles.saveDialogActions}>
              <button
                className={styles.saveDialogBtn}
                onClick={saveCurrentFilter}
                disabled={!filterName.trim()}
              >
                Save
              </button>
              <button
                className={styles.cancelDialogBtn}
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
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