import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../axios";
import AppContext from "../Context/Context";

const AddProduct = () => {
  const { refreshData } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
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
      
      if (!imageFile) {
        throw new Error("Please select a product image");
      }

      // Create form data object for multipart/form-data
      const productFormData = new FormData();
      
      // Convert formData to JSON and add as a product part
      // This matches the @RequestPart Product product in the backend
      const productJson = JSON.stringify({
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        category: formData.category,
        price: parseFloat(formData.price),
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        productAvailable: formData.productAvailable
      });
      
      // Create a Blob from the JSON string
      const productBlob = new Blob([productJson], {
        type: 'application/json'
      });
      
      // Add product as a part named 'product'
      productFormData.append("product", productBlob);
      
      // Add image file as a part named 'imageFile'
      productFormData.append("imageFile", imageFile);

      console.log('Sending product data:', productJson);
      
      // Send POST request to add product
      const response = await API.post("/addproduct", productFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("Product added successfully:", response.data);
      setSuccess(true);
      refreshData(); // Refresh product list in context
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate("/"); // Redirect to home page after 2 seconds
      }, 2000);
      
    } catch (error) {
      console.error("Error adding product:", error);
      setError(error.response?.data?.message || error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <div className="form-container">
        <h2 className="form-title">Add New Product</h2>
        
        {success && (
          <div className="success-message">
            Product added successfully! Redirecting to home page...
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            <div className="form-left">
              {/* Product Name */}
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
                <label htmlFor="brand">Brand *</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Enter brand name"
                  required
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
                <label htmlFor="image">Product Image *</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                    required
                  />
                  <div className="image-preview-container">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product preview" className="image-preview" />
                    ) : (
                      <div className="no-image">No image selected</div>
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
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? "Adding Product..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
