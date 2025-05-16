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

  const fetchData = useCallback(async () => {
    // Prevent duplicate calls if data is already fetched
    if (isDataFetched && products.length > 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch products with complete data including images
      const response = await API.get('/products', {
        params: {
          includeImageData: true // Request backend to include image data in response
        }
      });
      
      // Process the response data
      const productsData = response.data;
      
      // Store the products in state
      setProducts(productsData);
      setFilteredProducts(productsData);
      setDisplayedProducts(productsData);
      
      // Extract unique categories from products
      const uniqueCategories = [...new Set(productsData.map(product => product.category))];
      setCategories(uniqueCategories);
      
      // Mark data as fetched to prevent duplicate calls
      setIsDataFetched(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isDataFetched, products, setIsLoading, setProducts, setFilteredProducts, setDisplayedProducts, setCategories, setIsDataFetched]);
  
  // Fetch products by category
  const fetchProductsByCategory = async (category) => {
    if (!category) {
      setDisplayedProducts(products);
      setSelectedCategory('');
      return;
    }
    
    // First try to filter locally from existing products
    if (products.length > 0) {
      const localFiltered = products.filter(p => p.category === category);
      if (localFiltered.length > 0) {
        setSelectedCategory(category);
        setDisplayedProducts(localFiltered);
        return;
      }
    }
    
    // Only fetch from server if not found locally
    try {
      setIsLoading(true);
      setSelectedCategory(category);
      
      // Request image data with category products
      const response = await API.get(`/products/category/${category}`, {
        params: {
          includeImageData: true
        }
      });
      
      setDisplayedProducts(response.data);
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      // If error, show all products
      setDisplayedProducts(products);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search products by keyword for dropdown
  const searchProducts = useCallback(async (keyword) => {
    // Only search if keyword has 2 or more characters
    if (keyword.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }
    
    // First try to filter locally from existing products if we have them
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
      // Request image data with search results
      const response = await API.get(`/products/${keyword}`, {
        params: {
          includeImageData: true
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [products, setSearchResults, setShowSearchDropdown, setIsSearching]);
  
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
    
    // If query is empty or less than 2 chars, hide dropdown
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
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
    setDisplayedProducts(products);
  };
  
  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.length >= 2 && searchResults.length > 0) {
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
    // Only fetch data if it hasn't been fetched yet
    if (!isDataFetched) {
      fetchData();
    }
    
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [isDataFetched, fetchData]);
  
  // Effect for handling search with debounce
  useEffect(() => {
    // Skip initial render
    if (searchQuery === '') return;
    
    // Set a timer to delay the search
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300); // 300ms debounce
    
    // Clean up the timer on each change
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
      // If product already in cart, increase quantity
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new product to cart with quantity 1
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: quantity } 
          : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const refreshData = () => {
    fetchData();
  };

  return (
    <AppContext.Provider value={{
      products,
      filteredProducts,
      displayedProducts,
      searchResults,
      showSearchDropdown,
      isLoading,
      isSearching,
      pageLoading,
      setPageLoading,
      searchQuery,
      handleSearchChange,
      handleSearchBlur,
      handleSearchFocus,
      handleSearchKeyPress,
      applySearch,
      closeSearchDropdown,
      resetSearch,
      searchProducts,
      categories,
      selectedCategory,
      fetchProductsByCategory,
      cart,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};


AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AppContext;
