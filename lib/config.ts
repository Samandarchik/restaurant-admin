// Backend configuration
export const API_BASE_URL = "http://localhost:8080"

// API endpoints
export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
  filials: `${API_BASE_URL}/api/filials`,
  categories: `${API_BASE_URL}/api/categories`,
  products: `${API_BASE_URL}/api/products`, // Updated to use /api/products endpoint
  productsAll: `${API_BASE_URL}/api/products/all`, // Added separate endpoint for getting all products
  users: `${API_BASE_URL}/api/users`,
  orders: `${API_BASE_URL}/api/orders`,
  orderslist: `${API_BASE_URL}/api/orderslist`, // Added orderslist endpoint for fetching orders
  assignFilial: (userId: number) => `${API_BASE_URL}/api/users/${userId}/assign-filial`,
  filial: (id: number) => `${API_BASE_URL}/api/filials/${id}`,
  category: (id: number) => `${API_BASE_URL}/api/categories/${id}`,
  product: (id: number) => `${API_BASE_URL}/api/products/${id}`,
  user: (id: number) => `${API_BASE_URL}/api/users/${id}`,
  order: (id: number) => `${API_BASE_URL}/api/orders/${id}`,
}

// Helper function for API calls with authentication
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token")

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })
}
