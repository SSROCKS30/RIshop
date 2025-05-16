import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../Context/Context";

const Home = () => {
  const { products, displayedProducts, isLoading, addToCart, selectedCategory } = useContext(AppContext);
  const navigate = useNavigate();

  // Get products to display using useMemo to prevent unnecessary recalculations
  const productsToDisplay = useMemo(() => {
    // Use the displayed products from context
    if (displayedProducts && displayedProducts.length > 0) {
      return displayedProducts;
    }
    
    // Fallback to all products
    if (products && products.length > 0) return products;
    
    // Fallback placeholder products if no products loaded
    return [
      { id: 1, name: "Smartphone X", description: "Latest flagship smartphone", brand: "TechBrand", category: "Electronics", price: 12999 },
      { id: 2, name: "Laptop Pro", description: "High-performance laptop", brand: "ComputerCo", category: "Computers", price: 49999 },
      { id: 3, name: "Wireless Headphones", description: "Noise-cancelling headphones", brand: "AudioTech", category: "Audio", price: 2499 },
      { id: 4, name: "Smart Watch", description: "Fitness and health tracking", brand: "WearableTech", category: "Wearables", price: 3999 },
      { id: 5, name: "Bluetooth Speaker", description: "Portable wireless speaker", brand: "SoundMaster", category: "Audio", price: 1499 },
      { id: 6, name: "Fitness Tracker", description: "Activity and sleep monitor", brand: "FitTech", category: "Wearables", price: 1999 },
    ];
  }, [displayedProducts, products]); // Only recalculate when these dependencies change

  if (isLoading) {
    return <div className="loading-container">Loading products...</div>;
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Discover Amazing Products</h1>
          <p>Shop the latest trends with best prices</p>
        </div>
      </div>
      
      <div className="products-section">
        <h2 className="section-title">{selectedCategory ? `Category: ${selectedCategory}` : 'Featured Products'}</h2>
        
        <div className="simple-grid">
          {productsToDisplay.map((product) => (
            <div className="simple-card" key={product.id}>
              <div className="product-image-container" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: 'pointer', position: 'relative' }}>
                {/* Use image data from product object if available, otherwise use a placeholder */}
                {product.imageData ? (
                  <img 
                    className="product-image" 
                    src={`data:${product.imageType};base64,${product.imageData}`} 
                    alt={product.name} 
                  />
                ) : (
                  <img 
                    className="product-image" 
                    src={`/placeholder.png`} 
                    alt={product.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/300x300?text=No+Image';
                    }}
                  />
                )}
                {product.stockQuantity <= 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="simple-card-content">
                <h3 onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: 'pointer' }}>{product.name}</h3>
                <p className="brand">{product.brand}</p>
                <div className="price" style={{ fontWeight: 'bold' }}>₹{product.price}</div>
                <button 
                  className="cart-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                    alert('Product added to cart');
                  }}
                  disabled={product.stockQuantity <= 0}
                  style={{
                    cursor: product.stockQuantity <= 0 ? 'not-allowed' : 'pointer',
                    opacity: product.stockQuantity <= 0 ? 0.6 : 1,
                    backgroundColor: product.stockQuantity <= 0 ? 'var(--bg-secondary)' : 'var(--primary-color)',
                    color: product.stockQuantity <= 0 ? 'var(--text-secondary)' : 'white'
                  }}
                >
                  {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
