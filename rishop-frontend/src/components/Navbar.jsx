import { useEffect, useState, useContext, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiShoppingCart, FiSearch, FiMenu, FiX, FiSun, FiMoon, FiUser, FiMessageCircle } from "react-icons/fi";
import AppContext from "../Context/Context";
import ChatContext from "../Context/ChatContext";
import Logo from "../assets/Logo.svg";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Used to determine active navigation link
  const { 
    cart, 
    searchQuery, 
    searchResults, 
    showSearchDropdown, 
    isSearching, 
    handleSearchChange, 
    handleSearchFocus, 
    handleSearchKeyPress,
    applySearch,
    closeSearchDropdown,
    resetSearch,
    categories,
    selectedCategory,
    fetchProductsByCategory,
    showPageLoading,
    hidePageLoading,
    theme, // Get theme from context
    toggleTheme, // Get toggleTheme from context
    // Real authentication state from context
    authToken,
    user
  } = useContext(AppContext);

  // Get chat notifications
  const { notifications } = useContext(ChatContext);
  
  // Check if user is authenticated
  const isAuthenticated = !!authToken;
  
  // Function to handle clicking on a search result
  const handleSearchResultClick = (e, productId) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    
    // Close the dropdown
    closeSearchDropdown();
    
    // Navigate to the product detail page
    navigate(`/product/${productId}`);
  };
  
  // Handle clicks outside the search dropdown to close it
  const searchWrapperRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        // Click was outside the search wrapper, just close the dropdown without applying search
        if (showSearchDropdown) {
          closeSearchDropdown();
        }
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchDropdown, closeSearchDropdown]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Update cart count when cart changes
  useEffect(() => {
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    setCartCount(count);
  }, [cart]);

  return (
    <header className="navbar-wrapper">
      <motion.nav 
        className="navbar" 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          backgroundColor: theme === 'dark-theme' ? '#121212' : '#ffffff',
          opacity: 1,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none'
        }}
      >
        <div className="navbar-container">
          <div className="navbar-left">
            <Link 
              to="/" 
              className="navbar-brand" 
              onClick={async () => {
                resetSearch();
                if (selectedCategory) {
                  showPageLoading();
                  try {
                    await fetchProductsByCategory('');
                  } finally {
                    hidePageLoading();
                  }
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <motion.img 
                src={Logo} 
                alt="RIshop Logo" 
                style={{ height: "40px", width: "auto" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              />
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                RIshop
              </motion.span>
            </Link>

            <button 
              className="menu-toggle-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          <div className={`navbar-center ${isMenuOpen ? 'active' : ''}`}>
            <ul className="nav-links">
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                  onClick={async () => {
                    resetSearch();
                    if (selectedCategory) {
                      showPageLoading();
                      try {
                        await fetchProductsByCategory('');
                      } finally {
                        hidePageLoading();
                      }
                    }
                  }}
                >
                  Home
                </Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link 
                  to="/add_product" 
                  className={`nav-link ${location.pathname === '/add_product' ? 'active' : ''}`}
                >
                  Add Product
                </Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.1 }} className="category-dropdown">
                <div className="nav-link dropdown-toggle">
                  Categories
                </div>
                <div className="category-dropdown-menu">
                  <div 
                    className={`dropdown-item ${!selectedCategory ? 'active' : ''}`}
                    onClick={async () => {
                      showPageLoading();
                      try {
                        await fetchProductsByCategory('');
                        navigate('/');
                      } finally {
                        hidePageLoading();
                      }
                    }}
                  >
                    All Products
                  </div>
                  {categories.map(category => (
                    <div 
                      key={category} 
                      className={`dropdown-item ${selectedCategory === category ? 'active' : ''}`}
                      onClick={async () => {
                        showPageLoading();
                        try {
                          await fetchProductsByCategory(category);
                          navigate('/');
                        } finally {
                          hidePageLoading();
                        }
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </motion.li>
            </ul>
          </div>

          <div className="navbar-right">
            <div className="search-container">
              <div className="search-input-wrapper" ref={searchWrapperRef}>
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  onKeyDown={handleSearchKeyPress}
                />
                {isSearching && <span className="search-spinner"></span>}
                
                {/* Search Results Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.slice(0, 5).map(product => (
                      <div 
                        key={product.id} 
                        className="search-result-item"
                        onClick={(e) => handleSearchResultClick(e, product.id)}
                      >
                        <div className="search-result-image">
                          <img 
                            src={product.imageUrl || 'https://via.placeholder.com/40x40?text=' + product.name}
                            alt={product.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40x40';
                            }}
                          />
                        </div>
                        <div className="search-result-info">
                          <div className="search-result-name">{product.name}</div>
                          <div className="search-result-price">₹{product.price}</div>
                        </div>
                      </div>
                    ))}
                    {searchResults.length > 5 && (
                      <div className="search-result-more" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applySearch();
                      }}>
                        View all {searchResults.length} results
                      </div>
                    )}
                  </div>
                )}
                
                {/* No Results Message */}
                {showSearchDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="search-results-dropdown">
                    <div className="search-no-results">No products found</div>
                  </div>
                )}
              </div>
            </div>

            <motion.button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              whileTap={{ scale: 0.9 }}
              aria-label={`Switch to ${theme === 'dark-theme' ? 'light' : 'dark'} mode`}
            >
              {theme === "dark-theme" ? <FiSun /> : <FiMoon />}
            </motion.button>

            {/* Messages Link - Visible if authenticated */}
            {isAuthenticated && (
              <motion.div 
                className="messages-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link to="/chat" className="messages-link">
                  <FiMessageCircle />
                  {notifications.totalNotifications > 0 && (
                    <span className="messages-badge">{notifications.totalNotifications}</span>
                  )}
                </Link>
              </motion.div>
            )}

            <motion.div 
              className="cart-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link to="/cart" className="cart-link">
                <FiShoppingCart />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </motion.div>

            {/* Profile Link - Visible if authenticated */}
            {isAuthenticated && (
              <motion.div 
                className="profile-link-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link to="/profile" className="profile-link">
                  <FiUser />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.nav>
    </header>
  );
};

export default Navbar;
