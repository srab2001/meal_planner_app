import React, { useState } from 'react';
import './ProductRecommendations.css';

function ProductRecommendations({ products, mealName }) {
  const [expanded, setExpanded] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  // Amazon Associates tracking ID (replace with your actual ID after signing up)
  const AMAZON_ASSOCIATE_ID = 'your-amazon-associate-id-20';

  // Generate Amazon affiliate link
  const generateAmazonLink = (searchTerm) => {
    const encodedSearch = encodeURIComponent(searchTerm);
    return `https://www.amazon.com/s?k=${encodedSearch}&tag=${AMAZON_ASSOCIATE_ID}`;
  };

  const visibleProducts = expanded ? products : products.slice(0, 3);

  return (
    <div className="product-recommendations">
      <div className="product-recommendations-header">
        <h4>
          <span className="sparkle-icon">✨</span>
          Elevate Your {mealName} Experience
        </h4>
        <p className="product-subtitle">Premium items to make this meal extraordinary</p>
      </div>

      <div className="products-grid">
        {visibleProducts.map((product, index) => (
          <a
            key={index}
            href={generateAmazonLink(product.name)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="product-card"
          >
            <div className="product-icon">{product.icon || '🛍️'}</div>
            <div className="product-info">
              <h5 className="product-name">{product.name}</h5>
              <p className="product-description">{product.description}</p>
              {product.priceRange && (
                <p className="product-price">{product.priceRange}</p>
              )}
            </div>
            <div className="product-cta">
              <span>View on Amazon</span>
              <span className="arrow">→</span>
            </div>
          </a>
        ))}
      </div>

      {products.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="expand-products-btn"
        >
          {expanded ? 'Show Less' : `Show ${products.length - 3} More Items`}
        </button>
      )}

      <div className="affiliate-disclosure">
        <small>
          💡 We may earn a commission from qualifying purchases made through these links at no additional cost to you.
        </small>
      </div>
    </div>
  );
}

export default ProductRecommendations;
