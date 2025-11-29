import React, { useState } from 'react';
import './ShoppingList.css';

function ShoppingList({ shoppingList, totalCost, storeName }) {
  const [checkedItems, setCheckedItems] = useState({});

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

  const categories = Object.keys(shoppingList || {});

  if (!shoppingList || categories.length === 0) {
    return (
      <div className="shopping-list-empty">
        <p>No shopping list available</p>
      </div>
    );
  }

  return (
    <div className="shopping-list-container">
      <div className="shopping-list-header">
        <h2>🛒 Shopping List</h2>
        {storeName && <p className="store-name">For: {storeName}</p>}
        <button onClick={handlePrint} className="print-button">
          🖨️ Print List
        </button>
      </div>

      <div className="shopping-list-content">
        {categories.map((category) => (
          <div key={category} className="category-section">
            <h3 className="category-title">{category}</h3>
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
          </div>
        ))}
      </div>

      {totalCost && (
        <div className="shopping-list-total">
          <h3>Estimated Total: {totalCost}</h3>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;