const axios = require("axios");

const BASE_URL = "http://localhost:3001/api"; // Added /api prefix
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYjJjZDIyNy1iNzllLTRmNDEtYmMzYS1mOGY0ODRhYTUzNDciLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbjFAc3RhbXBvdXRwb3MuY29tIiwiY29tcGFueUlkIjoiMmQ4OTY5MDgtNDA5Zi00MTA3LWFmN2EtYmRjNDVlNjEwZGI1Iiwicm9sZUlkIjoiM2ZiNjE1MDctNjIxYy00ZmYwLWEzYjEtNDRhOGE5NTJmYmYyIiwicm9sZU5hbWUiOiJTdXBlciBBZG1pbiIsImlhdCI6MTc1MTEzMDI2MCwiZXhwIjoxNzUxMjE2NjYwfQ.A_UpOcB7xp_qKlGZ8atxIYnTLb48QwSveYXGhrJ0mUs"; // Reemplazar con un token JWT válido

console.log('AUTH_TOKEN:', AUTH_TOKEN);

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

console.log('Headers:', headers);

async function testCategories() {
  console.log("\n--- Testing Categories Endpoints ---");

  // Create Category
  try {
    const newCategory = {
      name: "Electronics",
      description: "Electronic devices and accessories",
    };
    const response = await axios.post(`${BASE_URL}/products/categories`, newCategory, { headers });
    console.log("Created Category:", response.data);
    const categoryId = response.data.id;

    // Get All Categories
    const allCategories = await axios.get(`${BASE_URL}/products/categories`, { headers });
    console.log("All Categories:", allCategories.data);

    // Get Category by ID
    const categoryById = await axios.get(`${BASE_URL}/products/categories/${categoryId}`, { headers });
    console.log("Category by ID:", categoryById.data);

    // Update Category
    const updatedCategory = {
      name: "Updated Electronics",
      description: "Updated electronic devices and accessories",
    };
    const updateResponse = await axios.patch(`${BASE_URL}/products/categories/${categoryId}`, updatedCategory, { headers });
    console.log("Updated Category:", updateResponse.data);

    // Delete Category
    await axios.delete(`${BASE_URL}/products/categories/${categoryId}`, { headers });
    console.log("Category Deleted.");
  } catch (error) {
    console.error("Error testing categories:", error.response ? error.response.data : error.message);
  }
}

async function testSubcategories() {
  console.log("\n--- Testing Subcategories Endpoints ---");

  // First, create a category to associate subcategories with
  let categoryId;
  try {
    const newCategory = {
      name: "Books",
      description: "Books and literature",
    };
    const response = await axios.post(`${BASE_URL}/products/categories`, newCategory, { headers });
    categoryId = response.data.id;
    console.log("Created Category for Subcategories:", response.data);
  } catch (error) {
    console.error("Error creating category for subcategories:", error.response ? error.response.data : error.message);
    return;
  }

  // Create Subcategory
  try {
    const newSubcategory = {
      category_id: categoryId,
      name: "Fiction",
      description: "Fiction novels",
    };
    const response = await axios.post(`${BASE_URL}/products/subcategories`, newSubcategory, { headers });
    console.log("Created Subcategory:", response.data);
    const subcategoryId = response.data.id;

    // Get All Subcategories
    const allSubcategories = await axios.get(`${BASE_URL}/products/subcategories`, { headers });
    console.log("All Subcategories:", allSubcategories.data);

    // Get Subcategory by ID
    const subcategoryById = await axios.get(`${BASE_URL}/products/subcategories/${subcategoryId}`, { headers });
    console.log("Subcategory by ID:", subcategoryById.data);

    // Update Subcategory
    const updatedSubcategory = {
      name: "Non-Fiction",
      description: "Non-fiction books",
    };
    const updateResponse = await axios.patch(`${BASE_URL}/products/subcategories/${subcategoryId}`, updatedSubcategory, { headers });
    console.log("Updated Subcategory:", updateResponse.data);

    // Delete Subcategory
    await axios.delete(`${BASE_URL}/products/subcategories/${subcategoryId}`, { headers });
    console.log("Subcategory Deleted.");
  } catch (error) {
    console.error("Error testing subcategories:", error.response ? error.response.data : error.message);
  }
}

async function testProducts() {
  console.log("\n--- Testing Products Endpoints ---");

  // First, create a category and subcategory to associate products with
  let categoryId;
  let subcategoryId;
  try {
    const newCategory = {
      name: "Food",
      description: "Food and beverages",
    };
    const categoryResponse = await axios.post(`${BASE_URL}/products/categories`, newCategory, { headers });
    categoryId = categoryResponse.data.id;
    console.log("Created Category for Products:", categoryResponse.data);

    const newSubcategory = {
      category_id: categoryId,
      name: "Snacks",
      description: "Snack items",
    };
    const subcategoryResponse = await axios.post(`${BASE_URL}/products/subcategories`, newSubcategory, { headers });
    subcategoryId = subcategoryResponse.data.id;
    console.log("Created Subcategory for Products:", subcategoryResponse.data);
  } catch (error) {
    console.error("Error creating category/subcategory for products:", error.response ? error.response.data : error.message);
    return;
  }

  // Create Product
  try {
    const newProduct = {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      name: "Potato Chips",
      description: "Salty potato chips",
      sku: "PC001",
      price: 2.50,
      cost: 1.00,
      stock: 100,
    };
    const response = await axios.post(`${BASE_URL}/products`, newProduct, { headers });
    console.log("Created Product:", response.data);
    const productId = response.data.id;

    // Get All Products
    const allProducts = await axios.get(`${BASE_URL}/products`, { headers });
    console.log("All Products:", allProducts.data);

    // Get Product by ID
    const productById = await axios.get(`${BASE_URL}/products/${productId}`, { headers });
    console.log("Product by ID:", productById.data);

    // Update Product
    const updatedProduct = {
      price: 2.75,
      stock: 120,
    };
    const updateResponse = await axios.patch(`${BASE_URL}/products/${productId}`, updatedProduct, { headers });
    console.log("Updated Product:", updateResponse.data);

    // Delete Product
    await axios.delete(`${BASE_URL}/products/${productId}`, { headers });
    console.log("Product Deleted.");
  } catch (error) {
    console.error("Error testing products:", error.response ? error.response.data : error.message);
  }
}

async function runTests() {
  await testCategories();
  await testSubcategories();
  await testProducts();
}

runTests();


