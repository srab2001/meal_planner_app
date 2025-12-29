import React, { useState, useEffect, useCallback } from 'react';
import './PantryApp.css';

// Modals
import AddItemModal from './modals/AddItemModal';
import ConsumeModal from './modals/ConsumeModal';
import WasteModal from './modals/WasteModal';
import AdjustModal from './modals/AdjustModal';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function PantryApp({ user, onBack }) {
  // State
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [view, setView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [consumeItem, setConsumeItem] = useState(null);
  const [wasteItem, setWasteItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);

  // Auth
  const token = localStorage.getItem('auth_token');
  const householdId = localStorage.getItem('active_household_id');
  const membershipRole = user?.householdRole || 'member';
  const canEdit = ['owner', 'admin', 'member'].includes(membershipRole);

  // Fetch items with server-side filtering
  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams({ household_id: householdId });
      if (view !== 'all') params.append('view', view);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${API_BASE}/api/pantry/items?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch items');
      }

      const data = await res.json();
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching pantry items:', err);
      setError(err.message);
    }
  }, [token, householdId, view, searchTerm]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pantry/events?household_id=${householdId}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, [token, householdId]);

  // Initial load and refresh on filter change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchEvents()]);
      setLoading(false);
    };
    loadData();
  }, [fetchItems, fetchEvents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchItems]);

  // Optimistic update helper
  const updateItemOptimistic = (itemId, updates) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  // Handle successful modal actions
  const handleAddSuccess = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    setShowAddModal(false);
    fetchEvents();
  };

  const handleConsumeSuccess = (updatedItem) => {
    updateItemOptimistic(updatedItem.id, updatedItem);
    setConsumeItem(null);
    fetchEvents();
  };

  const handleWasteSuccess = (updatedItem) => {
    updateItemOptimistic(updatedItem.id, updatedItem);
    setWasteItem(null);
    fetchEvents();
  };

  const handleAdjustSuccess = (updatedItem) => {
    updateItemOptimistic(updatedItem.id, updatedItem);
    setAdjustItem(null);
    fetchEvents();
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  // Get expiration status class
  const getExpiryClass = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (date < now) return 'expired';
    if (date <= threeDays) return 'expiring-soon';
    return '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="pantry-app loading">
        <div className="spinner"></div>
        <p>Loading pantry...</p>
      </div>
    );
  }

  return (
    <div className="pantry-app">
      {/* Header */}
      <header className="pantry-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>Pantry</h1>
      </header>

      {/* Toolbar */}
      <div className="pantry-toolbar">
        {canEdit && (
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Item
          </button>
        )}

        <div className="view-selector">
          {[
            { value: 'all', label: 'All' },
            { value: 'exp3', label: 'Expiring 3 days' },
            { value: 'exp7', label: 'Expiring 7 days' },
            { value: 'exp14', label: 'Expiring 14 days' }
          ].map(opt => (
            <button
              key={opt.value}
              className={view === opt.value ? 'active' : ''}
              onClick={() => setView(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => fetchItems()}>Retry</button>
        </div>
      )}

      {/* Main content */}
      <div className="pantry-main">
        {/* Items table */}
        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Brand</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Purchase Date</th>
                <th>Expiration Date</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="empty-row">
                    No items found
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className={item.status === 'low' ? 'low-stock' : ''}>
                    <td className="item-name">{item.itemName}</td>
                    <td>{item.brand || '-'}</td>
                    <td className="quantity">{item.quantity}</td>
                    <td>{item.unit || '-'}</td>
                    <td>{formatDate(item.purchaseDate)}</td>
                    <td className={getExpiryClass(item.expirationDate)}>
                      {formatDate(item.expirationDate)}
                    </td>
                    {canEdit && (
                      <td className="actions">
                        <button
                          className="btn-action consume"
                          onClick={() => setConsumeItem(item)}
                          title="Consume"
                        >
                          Use
                        </button>
                        <button
                          className="btn-action waste"
                          onClick={() => setWasteItem(item)}
                          title="Mark as waste"
                        >
                          Waste
                        </button>
                        <button
                          className="btn-action adjust"
                          onClick={() => setAdjustItem(item)}
                          title="Adjust quantity"
                        >
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Events panel */}
        <div className="events-section">
          <h2>Recent Events</h2>
          <div className="events-list">
            {events.length === 0 ? (
              <p className="empty">No recent events</p>
            ) : (
              events.map(event => (
                <div key={event.id} className={`event-item type-${event.eventType}`}>
                  <span className="event-type">{event.eventType}</span>
                  <span className="event-name">{event.itemName}</span>
                  <span className="event-qty">
                    {event.quantityChange > 0 ? '+' : ''}{event.quantityChange}
                  </span>
                  <span className="event-time">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          apiBase={API_BASE}
          token={token}
          householdId={householdId}
        />
      )}

      {consumeItem && (
        <ConsumeModal
          item={consumeItem}
          onClose={() => setConsumeItem(null)}
          onSuccess={handleConsumeSuccess}
          apiBase={API_BASE}
          token={token}
          householdId={householdId}
        />
      )}

      {wasteItem && (
        <WasteModal
          item={wasteItem}
          onClose={() => setWasteItem(null)}
          onSuccess={handleWasteSuccess}
          apiBase={API_BASE}
          token={token}
          householdId={householdId}
        />
      )}

      {adjustItem && (
        <AdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSuccess={handleAdjustSuccess}
          apiBase={API_BASE}
          token={token}
          householdId={householdId}
        />
      )}
    </div>
  );
}
