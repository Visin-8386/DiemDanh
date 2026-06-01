const axios = require('axios');

/**
 * ApiClient — HTTP client cho API tests
 * Auto-attach Bearer token sau login
 */
class ApiClient {
  constructor(baseURL = 'http://localhost/api') {
    // Khởi tạo client TRƯỚC, rồi mới set token
    this.client = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
    this._token = null; // set thẳng vào backing field, không qua setter
  }

  /** Đăng nhập — lưu và tự đính kèm token vào header */
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    this.token = response.data.accessToken; // dùng setter để set header
    return response.data;
  }

  /** Set token thủ công (dùng cho fake token / unauthenticated test) */
  set token(value) {
    this._token = value;
    if (value) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${value}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  get token() { return this._token; }

  get(url, params)   { return this.client.get(url, { params }); }
  post(url, data)    { return this.client.post(url, data); }
  patch(url, data)   { return this.client.patch(url, data); }
  put(url, data)     { return this.client.put(url, data); }
  delete(url)        { return this.client.delete(url); }
}

module.exports = ApiClient;
