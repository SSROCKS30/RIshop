import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContext from '../Context/Context';
import API from '../axios';
import { FiUser, FiList, FiPackage, FiEdit3, FiEye, FiTrash2, FiPlus, FiCalendar, FiDollarSign, FiShoppingBag, FiLogOut } from 'react-icons/fi';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { 
    theme, 
    user, 
    userProducts, 
    userOrders, 
    isLoadingProfile,
    fetchAllProfileData,
    fetchUserProfile,
    fetchUserProducts,
    fetchUserOrders,
    authToken,
    logout
  } = useContext(AppContext);
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load profile data when component mounts
  const loadProfileData = useCallback(async () => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    
    if (isInitialLoad) {
      await fetchAllProfileData();
      setIsInitialLoad(false);
    }
  }, [authToken, isInitialLoad, fetchAllProfileData, navigate]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // If not authenticated, redirect to login
  if (!authToken) {
    return null; // Component will redirect in useEffect
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Get status class for orders
  const getOrderStatus = (order) => {
    // Determine status based on order fields
    if (order.completedAt) {
      return 'Completed';
    } else if (order.orderDate) {
      return 'Pending';
    }
    return 'Processing';
  };

  const getStatusClass = (order) => {
    const status = getOrderStatus(order);
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-delivered';
      case 'delivered': return 'status-delivered';
      case 'shipped': return 'status-shipped';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Handle navigation to product edit
  const handleEditProduct = (productId) => {
    navigate(`/product/update/${productId}`);
  };

  // Handle navigation to product view
  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Handle navigation to add new product
  const handleAddNewProduct = () => {
    navigate('/add_product');
  };

  // Handle delete product
  const handleDeleteProduct = async (productId, productName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      // Make API call to delete the product
      const response = await API.delete(`/product/${productId}`);
      
      // If we get here, the deletion was successful
      await fetchUserProducts(); // Refresh the products list
      alert(`Product "${productName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response?.status === 403) {
        alert('You can only delete your own products.');
      } else if (error.response?.status === 404) {
        alert('Product not found.');
      } else {
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      logout(); // This will clear the token and redirect
      navigate('/login');
    }
  };

  if (isInitialLoad && isLoadingProfile) {
    return (
      <div className="profile-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className={`profile-page-container ${theme || 'light-theme'}`}>
      {/* Profile Header */}
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-avatar">
          <FiUser size={80} className="profile-icon-large" />
        </div>
        <h2>{user?.username || user?.name || 'User'}</h2>
        <p className="user-email">{user?.email || 'No email provided'}</p>
        <p className="member-since">
          <FiCalendar size={16} />
          Member since: {formatDate(user?.createdAt)}
        </p>
        <div className="profile-actions">
          <button className="edit-profile-button" onClick={() => console.log('Edit profile - To be implemented')}>
            <FiEdit3 /> Edit Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="profile-stats">
        <div className="stat-item">
          <FiShoppingBag size={24} />
          <span className="stat-number">{userOrders.length}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="stat-item">
          <FiPackage size={24} />
          <span className="stat-number">{userProducts.length}</span>
          <span className="stat-label">Products</span>
        </div>
        <div className="stat-item">
          <FiDollarSign size={24} />
          <span className="stat-number">
            {formatCurrency(userOrders.reduce((total, order) => total + (order.totalAmount || 0), 0))}
          </span>
          <span className="stat-label">Total Spent</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FiList /> Order History
        </button>
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <FiPackage /> My Products
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'orders' && (
          <div className="profile-section">
            <div className="section-header">
              <h3><FiList /> Order History</h3>
              <button 
                className="refresh-button"
                onClick={fetchUserOrders}
                disabled={isLoadingProfile}
              >
                {isLoadingProfile ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {isLoadingProfile ? (
              <div className="section-loading">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : userOrders.length > 0 ? (
              <div className="order-list">
                {userOrders.map(order => (
                  <div key={order.id} className="order-item card-style">
                    <div className="order-header">
                      <h4>Order #{order.id}</h4>
                      <span className={`order-status ${getStatusClass(order)}`}>
                        {getOrderStatus(order) || 'Pending'}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><FiCalendar size={14} /> Date: {formatDate(order.orderDate || order.createdAt)}</p>
                      <p><FiDollarSign size={14} /> Total: {formatCurrency(order.totalAmount)}</p>
                      <p>Items: {order.orderItems?.length || 0}</p>
                    </div>
                    <div className="order-actions">
                      <button 
                        className="view-order-details-button"
                        onClick={() => console.log('View order details:', order.id)}
                      >
                        <FiEye /> View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiShoppingBag size={48} />
                <h4>No orders yet</h4>
                <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
                <button className="start-shopping-button" onClick={() => navigate('/')}>
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="profile-section">
            <div className="section-header">
              <h3><FiPackage /> My Products</h3>
              <div className="section-actions">
                <button 
                  className="refresh-button"
                  onClick={fetchUserProducts}
                  disabled={isLoadingProfile}
                >
                  {isLoadingProfile ? 'Loading...' : 'Refresh'}
                </button>
                <button className="add-new-product-button" onClick={handleAddNewProduct}>
                  <FiPlus /> Add Product
                </button>
              </div>
            </div>
            
            {isLoadingProfile ? (
              <div className="section-loading">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : userProducts.length > 0 ? (
              <div className="uploaded-products-list">
                {userProducts.map(product => (
                  <div key={product.id} className="product-item-card card-style">
                    <div className="product-image-section">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/80?text=No+Image'} 
                        alt={product.name}
                        className="product-thumbnail"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80?text=Error';
                        }}
                      />
                      <div className={`stock-indicator ${product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="product-category">{product.category}</p>
                      <p className="product-brand">{product.brand}</p>
                      <div className="product-pricing">
                        <span className="product-price">{formatCurrency(product.price)}</span>
                        <span className="product-stock">Stock: {product.stockQuantity}</span>
                      </div>
                      <p className="product-date">Added: {formatDate(product.createdAt)}</p>
                    </div>
                    <div className="product-actions">
                      <button 
                        className="view-product-button"
                        onClick={() => handleViewProduct(product.id)}
                        title="View Product"
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="edit-product-button"
                        onClick={() => handleEditProduct(product.id)}
                        title="Edit Product"
                      >
                        <FiEdit3 />
                      </button>
                      <button 
                        className="delete-product-button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        title="Delete Product"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiPackage size={48} />
                <h4>No products uploaded</h4>
                <p>You haven't uploaded any products yet. Start by adding your first product!</p>
                <button className="add-new-product-button" onClick={handleAddNewProduct}>
                  <FiPlus /> Add Your First Product
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 