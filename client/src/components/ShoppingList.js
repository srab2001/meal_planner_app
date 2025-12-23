import React, { useState, useEffect } from 'react';
import './ShoppingList.css';
import analyticsService from '../shared/services/AnalyticsService';

// API Configuration - Always use production URLs (Vercel/Render)
const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * Consolidate shopping list by:
 * 1. Normalizing ingredient names
 * 2. Parsing quantities and units
 * 3. Converting to base units
 * 4. Summing quantities
 * 5. Formatting back to readable units
 */
function consolidateShoppingList(shoppingList) {
  if (!shoppingList || typeof shoppingList !== 'object') return shoppingList;

  // Unit conversion map
  const conversions = {
    // Volume
    'tsp': { to: 'tbsp', factor: 1/3 },
    'tbsp': { to: 'cup', factor: 1/16 },
    'oz': { to: 'cup', factor: 1/8 },
    'cup': { to: 'gallon', factor: 1/16 },
    'pint': { to: 'gallon', factor: 1/2 },
    'quart': { to: 'gallon', factor: 1/4 },
    // Weight
    'oz': { to: 'lb', factor: 1/16, type: 'weight' },
    'lb': { to: 'lb', factor: 1, type: 'weight' },
    // Count
    'each': { to: 'each', factor: 1, type: 'count' }
  };

  // Normalize and group by ingredient name and unit type
  const grouped = {};

  Object.entries(shoppingList).forEach(([category, items]) => {
    if (!Array.isArray(items)) return;

    items.forEach(item => {
      if (!item || typeof item !== 'string') return;

      // Parse: "2 cups milk" or "milk" or "1 lb butter"
      const trimmed = item.trim().toLowerCase();
      const match = trimmed.match(/^([\d.]+)\s*([a-z]+)?\s+(.+)$/) || 
                    trimmed.match(/^([a-z\s]+)$/);

      if (!match) return;

      let quantity = 1;
      let unit = 'each';
      let name = '';

      if (match[1] && !isNaN(match[1])) {
        quantity = parseFloat(match[1]);
        unit = (match[2] || 'each').toLowerCase();
        name = (match[3] || '').trim();
      } else {
        name = trimmed;
      }

      // Normalize name: remove commas, trim, map synonyms
      name = name.replace(/,/g, '').trim();
      const synonyms = {
        'milk': 'milk',
        'butter': 'butter',
        'eggs': 'eggs',
        'flour': 'flour',
        'sugar': 'sugar',
        'salt': 'salt',
        'pepper': 'pepper'
      };
      name = synonyms[name] || name;

      if (!name) return;

      // Create key for grouping
      const key = `${name}|${unit}`;

      if (!grouped[key]) {
        grouped[key] = { name, unit, quantity: 0 };
      }
      grouped[key].quantity += quantity;
    });
  });

  // Convert and format back
  const consolidated = {};

  Object.entries(grouped).forEach(([, { name, unit, quantity }]) => {
    let displayQuantity = quantity;
    let displayUnit = unit;

    // Convert to larger units if beneficial
    if (unit === 'quart' && quantity >= 4) {
      displayQuantity = Math.round((quantity / 4) * 10) / 10;
      displayUnit = 'gallon';
    } else if (unit === 'cup' && quantity >= 16) {
      displayQuantity = Math.round((quantity / 16) * 10) / 10;
      displayUnit = 'gallon';
    } else if (unit === 'tbsp' && quantity >= 16) {
      displayQuantity = Math.round((quantity / 16) * 10) / 10;
      displayUnit = 'cup';
    } else if (unit === 'oz' && quantity >= 16) {
      displayQuantity = Math.round((quantity / 16) * 10) / 10;
      displayUnit = 'lb';
    }

    // Format display
    const categoryKey = consolidated[name] ? 'Consolidated' : 'Produce'; // Default category
    if (!consolidated[categoryKey]) consolidated[categoryKey] = [];

    const formatted = displayQuantity % 1 === 0 
      ? `${Math.round(displayQuantity)} ${displayUnit} ${name}`
      : `${displayQuantity.toFixed(2)} ${displayUnit} ${name}`;

    consolidated[categoryKey].push(formatted);
  });

  return consolidated;
}

