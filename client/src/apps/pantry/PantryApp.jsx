import React, { useState, useEffect } from 'react';
import './PantryApp.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function PantryApp({ user, onBack }) {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', category: 'pantry', quantity: 1, unit: 'count', expiration_date: '' });

  const token = localStorage.getItem('auth_token');
  const householdId = localStorage.getItem('active_household_id');
  const canEdit = ['owner', 'admin', 'member'].includes(user?.householdRole || 'member');

  useEffect(() => { fetchPantryData(); }, []);

  const fetchPantryData = async () => {
    try {
      const [itemsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/core/pantry/items?household_id=${householdId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/core/pantry/events?household_id=${householdId}&limit=20`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (itemsRes.ok) setItems((await itemsRes.json()).items || []);
      if (eventsRes.ok) setEvents((await eventsRes.json()).events || []);
    } catch (err) {
      console.error('Error fetching pantry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/core/pantry/items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Household-ID': householdId },
        body: JSON.stringify(itemForm)
      });
      if (response.ok) {
        const data = await response.json();
        setItems([data.item, ...items]);
        setItemForm({ name: '', category: 'pantry', quantity: 1, unit: 'count', expiration_date: '' });
        setShowAddForm(false);
        fetchPantryData();
      }
    } catch (err) {
      alert('Error adding item');
    }
  };

  const handleEvent = async (itemId, eventType, quantity = 1) => {
    try {
      const response = await fetch(`${API_BASE}/api/core/pantry/items/${itemId}/events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Household-ID': householdId },
        body: JSON.stringify({ event_type: eventType, quantity_change: -Math.abs(quantity) })
      });
      if (response.ok) fetchPantryData();
    } catch (err) {
      alert('Error recording event');
    }
  };

  const getExpiringItems = (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return items.filter(i => i.expiration_date && new Date(i.expiration_date) <= cutoff && i.status !== 'expired');
  };

  const filteredItems = activeTab === 'all' ? items :
    activeTab === '3days' ? getExpiringItems(3) :
    activeTab === '7days' ? getExpiringItems(7) :
    activeTab === '14days' ? getExpiringItems(14) : items;

  if (loading) return <div className="pantry-app loading"><div className="spinner"></div></div>;

  return (
    <div className="pantry-app">
      <header className="pantry-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>🥫 Pantry</h1>
        {canEdit && <button className="btn-add" onClick={() => setShowAddForm(!showAddForm)}>+ Add Item</button>}
      </header>

      <nav className="pantry-tabs">
        {[
          { id: 'all', label: 'All Items', count: items.length },
          { id: '3days', label: '3 Days', count: getExpiringItems(3).length },
          { id: '7days', label: '7 Days', count: getExpiringItems(7).length },
          { id: '14days', label: '14 Days', count: getExpiringItems(14).length },
          { id: 'events', label: 'Recent', count: events.length }
        ].map(tab => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            {tab.label} {tab.count > 0 && <span className="badge">{tab.count}</span>}
          </button>
        ))}
      </nav>

      {showAddForm && canEdit && (
        <form className="add-form" onSubmit={handleAddItem}>
          <input placeholder="Item name" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
          <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})}>
            {['produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverages', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" min="0.1" step="0.1" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: parseFloat(e.target.value)})} />
          <select value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})}>
            {['count', 'lbs', 'oz', 'kg', 'g', 'L', 'mL', 'cups'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input type="date" value={itemForm.expiration_date} onChange={e => setItemForm({...itemForm, expiration_date: e.target.value})} />
          <button type="submit">Add</button>
        </form>
      )}

      <main className="pantry-content">
        {activeTab !== 'events' ? (
          <div className="items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className={`item-card category-${item.category} ${item.status}`}>
                <div className="item-header">
                  <span className="category">{item.category}</span>
                  {item.expiration_date && (
                    <span className={`expiry ${new Date(item.expiration_date) < new Date() ? 'expired' : new Date(item.expiration_date) < new Date(Date.now() + 3*24*60*60*1000) ? 'soon' : ''}`}>
                      {new Date(item.expiration_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3>{item.name}</h3>
                <p className="quantity">{item.quantity} {item.unit}</p>
                {canEdit && (
                  <div className="item-actions">
                    <button onClick={() => handleEvent(item.id, 'consumed', 1)} title="Use 1">Use</button>
                    <button onClick={() => handleEvent(item.id, 'wasted', item.quantity)} title="Mark as waste">Waste</button>
                  </div>
                )}
              </div>
            ))}
            {filteredItems.length === 0 && <p className="empty">No items</p>}
          </div>
        ) : (
          <div className="events-list">
            {events.map(e => (
              <div key={e.id} className={`event-card type-${e.event_type}`}>
                <span className="event-type">{e.event_type}</span>
                <span className="event-item">{e.item_name}</span>
                <span className="event-qty">{e.quantity_change > 0 ? '+' : ''}{e.quantity_change}</span>
                <span className="event-time">{new Date(e.created_at).toLocaleString()}</span>
              </div>
            ))}
            {events.length === 0 && <p className="empty">No recent events</p>}
          </div>
        )}
      </main>
    </div>
  );
}
