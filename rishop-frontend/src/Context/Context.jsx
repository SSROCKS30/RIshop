import { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import API from '../axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDataFetched, setIsDataFetched] = useState(false);

  // Authentication state
  const [authToken, setAuthTokenState] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null); // To store user details
  const [isAuthLoading, setIsAuthLoading] = useState(true); // To track auth validation

  // Profile-related state
  const [userProducts, setUserProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Cart-related state
  const [cartLoading, setCartLoading] = useState(false);

  // Theme state
  const getInitialTheme = useCallback(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme ? storedTheme : "light-theme"; // Default to light-theme
  }, []);

  const [theme, setThemeState] = useState(getInitialTheme());

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const newTheme = prevTheme === "dark-theme" ? "light-theme" : "dark-theme";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Update API headers and localStorage when authToken changes
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete API.defaults.headers.common['Authorization'];
    }
    setAuthTokenState(token);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setCart([]); // Clear cart on logout
    // Any other cleanup
    // Navigate to login page (handled by ProtectedRoute)
  };

  // Validate token on initial load
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Replace with your actual endpoint to get user profile or validate token
          // For example, a /profile or /me endpoint
          const response = await API.get('/user/profile'); 
          setUser(response.data);
          setAuthTokenState(token); // Ensure context state is also updated
        } catch (error) {
          console.error("Token validation failed", error);
          setAuthToken(null); // Clear invalid token
        }
      }
      setIsAuthLoading(false);
    };
    validateToken();
  }, []);

  // Profile fetch functions wrapped in useCallback to prevent infinite loops
  const fetchUserProfile = useCallback(async () => {
    if (!authToken) return;
    
    try {
      setIsLoadingProfile(true);
      const response = await API.get('/user/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [authToken]);

  const fetchUserProducts = useCallback(async () => {
    if (!authToken) return;
    
    try {
      setIsLoadingProfile(true);
      const response = await API.get('/user/products');
      setUserProducts(response.data);
    } catch (error) {
      console.error('Error fetching user products:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [authToken]);

  const fetchUserOrders = useCallback(async () => {
    if (!authToken) return;
    
    try {
      setIsLoadingProfile(true);
      const response = await API.get('/user/orders');
      setUserOrders(response.data);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [authToken]);

  const fetchAllProfileData = useCallback(async () => {
    if (!authToken) return;
    
    setIsLoadingProfile(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchUserProducts(), 
        fetchUserOrders()
      ]);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [authToken, fetchUserProfile, fetchUserProducts, fetchUserOrders]);

  const fetchData = useCallback(async () => {
    if (isDataFetched && products.length > 0) {
      setIsLoading(false);
      return;
    }
    // Only fetch if authenticated
    if (!authToken) {
        setIsLoading(false);
        setProducts([]); // Clear products if not authenticated
        setDisplayedProducts([]);
        return;
    }
    try {
      setIsLoading(true);
      const response = await API.get('/products', {
        params: { includeImageData: true }
      });
      const productsData = response.data;
      setProducts(productsData);
      setFilteredProducts(productsData);
      setDisplayedProducts(productsData);
      const uniqueCategories = [...new Set(productsData.map(product => product.category))];
      setCategories(uniqueCategories);
      setIsDataFetched(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      // If error occurs (e.g. 401 Unauthorized), token might be invalid
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout(); // Log out user if token is no longer valid
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDataFetched, products.length, authToken]);
  
  // Fetch products by category
  const fetchProductsByCategory = async (category) => {
    if (!authToken) return; // Don't fetch if not authenticated
    if (!category) {
      setDisplayedProducts(products);
      setSelectedCategory('');
      return;
    }
    if (products.length > 0) {
      const localFiltered = products.filter(p => p.category === category);
      if (localFiltered.length > 0) {
        setSelectedCategory(category);
        setDisplayedProducts(localFiltered);
        return;
      }
    }
    try {
      setIsLoading(true);
      setSelectedCategory(category);
      const response = await API.get(`/products/category/${category}`, {
        params: { includeImageData: true }
      });
      setDisplayedProducts(response.data);
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      setDisplayedProducts(products);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search products by keyword for dropdown
  const searchProducts = useCallback(async (keyword) => {
    if (!authToken) return; // Don't search if not authenticated
    if (keyword.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }
    if (products.length > 0) {
      const localResults = products.filter(p =>
        p.name.toLowerCase().includes(keyword.toLowerCase()) ||
        p.description.toLowerCase().includes(keyword.toLowerCase()) ||
        p.brand.toLowerCase().includes(keyword.toLowerCase())
      );
      if (localResults.length > 0) {
        setSearchResults(localResults);
        setIsSearching(false);
        setShowSearchDropdown(true);
        return;
      }
    }
    setIsSearching(true);
    setShowSearchDropdown(true);
    try {
      const response = await API.get(`/products/${keyword}`, {
        params: { includeImageData: true }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [products, authToken]);
  
  // Apply search to main display when user presses Enter
  const applySearch = () => {
    if (searchQuery.length >= 2 && searchResults.length > 0) {
      setFilteredProducts(searchResults);
      setDisplayedProducts(searchResults);
    } else {
      setFilteredProducts(products);
      setDisplayedProducts(products);
    }
    setShowSearchDropdown(false);
  };
  
  // Handle search input changes with debounce
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      // If query is cleared, reset displayed products to all (or current category)
      if (!query) {
        if(selectedCategory) {
            fetchProductsByCategory(selectedCategory);
        } else {
            setDisplayedProducts(products);
        }
      }
    }
  };
  
  // Handle search input blur
  const handleSearchBlur = () => {
    // We'll handle this differently to prevent dropdown from closing when clicking on results
  };
  
  // Function to close the search dropdown
  const closeSearchDropdown = () => {
    setShowSearchDropdown(false);
  };
  
  // Function to reset search and show all products
  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    if(selectedCategory) {
        fetchProductsByCategory(selectedCategory);
    } else {
        setDisplayedProducts(products);
    }
  };
  
  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.length >= 2 && searchResults.length > 0 && authToken) {
      setShowSearchDropdown(true);
    }
  };
  
  // Handle search key press (Enter)
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      applySearch();
    }
  };

  useEffect(() => {
    // Fetch initial data when component mounts or when authToken changes (e.g., after login)
    if (authToken && !isDataFetched) {
        fetchData();
    } else if (!authToken) {
        // Clear data if user logs out
        setProducts([]);
        setDisplayedProducts([]);
        setFilteredProducts([]);
        setCart([]);
        setIsDataFetched(false); // Reset data fetched flag
        setIsLoading(false);
    }
  }, [authToken, fetchData, isDataFetched]);
  
  // Effect for handling search with debounce
  useEffect(() => {
    if (searchQuery === '') {
        setShowSearchDropdown(false); // Ensure dropdown is hidden when query is cleared
        return;
    }
    if (authToken && searchQuery.length >=2) { // Only search if authenticated and query is long enough
        const timer = setTimeout(() => {
        searchProducts(searchQuery);
        }, 300); 
        return () => clearTimeout(timer);
    } else if (!authToken) { // If not authenticated, clear search results
        setSearchResults([]);
        setShowSearchDropdown(false);
    }
  }, [searchQuery, searchProducts, authToken]);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!authToken) {
      setCart([]);
      return;
    }

    try {
      setCartLoading(true);
      const response = await API.get('/cart');
      const cartData = response.data;
      
      // Transform backend cart data to frontend format
      const cartItems = cartData.cartItems.map(item => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        brand: item.product.brand,
        category: item.product.category,
        price: parseFloat(item.product.price),
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        stockQuantity: item.product.stockQuantity
      }));
      
      setCart(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  }, [authToken]);

  // Load cart when user logs in
  useEffect(() => {
    if (authToken) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [authToken, fetchCart]);

  const addToCart = async (product) => {
    if (!authToken) {
      console.error('User not authenticated');
      return;
    }

    try {
      setCartLoading(true);
      await API.post(`/cart/add/${product.id}`, null, {
        params: { quantity: 1 }
      });
      
      // Refresh cart after adding
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
      // Show user-friendly error message
      const errorMessage = error.response?.data || 'Failed to add item to cart';
      alert(errorMessage);
    } finally {
      setCartLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!authToken) {
      console.error('User not authenticated');
      return;
    }

    try {
      setCartLoading(true);
      await API.delete(`/cart/item/${productId}`);
      
      // Refresh cart after removing
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
      // Show user-friendly error message
      const errorMessage = error.response?.data || 'Failed to remove item from cart';
      alert(errorMessage);
    } finally {
      setCartLoading(false);
    }
  };

  const updateCartItemQuantity = async (productId, quantity) => {
    if (!authToken) {
      console.error('User not authenticated');
      return;
    }

    try {
      setCartLoading(true);
      await API.put(`/cart/item/${productId}/quantity/${quantity}`);
      
      // Refresh cart after updating
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
      // Show user-friendly error message
      const errorMessage = error.response?.data || 'Failed to update cart item quantity';
      alert(errorMessage);
    } finally {
      setCartLoading(false);
    }
  };

  const clearCart = async () => {
    if (!authToken) {
      console.error('User not authenticated');
      return;
    }

    try {
      setCartLoading(true);
      await API.delete('/cart/clear');
      
      // Clear local cart state
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
      // Show user-friendly error message
      const errorMessage = error.response?.data || 'Failed to clear cart';
      alert(errorMessage);
    } finally {
      setCartLoading(false);
    }
  };

  const refreshData = () => {
    setIsDataFetched(false); // Reset flag to allow refetch
    fetchData(); // Re-fetch all primary data
  };

  const getProductById = async (id) => {
    if (!authToken) return null;
    try {
      const response = await API.get(`/products/product/${id}`, { params: { includeImageData: true }});
      return response.data;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      return null;
    }
  };

  const addProduct = async (product) => {
    if (!authToken) throw new Error("User not authenticated");
    try {
      const response = await API.post('/products', product);
      refreshData(); // Refresh data after adding
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      throw error;
    }
  };

  const updateProduct = async (id, product) => {
    if (!authToken) throw new Error("User not authenticated");
    try {
      const response = await API.put(`/products/${id}`, product);
      refreshData(); // Refresh data after updating
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    if (!authToken) throw new Error("User not authenticated");
    try {
      await API.delete(`/products/${id}`);
      refreshData(); // Refresh data after deleting
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      throw error;
    }
  };

  // Clear displayed products when navigating away from a category or search
  const clearDisplayedProducts = () => {
    if(selectedCategory) {
        fetchProductsByCategory(selectedCategory); // Re-fetch category products
    } else {
        setDisplayedProducts(products); // Reset to all products
    }
    // Reset search query if you want search to clear as well
    // setSearchQuery(''); 
    // setSearchResults([]);
  };

  // Provide page loading state
  const showPageLoading = useCallback(() => {
    console.log('showPageLoading called at:', new Date().toISOString());
    setPageLoading(true);
  }, []);
  const hidePageLoading = useCallback(() => {
    console.log('hidePageLoading called at:', new Date().toISOString());
    setPageLoading(false);
  }, []);

  return (
    <AppContext.Provider value={{ 
      products, 
      filteredProducts,
      searchResults,
      displayedProducts, 
      cart, 
      isLoading, 
      pageLoading,
      searchQuery,
      isSearching,
      showSearchDropdown,
      categories,
      selectedCategory,
      authToken,
      user,
      isAuthLoading, // Provide this to App.jsx for initial loading check
      theme, // Expose theme
      toggleTheme, // Expose toggleTheme
      // Profile-related state and functions
      userProducts,
      userOrders,
      isLoadingProfile,
      // Cart-related state and functions
      cartLoading,
      fetchCart,
      fetchData, 
      fetchProductsByCategory,
      searchProducts,
      applySearch,
      handleSearchChange,
      handleSearchBlur,
      handleSearchFocus,
      handleSearchKeyPress,
      closeSearchDropdown,
      resetSearch,
      addToCart, 
      removeFromCart, 
      updateCartItemQuantity, 
      clearCart,
      refreshData,
      getProductById,
      addProduct,
      updateProduct,
      deleteProduct,
      setAuthToken, // Make sure this is the new wrapper function
      setUser,
      logout,
      clearDisplayedProducts,
      showPageLoading,
      hidePageLoading,
      // Profile-related functions
      fetchUserProfile,
      fetchUserProducts,
      fetchUserOrders,
      fetchAllProfileData
    }}>
      {children}
    </AppContext.Provider>
  );
};

AppContext.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppContext;
