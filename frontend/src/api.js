import axios from "axios";

// Create a custom instance of Axios
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add a request interceptor to automatically attach the JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default API;
