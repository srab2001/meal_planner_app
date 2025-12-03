import React, { useState } from 'react';
import './ShoppingList.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function ShoppingList({ shoppingList, totalCost, priceComparison, selectedStores }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [customItems, setCustomItems] = useState(['']);
  const [addingCustomItems, setAddingCustomItems] = useState(false);
  const [customItemsWithPrices, setCustomItemsWithPrices] = useState([]);

  const handleCheck = (category, index) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrint = () => {
    window.print();
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
      const response = await fetch(`${API_BASE}/api/custom-item-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

  const categories = Object.keys(shoppingList || {});

  if (!shoppingList || categories.length === 0) {
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
        <button onClick={handlePrint} className="print-button">
          🖨️ Print List
        </button>
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
              // Comparison table view
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
                  {shoppingList[category].map((item, index) => {
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
            ) : (
              // Standard list view
              <ul className="items-list">
                {shoppingList[category].map((item, index) => {
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
      {isComparisonMode && priceComparison ? (
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
          {priceComparison.savings && (
            <div className="savings-banner">
              💰 {priceComparison.savings}
            </div>
          )}
        </div>
      ) : totalCost ? (
        <div className="shopping-list-total">
          <h3>Estimated Total: {totalCost}</h3>
        </div>
      ) : null}
    </div>
  );
}

export default ShoppingList;
