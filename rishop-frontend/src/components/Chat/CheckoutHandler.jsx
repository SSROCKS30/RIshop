import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ChatContext from '../../Context/ChatContext';
import AppContext from '../../Context/Context';
import './CheckoutHandler.css';

const CheckoutHandler = ({ cartItems, onCancel, onSuccess }) => {
  const navigate = useNavigate();
  const { initiateConversation } = useContext(ChatContext);
  const { clearCart } = useContext(AppContext);
  
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('confirm'); // 'confirm', 'processing', 'success', 'error'
  const [error, setError] = useState(null);
  const [processedConversations, setProcessedConversations] = useState([]);

  // Group cart items by seller
  const groupItemsBySeller = () => {
    const sellerGroups = cartItems.reduce((groups, item) => {
      const sellerId = item.sellerId || item.userId;
      const sellerName = item.sellerName || item.userName || 'Unknown Seller';
      
      if (!groups[sellerId]) {
        groups[sellerId] = {
          sellerId,
          sellerName,
          items: []
        };
      }
      
      groups[sellerId].items.push(item);
      return groups;
    }, {});
    
    return Object.values(sellerGroups);
  };

  const sellerGroups = groupItemsBySeller();

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleContactSellers = async () => {
    setProcessing(true);
    setStep('processing');
    setError(null);
    
    const conversations = [];
    
    try {
      // For each seller group, initiate conversations for each product
      for (const sellerGroup of sellerGroups) {
        for (const item of sellerGroup.items) {
          try {
            const result = await initiateConversation(item.id);
            
            if (result.success) {
              conversations.push({
                ...result.conversation,
                product: item,
                seller: sellerGroup.sellerName
              });
            } else {
              throw new Error(result.error || `Failed to start conversation for ${item.name}`);
            }
            
            // Small delay between requests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Error initiating conversation for ${item.name}:`, error);
            throw new Error(`Failed to contact seller for ${item.name}`);
          }
        }
      }
      
      setProcessedConversations(conversations);
      setStep('success');
      
      // Clear the cart since conversations have been initiated
      clearCart();
      
      // Call success callback
      if (onSuccess) {
        onSuccess(conversations);
      }
      
      // Navigate to chat after a short delay
      setTimeout(() => {
        navigate('/chat');
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to contact sellers. Please try again.');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  };

  const renderConfirmStep = () => (
    <div className="checkout-handler">
      <div className="checkout-header">
        <h2>Contact Sellers to Complete Purchase</h2>
        <p>You'll start conversations with the sellers of these products to negotiate and finalize your purchase.</p>
      </div>

      <div className="sellers-summary">
        <h3>You will contact {sellerGroups.length} seller{sellerGroups.length > 1 ? 's' : ''}:</h3>
        
        {sellerGroups.map((sellerGroup, index) => (
          <div key={sellerGroup.sellerId} className="seller-group">
            <div className="seller-info">
              <h4>{sellerGroup.sellerName}</h4>
              <span className="item-count">{sellerGroup.items.length} item{sellerGroup.items.length > 1 ? 's' : ''}</span>
            </div>
            
            <div className="seller-items">
              {sellerGroup.items.map(item => (
                <div key={item.id} className="checkout-item">
                  <img
                    src={item.imageUrl || item.image}
                    alt={item.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/60x60?text=${item.name}`;
                    }}
                  />
                  <div className="item-details">
                    <h5>{item.name}</h5>
                    <p className="item-price">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="item-total">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="checkout-summary">
        <div className="total-section">
          <h3>Total Amount: ₹{getTotalPrice()}</h3>
          <p className="note">This amount will be negotiated with each seller through chat.</p>
        </div>
      </div>

      <div className="checkout-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          Back to Cart
        </button>
        <button onClick={handleContactSellers} className="btn btn-primary">
          Contact Sellers
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="checkout-handler processing">
      <div className="processing-content">
        <div className="loading-spinner"></div>
        <h3>Contacting Sellers...</h3>
        <p>Starting conversations for your selected items</p>
        
        {processedConversations.length > 0 && (
          <div className="processed-items">
            <h4>Conversations Started:</h4>
            <ul>
              {processedConversations.map((conv, index) => (
                <li key={index}>
                  {conv.product.name} - {conv.seller}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="checkout-handler success">
      <div className="success-content">
        <div className="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </div>
        <h3>Conversations Started Successfully!</h3>
        <p>You can now chat with sellers to negotiate prices and complete your purchases.</p>
        
        <div className="success-summary">
          <h4>Started {processedConversations.length} conversation{processedConversations.length > 1 ? 's' : ''}:</h4>
          <ul>
            {processedConversations.map((conv, index) => (
              <li key={index}>
                <strong>{conv.product.name}</strong> with {conv.seller}
              </li>
            ))}
          </ul>
        </div>
        
        <p className="redirect-note">Redirecting to chat...</p>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="checkout-handler error">
      <div className="error-content">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>Failed to Contact Sellers</h3>
        <p>{error}</p>
        
        <div className="error-actions">
          <button onClick={() => setStep('confirm')} className="btn btn-primary">
            Try Again
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="checkout-handler-overlay">
      <div className="checkout-handler-modal">
        {step === 'confirm' && renderConfirmStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'success' && renderSuccessStep()}
        {step === 'error' && renderErrorStep()}
      </div>
    </div>
  );
};

CheckoutHandler.propTypes = {
  cartItems: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CheckoutHandler; 