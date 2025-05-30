import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiTrash2, FiMinus, FiPlus, FiMessageCircle } from "react-icons/fi";
import AppContext from "../Context/Context";
import CheckoutHandler from "./Chat/CheckoutHandler";

const Cart = () => {
  const { cart, updateCartItemQuantity, removeFromCart, clearCart } = useContext(AppContext);
  const navigate = useNavigate();
  const [showCheckoutHandler, setShowCheckoutHandler] = useState(false);

  // Calculate total price
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Handle starting conversations with sellers
  const handleContactSellers = () => {
    if (cart.length === 0) return;
    setShowCheckoutHandler(true);
  };

  const handleCheckoutCancel = () => {
    setShowCheckoutHandler(false);
  };

  const handleCheckoutSuccess = (conversations) => {
    console.log('Conversations started:', conversations);
    setShowCheckoutHandler(false);
    // The CheckoutHandler will navigate to /chat automatically
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
                    src={item.imageUrl || 'https://via.placeholder.com/60x60?text=' + (item.name || 'Product')}
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
                  {item.sellerName && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      Sold by: {item.sellerName}
                    </div>
                  )}
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

            {/* Chat-based checkout explanation */}
            <div style={{
              backgroundColor: "#e7f3ff",
              border: "1px solid #b8daff",
              borderRadius: "8px",
              padding: "1rem",
              marginTop: "1rem"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                marginBottom: "0.5rem",
                color: "#004085",
                fontWeight: "bold"
              }}>
                <FiMessageCircle />
                <span>Chat-Based Purchase</span>
              </div>
              <p style={{ 
                margin: 0, 
                fontSize: "0.9rem", 
                color: "#004085",
                lineHeight: "1.4"
              }}>
                Contact sellers directly to negotiate prices and finalize your purchase. 
                You'll start individual conversations for each product with their respective sellers.
              </p>
            </div>
            
            <button
              onClick={handleContactSellers}
              disabled={cart.length === 0}
              style={{
                padding: "1rem",
                backgroundColor: cart.length === 0 ? "var(--text-secondary)" : "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: cart.length === 0 ? "not-allowed" : "pointer",
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: cart.length === 0 ? 0.7 : 1
              }}
            >
              <FiMessageCircle />
              Contact Sellers
            </button>
          </div>
        </div>
      )}

      {/* Checkout Handler Modal */}
      {showCheckoutHandler && (
        <CheckoutHandler
          cartItems={cart}
          onCancel={handleCheckoutCancel}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};

export default Cart;
