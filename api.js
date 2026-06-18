const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  setAuthToken(token) {
    localStorage.setItem('token', token);
  }

  removeAuthToken() {
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  logout() {
    this.removeAuthToken();
  }

  // Projects
  async getProjects() {
    return this.request('/api/projects');
  }

  async getRecentProjects() {
    return this.request('/api/projects/recent');
  }

  async createProject(projectData) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // AI Services
  async generateDocument(prompt, mode = 'document', sections = 4) {
    return this.request('/api/document', {
      method: 'POST',
      body: JSON.stringify({ prompt, mode, sections }),
    });
  }

  async chatWithDocument(query, document, mode = 'question') {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query, document, mode }),
    });
  }

  async generateContent(prompt, mode = 'write', targetPages = 1) {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, mode, targetPages }),
    });
  }

  async rewriteText(text, mode = 'formal') {
    return this.request('/api/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text, mode }),
    });
  }
}

export default new ApiService();