function ShoppingList({ shoppingList, totalCost, priceComparison, selectedStores }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [customItems, setCustomItems] = useState(['']);
  const [addingCustomItems, setAddingCustomItems] = useState(false);
  const [customItemsWithPrices, setCustomItemsWithPrices] = useState([]);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [isConsolidated, setIsConsolidated] = useState(false);

  // Load saved shopping list state on mount
  useEffect(() => {
    const loadShoppingListState = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(`${API_BASE}/api/shopping-list-state`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.checkedItems && Object.keys(data.checkedItems).length > 0) {
            setCheckedItems(data.checkedItems);
            console.log('📋 Loaded saved shopping list state:', Object.keys(data.checkedItems).length, 'items');
          }
        }
      } catch (error) {
        console.error('Error loading shopping list state:', error);
      } finally {
        setStateLoaded(true);
      }
    };

    loadShoppingListState();
  }, []);

  // Save shopping list state whenever it changes
  useEffect(() => {
    if (!stateLoaded) return; // Don't save until we've loaded the initial state

    const saveShoppingListState = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        await fetch(`${API_BASE}/api/shopping-list-state`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            checkedItems
          })
        });

        console.log('💾 Saved shopping list state:', Object.keys(checkedItems).length, 'items checked');
      } catch (error) {
        console.error('Error saving shopping list state:', error);
      }
    };

    // Debounce saves to avoid too many requests
    const timeoutId = setTimeout(saveShoppingListState, 500);
    return () => clearTimeout(timeoutId);
  }, [checkedItems, stateLoaded]);

  const handleCheck = (category, index) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrint = () => {
    // Create a print-specific view with only the shopping list
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadList = () => {
    const categories = Object.keys(shoppingList || {});
    const isComparisonMode = priceComparison && selectedStores?.comparisonStore;

    let content = `Shopping List\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n`;
    if (isComparisonMode) {
      content += `Stores: ${selectedStores.primaryStore.name} vs ${selectedStores.comparisonStore.name}\n`;
    } else if (selectedStores?.primaryStore) {
      content += `Store: ${selectedStores.primaryStore.name}\n`;
    }
    content += `\n${'='.repeat(50)}\n\n`;

    categories.forEach(category => {
      content += `${category}\n${'-'.repeat(category.length)}\n`;
      shoppingList[category].forEach(item => {
        const key = `${category}-${shoppingList[category].indexOf(item)}`;
        const checked = checkedItems[key] ? '✓ ' : '☐ ';
        content += `${checked}${item.item} - ${item.quantity}`;
        if (isComparisonMode && item.primaryStorePrice && item.comparisonStorePrice) {
          content += ` (${selectedStores.primaryStore.name}: ${item.primaryStorePrice}, ${selectedStores.comparisonStore.name}: ${item.comparisonStorePrice})`;
        } else if (item.estimatedPrice) {
          content += ` - ${item.estimatedPrice}`;
        }
        content += '\n';
      });
      content += '\n';
    });

    // Add custom items
    if (customItemsWithPrices.length > 0) {
      content += `Custom Items\n${'-'.repeat(12)}\n`;
      customItemsWithPrices.forEach((item, index) => {
        const key = `custom-${index}`;
        const checked = checkedItems[key] ? '✓ ' : '☐ ';
        content += `${checked}${item.item} - ${item.quantity}`;
        if (item.estimatedPrice) {
          content += ` - ${item.estimatedPrice}`;
        }
        content += '\n';
      });
      content += '\n';
    }

    // Add totals
    const adjusted = calculateAdjustedTotal();
    if (isComparisonMode && priceComparison) {
      content += `\n${'='.repeat(50)}\n`;
      content += `Original Totals:\n`;
      content += `${selectedStores.primaryStore.name}: ${priceComparison.primaryStoreTotal}\n`;
      content += `${selectedStores.comparisonStore.name}: ${priceComparison.comparisonStoreTotal}\n`;
      if (adjusted.hasAdjustment) {
        content += `\nAdjusted Total (excluding owned items):\n`;
        content += `${selectedStores.primaryStore.name}: ${adjusted.adjustedPrimaryTotal}\n`;
        content += `${selectedStores.comparisonStore.name}: ${adjusted.adjustedComparisonTotal}\n`;
      }
    } else if (totalCost) {
      content += `\n${'='.repeat(50)}\n`;
      content += `Total: ${totalCost}\n`;
      if (adjusted.hasAdjustment) {
        content += `Adjusted Total (excluding owned items): ${adjusted.adjustedTotal}\n`;
      }
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping-list-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Track shopping list save/export
    const totalItems = categories.reduce((sum, cat) => sum + (shoppingList[cat]?.length || 0), 0);
    analyticsService.trackShoppingListSave(totalItems, { format: 'txt' });
  };

  // Calculate adjusted total excluding checked items
  const calculateAdjustedTotal = () => {
    const categories = Object.keys(shoppingList || {});
    let hasAdjustment = false;

    if (priceComparison && selectedStores?.comparisonStore) {
      // Comparison mode
      let adjustedPrimary = 0;
      let adjustedComparison = 0;

      categories.forEach(category => {
        shoppingList[category].forEach((item, index) => {
          const key = `${category}-${index}`;
          if (!checkedItems[key]) {
            const primaryPrice = parseFloat((item.primaryStorePrice || '$0').replace(/[^0-9.]/g, ''));
            const comparisonPrice = parseFloat((item.comparisonStorePrice || '$0').replace(/[^0-9.]/g, ''));
            adjustedPrimary += isNaN(primaryPrice) ? 0 : primaryPrice;
            adjustedComparison += isNaN(comparisonPrice) ? 0 : comparisonPrice;
          } else {
            hasAdjustment = true;
          }
        });
      });

      // Add custom items
      customItemsWithPrices.forEach((item, index) => {
        const key = `custom-${index}`;
        if (!checkedItems[key]) {
          const primaryPrice = parseFloat((item.primaryStorePrice || '$0').replace(/[^0-9.]/g, ''));
          const comparisonPrice = parseFloat((item.comparisonStorePrice || '$0').replace(/[^0-9.]/g, ''));
          adjustedPrimary += isNaN(primaryPrice) ? 0 : primaryPrice;
          adjustedComparison += isNaN(comparisonPrice) ? 0 : comparisonPrice;
        } else {
          hasAdjustment = true;
        }
      });

      return {
        hasAdjustment,
        adjustedPrimaryTotal: `$${adjustedPrimary.toFixed(2)}`,
        adjustedComparisonTotal: `$${adjustedComparison.toFixed(2)}`,
        savings: adjustedPrimary > adjustedComparison
          ? `Save $${(adjustedPrimary - adjustedComparison).toFixed(2)} at ${selectedStores.comparisonStore.name}`
          : adjustedComparison > adjustedPrimary
          ? `Save $${(adjustedComparison - adjustedPrimary).toFixed(2)} at ${selectedStores.primaryStore.name}`
          : null
      };
    } else if (totalCost) {
      // Single store mode
      let adjustedTotal = 0;

      categories.forEach(category => {
        shoppingList[category].forEach((item, index) => {
          const key = `${category}-${index}`;
          if (!checkedItems[key]) {
            const price = parseFloat((item.estimatedPrice || '$0').replace(/[^0-9.]/g, ''));
            adjustedTotal += isNaN(price) ? 0 : price;
          } else {
            hasAdjustment = true;
          }
        });
      });

      // Add custom items
      customItemsWithPrices.forEach((item, index) => {
        const key = `custom-${index}`;
        if (!checkedItems[key]) {
          const price = parseFloat((item.estimatedPrice || '$0').replace(/[^0-9.]/g, ''));
          adjustedTotal += isNaN(price) ? 0 : price;
        } else {
          hasAdjustment = true;
        }
      });

      return {
        hasAdjustment,
        adjustedTotal: `$${adjustedTotal.toFixed(2)}`
      };
    }

    return { hasAdjustment: false };
  };

  const generatePrintContent = () => {
    const categories = Object.keys(shoppingList || {});
    const isComparisonMode = priceComparison && selectedStores?.comparisonStore;

    // Helper to compare prices
    const getCheaperStore = (primaryPrice, comparisonPrice) => {
      if (!primaryPrice || !comparisonPrice) return null;
      const primary = parseFloat(primaryPrice.replace(/[^0-9.]/g, ''));
      const comparison = parseFloat(comparisonPrice.replace(/[^0-9.]/g, ''));
      if (isNaN(primary) || isNaN(comparison)) return null;
      if (primary < comparison) return 'primary';
      if (comparison < primary) return 'comparison';
      return 'equal';
    };

    const storeName = isComparisonMode
      ? `${selectedStores.primaryStore.name} vs ${selectedStores.comparisonStore.name}`
      : selectedStores?.primaryStore?.name || 'Shopping List';

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Shopping List - ${storeName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .store-info {
      color: #666;
      margin-bottom: 20px;
    }
    .category {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .category-title {
      background: #f0f0f0;
      padding: 10px;
      margin-bottom: 10px;
      font-weight: bold;
      border-left: 4px solid #667eea;
    }
    .item {
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
    }
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #667eea;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .item-details {
      flex: 1;
    }
    .item-name {
      font-weight: 500;
    }
    .item-quantity {
      color: #666;
      font-size: 14px;
    }
    .item-price {
      text-align: right;
      color: #667eea;
      font-weight: bold;
    }
    .total-cost {
      margin-top: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
    }
    .comparison-table th, .comparison-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .comparison-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .cheaper-price {
      color: #4caf50;
      font-weight: bold;
    }
    @media print {
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <h1>🛒 Shopping List</h1>
  <div class="store-info">${storeName}</div>
`;

    // Add each category
    categories.forEach(category => {
      html += `<div class="category"><h2 class="category-title">${category}</h2>`;

      if (isComparisonMode) {
        html += `<table class="comparison-table">
          <thead>
            <tr>
              <th>☐</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>${selectedStores.primaryStore.name}</th>
              <th>${selectedStores.comparisonStore.name}</th>
            </tr>
          </thead>
          <tbody>`;

        shoppingList[category].forEach(item => {
          const primaryPrice = item.primaryStorePrice || '-';
          const comparisonPrice = item.comparisonStorePrice || '-';
          const cheaperStore = getCheaperStore(item.primaryStorePrice, item.comparisonStorePrice);

          html += `<tr>
            <td><div class="checkbox"></div></td>
            <td>${item.item}</td>
            <td>${item.quantity}</td>
            <td class="${cheaperStore === 'primary' ? 'cheaper-price' : ''}">${primaryPrice}</td>
            <td class="${cheaperStore === 'comparison' ? 'cheaper-price' : ''}">${comparisonPrice}</td>
          </tr>`;
        });

        html += `</tbody></table>`;
      } else {
        shoppingList[category].forEach(item => {
          html += `<div class="item">
            <div class="checkbox"></div>
            <div class="item-details">
              <div class="item-name">${item.item}</div>
              <div class="item-quantity">${item.quantity}</div>
            </div>
            ${item.estimatedPrice ? `<div class="item-price">${item.estimatedPrice}</div>` : ''}
          </div>`;
        });
      }

      html += `</div>`;
    });

    // Add total cost
    if (isComparisonMode && priceComparison) {
      html += `<div class="total-cost">
        ${selectedStores.primaryStore.name}: ${priceComparison.primaryStoreTotal}<br>
        ${selectedStores.comparisonStore.name}: ${priceComparison.comparisonStoreTotal}<br>
        <span style="color: #4caf50; font-size: 18px; margin-top: 10px; display: block;">${priceComparison.savings || ''}</span>
      </div>`;
    } else if (totalCost) {
      html += `<div class="total-cost">Total: ${totalCost}</div>`;
    }

    html += `</body></html>`;
    return html;
  };

  const handleAddItemField = () => {
    setCustomItems([...customItems, '']);
  };

  const handleCustomItemChange = (index, value) => {
    const newItems = [...customItems];
    newItems[index] = value;
    setCustomItems(newItems);
  };

  const handleRemoveItemField = (index) => {
    const newItems = customItems.filter((_, i) => i !== index);
    setCustomItems(newItems.length === 0 ? [''] : newItems);
  };

  const handleAddToShoppingList = async () => {
    // Filter out empty items
    const itemsToAdd = customItems.filter(item => item.trim() !== '');

    if (itemsToAdd.length === 0) {
      alert('Please enter at least one item');
      return;
    }

    setAddingCustomItems(true);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/custom-item-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          items: itemsToAdd,
          primaryStore: selectedStores?.primaryStore?.name,
          comparisonStore: selectedStores?.comparisonStore?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get prices for custom items');
      }

      const data = await response.json();
      console.log('✅ Custom item prices received:', data);

      // Add the priced items to the custom items list
      setCustomItemsWithPrices(prev => [...prev, ...data.items]);

      // Reset the input fields
      setCustomItems(['']);

    } catch (error) {
      console.error('❌ Error adding custom items:', error);
      alert('Failed to add items. Please try again.');
    } finally {
      setAddingCustomItems(false);
    }
  };

  // Use consolidated list if user clicked consolidate button
  const displayList = isConsolidated ? consolidateShoppingList(shoppingList) : shoppingList;
  const categories = Object.keys(displayList || {});

  if (!displayList || categories.length === 0) {
    return (
      <div className="shopping-list-empty">
        <p>No shopping list available</p>
      </div>
    );
  }

  // Determine if we're in comparison mode
  const isComparisonMode = priceComparison && selectedStores?.comparisonStore;

  // Helper to compare prices and determine which is cheaper
  const getCheaperStore = (primaryPrice, comparisonPrice) => {
    if (!primaryPrice || !comparisonPrice) return null;

    // Extract numeric values from price strings like "$4.50"
    const primary = parseFloat(primaryPrice.replace(/[^0-9.]/g, ''));
    const comparison = parseFloat(comparisonPrice.replace(/[^0-9.]/g, ''));

    if (isNaN(primary) || isNaN(comparison)) return null;
    if (primary < comparison) return 'primary';
    if (comparison < primary) return 'comparison';
    return 'equal';
  };

  return (
    <div className="shopping-list-container">
      <div className="shopping-list-header">
        <h2>🛒 Shopping List</h2>
        {isComparisonMode ? (
          <p className="store-name">
            Comparing: {selectedStores.primaryStore.name} vs {selectedStores.comparisonStore.name}
          </p>
        ) : selectedStores?.primaryStore ? (
          <p className="store-name">For: {selectedStores.primaryStore.name}</p>
        ) : null}
        <p className="checkbox-hint">💡 Check items you already have to exclude them from the total</p>
        <div className="action-buttons">
          <button onClick={handlePrint} className="print-button">
            🖨️ Print
          </button>
          <button onClick={handleDownloadList} className="download-button">
            💾 Download
          </button>
          <button 
            onClick={() => setIsConsolidated(!isConsolidated)}
            className="consolidate-button"
            title="Combine similar items and convert units (e.g., 4 quarts milk → 1 gallon milk)"
          >
            {isConsolidated ? '📋 Show Original' : '🔄 Consolidate'}
          </button>
        </div>
      </div>

      {/* Add Custom Items Section */}
      <div className="custom-items-section">
        <h3>➕ Add More Items</h3>
        <div className="custom-items-inputs">
          {customItems.map((item, index) => (
            <div key={index} className="custom-item-input-row">
              <input
                type="text"
                value={item}
                onChange={(e) => handleCustomItemChange(index, e.target.value)}
                placeholder="Enter item name (e.g., 'milk', 'bananas')"
                className="custom-item-input"
              />
              {customItems.length > 1 && (
                <button
                  onClick={() => handleRemoveItemField(index)}
                  className="remove-item-btn"
                  title="Remove this item"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="custom-items-actions">
          <button onClick={handleAddItemField} className="add-field-btn">
            + Add Another Item
          </button>
          <button
            onClick={handleAddToShoppingList}
            className="add-to-list-btn"
            disabled={addingCustomItems}
          >
            {addingCustomItems ? 'Getting Prices...' : '🛒 Add to Shopping List'}
          </button>
        </div>
      </div>

      {/* Custom Items List */}
      {customItemsWithPrices.length > 0 && (
        <div className="shopping-list-content">
          <div className="category-section">
            <h3 className="category-title">Custom Items</h3>

            {isComparisonMode ? (
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th className="checkbox-col"></th>
                    <th className="item-col">Item</th>
                    <th className="quantity-col">Quantity</th>
                    <th className="price-col">{selectedStores.primaryStore.name}</th>
                    <th className="price-col">{selectedStores.comparisonStore.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {customItemsWithPrices.map((item, index) => {
                    const key = `custom-${index}`;
                    const cheaperStore = getCheaperStore(item.primaryStorePrice, item.comparisonStorePrice);

                    return (
                      <tr
                        key={index}
                        className={`shopping-item ${checkedItems[key] ? 'checked' : ''}`}
                      >
                        <td className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={checkedItems[key] || false}
                            onChange={() => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))}
                            className="item-checkbox"
                          />
                        </td>
                        <td className="item-col">{item.item}</td>
                        <td className="quantity-col">{item.quantity}</td>
                        <td className={`price-col ${cheaperStore === 'primary' ? 'cheaper-price' : ''}`}>
                          {item.primaryStorePrice || '-'}
                        </td>
                        <td className={`price-col ${cheaperStore === 'comparison' ? 'cheaper-price' : ''}`}>
                          {item.comparisonStorePrice || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <ul className="items-list">
                {customItemsWithPrices.map((item, index) => {
                  const key = `custom-${index}`;
                  return (
                    <li
                      key={index}
                      className={`shopping-item ${checkedItems[key] ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[key] || false}
                        onChange={() => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="item-checkbox"
                      />
                      <div className="item-details">
                        <span className="item-name">{item.item}</span>
                        <span className="item-quantity">{item.quantity}</span>
                        {item.estimatedPrice && (
                          <span className="item-price">{item.estimatedPrice}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="shopping-list-content">
        {categories.map((category) => (
          <div key={category} className="category-section">
            <h3 className="category-title">{category}</h3>

            {isComparisonMode ? (
              <>
                {/* Desktop table view */}
                <table className="comparison-table desktop-only">
                  <thead>
                    <tr>
                      <th className="checkbox-col"></th>
                      <th className="item-col">Item</th>
                      <th className="quantity-col">Quantity</th>
                      <th className="price-col">{selectedStores.primaryStore.name}</th>
                      <th className="price-col">{selectedStores.comparisonStore.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList[category].map((item, index) => {
                      const key = `${category}-${index}`;
                      const cheaperStore = getCheaperStore(item.primaryStorePrice, item.comparisonStorePrice);

                      return (
                        <tr
                          key={index}
                          className={`shopping-item ${checkedItems[key] ? 'checked' : ''}`}
                        >
                          <td className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={checkedItems[key] || false}
                              onChange={() => handleCheck(category, index)}
                              className="item-checkbox"
                            />
                          </td>
                          <td className="item-col">{item.item}</td>
                          <td className="quantity-col">{item.quantity}</td>
                          <td className={`price-col ${cheaperStore === 'primary' ? 'cheaper-price' : ''}`}>
                            {item.primaryStorePrice || '-'}
                          </td>
                          <td className={`price-col ${cheaperStore === 'comparison' ? 'cheaper-price' : ''}`}>
                            {item.comparisonStorePrice || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile card view */}
                <div className="mobile-comparison-cards mobile-only">
                  {displayList[category].map((item, index) => {
                    const key = `${category}-${index}`;
                    const cheaperStore = getCheaperStore(item.primaryStorePrice, item.comparisonStorePrice);

                    return (
                      <div key={index} className={`mobile-item-card ${checkedItems[key] ? 'checked' : ''}`}>
                        <div className="mobile-item-header">
                          <input
                            type="checkbox"
                            checked={checkedItems[key] || false}
                            onChange={() => handleCheck(category, index)}
                            className="item-checkbox"
                          />
                          <span className="mobile-item-name">{item.item}</span>
                          <span className="mobile-item-quantity">{item.quantity}</span>
                        </div>
                        <div className="mobile-price-comparison">
                          <div className={`mobile-store-price ${cheaperStore === 'primary' ? 'cheaper' : ''}`}>
                            <div className="mobile-store-name">{selectedStores.primaryStore.name}</div>
                            <div className="mobile-price-amount">{item.primaryStorePrice || '-'}</div>
                          </div>
                          <div className={`mobile-store-price ${cheaperStore === 'comparison' ? 'cheaper' : ''}`}>
                            <div className="mobile-store-name">{selectedStores.comparisonStore.name}</div>
                            <div className="mobile-price-amount">{item.comparisonStorePrice || '-'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              // Standard list view
              <ul className="items-list">
                {displayList[category].map((item, index) => {
                  const key = `${category}-${index}`;
                  return (
                    <li
                      key={index}
                      className={`shopping-item ${checkedItems[key] ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[key] || false}
                        onChange={() => handleCheck(category, index)}
                        className="item-checkbox"
                      />
                      <div className="item-details">
                        <span className="item-name">{item.item}</span>
                        <span className="item-quantity">{item.quantity}</span>
                        {item.estimatedPrice && (
                          <span className="item-price">{item.estimatedPrice}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Total Cost or Price Comparison Summary */}
      {(() => {
        const adjusted = calculateAdjustedTotal();

        if (isComparisonMode && priceComparison) {
          return (
            <div className="price-comparison-summary">
              <div className="comparison-totals">
                <div className="total-item">
                  <span className="total-label">{selectedStores.primaryStore.name} Total:</span>
                  <span className="total-value">{priceComparison.primaryStoreTotal}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">{selectedStores.comparisonStore.name} Total:</span>
                  <span className="total-value">{priceComparison.comparisonStoreTotal}</span>
                </div>
              </div>
              {adjusted.hasAdjustment && (
                <div className="adjusted-totals">
                  <p className="adjusted-label">After excluding owned items:</p>
                  <div className="comparison-totals">
                    <div className="total-item adjusted">
                      <span className="total-label">{selectedStores.primaryStore.name}:</span>
                      <span className="total-value">{adjusted.adjustedPrimaryTotal}</span>
                    </div>
                    <div className="total-item adjusted">
                      <span className="total-label">{selectedStores.comparisonStore.name}:</span>
                      <span className="total-value">{adjusted.adjustedComparisonTotal}</span>
                    </div>
                  </div>
                </div>
              )}
              {(adjusted.savings || priceComparison.savings) && (
                <div className="savings-banner">
                  💰 {adjusted.savings || priceComparison.savings}
                </div>
              )}
            </div>
          );
        } else if (totalCost) {
          return (
            <div className="shopping-list-total">
              <h3>Estimated Total: {totalCost}</h3>
              {adjusted.hasAdjustment && (
                <div className="adjusted-total">
                  <p className="adjusted-label">After excluding owned items:</p>
                  <h3 className="adjusted-value">{adjusted.adjustedTotal}</h3>
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

export default ShoppingList;
