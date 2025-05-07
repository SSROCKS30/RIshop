import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiTrash2, FiMinus, FiPlus, FiCheck } from "react-icons/fi";
import AppContext from "../Context/Context";
import API from "../axios";

const Cart = () => {
  const { cart, updateCartItemQuantity, removeFromCart, clearCart, refreshData } = useContext(AppContext);
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Calculate total price
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // State for checkout status and errors
  const [checkoutStatus, setCheckoutStatus] = useState({ success: false, error: null });
  const [processingItems, setProcessingItems] = useState([]);

  // State for tracking stock validation issues
  const [stockValidation, setStockValidation] = useState({ checking: false, issues: [] });

  // Function to check if all items in cart have sufficient stock
  const validateCartStock = async () => {
    setStockValidation({ checking: true, issues: [] });
    const issues = [];
    
    try {
      // Check each item's available stock
      for (const item of cart) {
        // Get current product stock from server
        const response = await API.get(`/product/${item.id}`);
        const availableStock = response.data.stockQuantity || 0;
        
        // Check if cart quantity exceeds available stock
        if (item.quantity > availableStock) {
          issues.push({
            id: item.id,
            name: item.name,
            requestedQuantity: item.quantity,
            availableStock: availableStock
          });
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Error validating stock:', error);
      throw new Error('Failed to validate product stock');
    } finally {
      setStockValidation({ checking: false, issues });
    }
  };

  // Handle checkout button click
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    setCheckoutStatus({ success: false, error: null });
    setProcessingItems([]);
    
    try {
      // First validate all cart items have sufficient stock
      const stockIssues = await validateCartStock();
      
      // If there are stock issues, stop checkout process
      if (stockIssues.length > 0) {
        setCheckoutStatus({ 
          success: false, 
          error: 'Some items have insufficient stock. Please update quantities.'
        });
        return;
      }
      
      // Process each cart item one by one
      for (const item of cart) {
        setProcessingItems(prev => [...prev, item.id]);
        
        // Call the API to update the quantity in the backend
        await API.put(`cart/product/${item.id}/quantity/${item.quantity}`);
        
        // Short delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // All items processed successfully
      setCheckoutStatus({ 
        success: true, 
        error: null 
      });
      
      // Clear the cart after successful checkout
      clearCart();
      
      // Refresh product data to get updated quantities
      refreshData();
      
      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutStatus({ 
        success: false, 
        error: 'Failed to complete checkout. Please try again.' 
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="cart-page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", textAlign: "center" }}>Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-cart" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
            Your cart is empty
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "var(--primary-color)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: "pointer"
            }}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          {/* Cart items */}
          <div className="cart-items" style={{ marginBottom: "2rem" }}>
            <div className="cart-header" style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr auto", 
              padding: "1rem 0", 
              borderBottom: "1px solid var(--border-color)",
              fontWeight: "bold"
            }}>
              <div>Image</div>
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Total</div>
              <div></div>
            </div>

            {cart.map((item) => (
              <motion.div
                key={item.id}
                className="cart-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr auto", 
                  padding: "1rem 0", 
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-color)"
                }}
              >
                {/* Product Image */}
                <div className="cart-item-image">
                  <img
                    src={`http://localhost:8080/api/product/${item.id}/image`}
                    alt={item.name}
                    style={{ width: "60px", height: "60px", objectFit: "contain" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/60x60?text=' + (item.name || 'Product');
                    }}
                  />
                </div>

                {/* Product Name */}
                <div className="cart-item-details">
                  <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{item.name}</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{item.category}</div>
                </div>

                {/* Price */}
                <div className="cart-item-price">₹{item.price}</div>

                {/* Quantity */}
                <div className="cart-item-quantity" style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    style={{
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "var(--bg-accent)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    <FiMinus />
                  </button>
                  <span style={{ margin: "0 0.5rem" }}>{item.quantity}</span>
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    style={{
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "var(--bg-accent)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    <FiPlus />
                  </button>
                </div>

                {/* Total */}
                <div className="cart-item-total">₹{item.price * item.quantity}</div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--danger-color)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  aria-label="Remove item"
                >
                  <FiTrash2 />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Cart summary and actions */}
          <div className="cart-summary" style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "1rem",
            backgroundColor: "var(--bg-accent)",
            padding: "1.5rem",
            borderRadius: "8px",
            marginTop: "2rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={clearCart}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "var(--danger-color)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Clear Cart
              </button>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Continue Shopping
              </button>
            </div>

            <div className="cart-totals" style={{ 
              marginTop: "1rem", 
              display: "flex", 
              flexDirection: "column",
              gap: "0.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>₹{totalPrice}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontWeight: "bold",
                fontSize: "1.2rem",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "0.5rem",
                marginTop: "0.5rem"
              }}>
                <span>Total:</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            {/* Checkout status message */}
            {checkoutStatus.error && (
              <div style={{ 
                color: "var(--danger-color)", 
                padding: "0.75rem", 
                backgroundColor: "rgba(255, 0, 0, 0.1)", 
                borderRadius: "4px",
                marginTop: "1rem"
              }}>
                {checkoutStatus.error}
              </div>
            )}
            
            {/* Stock validation issues */}
            {stockValidation.issues.length > 0 && (
              <div style={{ 
                marginTop: "1rem",
                padding: "0.75rem", 
                backgroundColor: "rgba(255, 200, 0, 0.1)", 
                borderRadius: "4px",
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "var(--warning-color)" }}>
                  Stock Availability Issues:
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  {stockValidation.issues.map(issue => (
                    <li key={issue.id} style={{ marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "bold" }}>{issue.name}</span>: 
                      Requested: {issue.requestedQuantity}, 
                      Available: {issue.availableStock}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  Please adjust quantities before checkout.
                </div>
              </div>
            )}
            
            {checkoutStatus.success && (
              <div style={{ 
                color: "var(--success-color)", 
                padding: "0.75rem", 
                backgroundColor: "rgba(0, 255, 0, 0.1)", 
                borderRadius: "4px",
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <FiCheck /> Order placed successfully! Redirecting...
              </div>
            )}
            
            {/* Processing items indicators */}
            {isCheckingOut && processingItems.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Processing items...</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {cart.map(item => (
                    <div 
                      key={item.id}
                      style={{ 
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        backgroundColor: processingItems.includes(item.id) 
                          ? "var(--primary-color)" 
                          : "var(--bg-secondary)",
                        color: processingItems.includes(item.id) 
                          ? "white" 
                          : "var(--text-secondary)",
                        fontSize: "0.8rem",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || checkoutStatus.success || cart.length === 0}
              style={{
                padding: "1rem",
                backgroundColor: checkoutStatus.success 
                  ? "var(--success-color)" 
                  : "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: (isCheckingOut || checkoutStatus.success || cart.length === 0) 
                  ? "not-allowed" 
                  : "pointer",
                marginTop: "1rem",
                position: "relative",
                overflow: "hidden",
                opacity: cart.length === 0 ? 0.7 : 1
              }}
            >
              {isCheckingOut ? (
                <>
                  <span style={{ visibility: "hidden" }}>Processing Checkout</span>
                  <div className="loading-spinner" style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                  }}></div>
                </>
              ) : checkoutStatus.success ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <FiCheck /> Order Complete
                </span>
              ) : (
                "Proceed to Checkout"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
