import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import AppContext from "../Context/Context";
import API from "../axios";

const Product = () => {
  const { id } = useParams();
  const { addToCart, removeFromCart, refreshData } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch product data when component mounts or id changes
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // First try to get the product from the context or API
        const response = await API.get(`/product/${id}`);
        console.log('API Response:', response);
        
        if (response.data) {
          setProduct(response.data);
          setError(null);
        } else {
          setError('Product data is empty');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details");
        
        // Try to use placeholder data as fallback
        const placeholders = [
          { id: 1, name: "Smartphone X", description: "Latest flagship smartphone", brand: "TechBrand", category: "MOBILE", price: 399 },
          { id: 2, name: "Laptop Pro", description: "High-performance laptop", brand: "ComputerCo", category: "LAPTOP", price: 999 },
          { id: 3, name: "Wireless Headphones", description: "Noise-cancelling headphones", brand: "AudioTech", category: "AUDIO", price: 199 },
        ];
        
        const placeholder = placeholders.find(p => p.id === parseInt(id));
        if (placeholder) {
          setProduct(placeholder);
          setError("Using placeholder data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const deleteProduct = async () => {
    try {
      await API.delete(`/product/${id}`);
      removeFromCart(id);
      alert("Product deleted successfully");
      refreshData();
      navigate("/");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleEditClick = () => {
    navigate(`/product/update/${id}`);
  };

  const [addedToCart, setAddedToCart] = useState(false);
  const [quantityError, setQuantityError] = useState("");
  const { cart } = useContext(AppContext);

  const handleAddToCart = () => {
    if (product) {
      // Get the actual quantity from the server
      const availableStock = product.stockQuantity || 0;
      
      // Calculate how many of this item are already in the cart
      const existingCartItem = cart.find(item => item.id === product.id);
      const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
      
      // Check if adding one more would exceed available stock
      if (currentCartQuantity + 1 > availableStock) {
        setQuantityError(`Cannot add more items. Available stock: ${availableStock}, Already in cart: ${currentCartQuantity}`);
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          setQuantityError("");
        }, 3000);
        return;
      }
      
      // Clear any previous error
      setQuantityError("");
      
      // Add product with quantity 1
      addToCart({...product, quantity: 1});
      
      // Show success message
      setAddedToCart(true);
      
      // Reset message after 3 seconds
      setTimeout(() => {
        setAddedToCart(false);
      }, 3000);
    }
  };
  


  if (loading) {
    return (
      <div className="loading-container" style={{ padding: "5rem", textAlign: "center" }}>
        <h2>Loading product details...</h2>
      </div>
    );
  }
  
  if (error && !product) {
    return (
      <div className="error-container" style={{ padding: "5rem", textAlign: "center", color: "var(--danger-color)" }}>
        <h2>Error loading product</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>Return to Home</button>
      </div>
    );
  }

  // If we have a product, display it
  return (
    <div className="product-detail-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Product header with name and category */}
      <div className="product-header" style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{product.name}</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>{product.category}</span>
          <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>|</span>
          <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>{product.brand}</span>
        </div>
      </div>

      {/* Product content with image and details */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        {/* Product image */}
        <div style={{ flex: "1", minWidth: "300px" }}>
          <div style={{ backgroundColor: "var(--bg-accent)", borderRadius: "8px", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img
              src={`http://localhost:8080/api/product/${id}/image`}
              alt={product.name}
              style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x400?text=' + (product.name || 'Product');
              }}
            />
          </div>
        </div>

        {/* Product details */}
        <div style={{ flex: "1", minWidth: "300px" }}>
          {/* Price */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "2.5rem", color: "var(--primary-color)" }}>₹{product.price}</h2>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Available stock display */}
            <div style={{ 
              fontSize: "0.9rem", 
              color: product.stockQuantity > 0 ? "var(--text-secondary)" : "var(--danger-color)",
              fontWeight: product.stockQuantity > 0 ? "normal" : "bold"
            }}>
              {product.stockQuantity > 0 ? `Available: ${product.stockQuantity}` : "OUT OF STOCK"}
            </div>
            
            {/* Quantity error message */}
            {quantityError && (
              <div style={{ color: "var(--danger-color)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                {quantityError}
              </div>
            )}
            
            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              style={{
                padding: "1rem",
                backgroundColor: product.stockQuantity <= 0 
                  ? "var(--bg-secondary)" 
                  : (addedToCart ? "var(--success-color)" : "var(--primary-color)"),
                color: product.stockQuantity <= 0 ? "var(--text-secondary)" : "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: product.stockQuantity <= 0 ? "not-allowed" : "pointer",
                transition: "background-color 0.3s ease",
                opacity: product.stockQuantity <= 0 ? 0.7 : 1
              }}
            >
              {product.stockQuantity <= 0 
                ? "Out of Stock" 
                : (addedToCart ? "Added to Cart" : "Add to Cart")}
            </button>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleEditClick}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "var(--bg-accent)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Update
              </button>
              <button
                onClick={deleteProduct}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "var(--danger-color)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
