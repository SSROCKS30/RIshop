import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../axios";
import AppContext from "../Context/Context";

const UpdateProduct = () => {
  const { id } = useParams();
  const { refreshData } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    brand: "",
    category: "",
    price: "",
    stockQuantity: "",
    productAvailable: true
  });

  // Categories for dropdown
  const categories = [
    "Electronics",
    "Clothing",
    "Books",
    "Home",
    "Beauty",
    "Sports",
    "Toys",
    "Grocery",
    "Mobile",
    "Laptop",
    "Audio",
    "Furniture",
    "Wearables"
  ];

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      setFetchLoading(true);
      try {
        const response = await API.get(`/product/${id}`);
        const product = response.data;
        
        // Set form data from product
        setFormData({
          id: product.id,
          name: product.name || "",
          description: product.description || "",
          brand: product.brand || "",
          category: product.category || "",
          price: product.price || "",
          stockQuantity: product.stockQuantity || 0,
          productAvailable: product.productAvailable !== false // default to true if not specified
        });
        
        // Set current image URL
        setCurrentImageUrl(`http://localhost:8080/api/product/${id}/image`);
        
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product data. Please try again.");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate form data
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        throw new Error("Please fill in all required fields");
      }

      // Create form data object for multipart/form-data
      const productFormData = new FormData();
      
      // Convert formData to JSON and add as a product part
      const productJson = JSON.stringify({
        id: formData.id, // Include ID for update
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        category: formData.category,
        price: parseFloat(formData.price),
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        productAvailable: formData.productAvailable
      });

      console.log('Sending updated product data:', productJson);
      
      // If no new image is selected, use a different endpoint that doesn't require an image
      if (!imageFile) {
        // Use the JSON endpoint for updates without image changes
        await API.put("/product/update", JSON.parse(productJson), {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Create a new FormData object for the update request with image
        const updateFormData = new FormData();
        
        // Add the product JSON as a blob
        const blob = new Blob([productJson], { type: 'application/json' });
        updateFormData.append("product", blob);
        
        // Add the image file
        updateFormData.append("imageFile", imageFile);
        
        // Send the update request with multipart/form-data
        await API.put("/product", updateFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      console.log("Product updated successfully");
      setSuccess(true);
      refreshData(); // Refresh product list in context
      
      // Redirect after successful submission
      setTimeout(() => {
        navigate(`/product/${id}`); // Redirect to product page after 2 seconds
      }, 2000);
      
    } catch (error) {
      console.error("Error updating product:", error);
      setError(error.response?.data?.message || error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="loading-container" style={{ padding: "5rem", textAlign: "center" }}>
        <h2>Loading product data...</h2>
      </div>
    );
  }

  return (
    <div className="add-product-container">
      <div className="form-container">
        <h2 className="form-title">Update Product</h2>
        
        {success && (
          <div className="success-message" style={{
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            color: "var(--success-color)",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}>
            Product updated successfully! Redirecting...
          </div>
        )}
        
        {error && (
          <div className="error-message" style={{
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            color: "var(--danger-color)",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-left">
              {/* Name */}
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              {/* Brand */}
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Enter brand name"
                />
              </div>
              
              {/* Category */}
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Price */}
              <div className="form-group">
                <label htmlFor="price">Price (₹) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              {/* Stock Quantity */}
              <div className="form-group">
                <label htmlFor="stockQuantity">Stock Quantity</label>
                <input
                  type="number"
                  id="stockQuantity"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  placeholder="Enter stock quantity"
                  min="0"
                />
              </div>
              
              {/* Product Available */}
              <div className="form-group checkbox-group">
                <label htmlFor="productAvailable" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="productAvailable"
                    name="productAvailable"
                    checked={formData.productAvailable}
                    onChange={handleInputChange}
                  />
                  <span>Product Available</span>
                </label>
              </div>
            </div>
            
            <div className="form-right">
              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows="5"
                  required
                ></textarea>
              </div>
              
              {/* Image Upload */}
              <div className="form-group">
                <label htmlFor="image">Product Image</label>
                <div className="image-upload-container" style={{ marginBottom: "20px" }}>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                    style={{ marginBottom: "15px" }}
                  />
                  
                  {/* Image Preview Section with improved styling */}
                  <div className="image-preview-section" style={{ 
                    width: "100%",
                    minHeight: "250px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "20px",
                    backgroundColor: "var(--bg-secondary)"
                  }}>
                    {imagePreview ? (
                      <>
                        <h4 style={{ marginBottom: "10px" }}>New Image Preview:</h4>
                        <div style={{ 
                          width: "100%", 
                          height: "250px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          overflow: "hidden"
                        }}>
                          <img 
                            src={imagePreview} 
                            alt="Product preview" 
                            style={{ 
                              maxWidth: "100%", 
                              maxHeight: "250px", 
                              objectFit: "contain"
                            }}
                          />
                        </div>
                      </>
                    ) : currentImageUrl ? (
                      <>
                        <h4 style={{ marginBottom: "10px" }}>Current Image:</h4>
                        <div style={{ 
                          width: "100%", 
                          height: "250px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          overflow: "hidden",
                          backgroundColor: "var(--bg-accent)",
                          borderRadius: "8px"
                        }}>
                          <img 
                            src={currentImageUrl} 
                            alt="Current product" 
                            style={{ 
                              maxWidth: "100%", 
                              maxHeight: "250px", 
                              objectFit: "contain"
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="no-image" style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        height: "200px",
                        color: "var(--text-secondary)",
                        fontStyle: "italic"
                      }}>
                        No image available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate(`/product/${id}`)}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Updating Product..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProduct;
