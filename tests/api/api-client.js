const axios = require('axios');

/**
 * ApiClient — HTTP client cho API tests
 * Auto-attach Bearer token sau login
 * Propagates Axios errors (với response.status) cho tests RBAC/validation
 */
class ApiClient {
  constructor(baseURL = 'http://localhost/api') {
    this.token = null;
    this.client = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
      // KHÔNG dùng validateStatus: false — để Axios throw khi 4xx/5xx
      // Tests sẽ catch và kiểm tra e.response.status
    });
  }

  /** Đăng nhập, lưu và tự đính kèm token vào header */
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    this.token = response.data.accessToken;
    this._setAuthHeader(this.token);
    return response.data;
  }

  /** Set token thủ công (dùng cho fake token test) */
  set token(value) {
    this._token = value;
    if (value) this._setAuthHeader(value);
    else delete this.client.defaults.headers.common['Authorization'];
  }

  get token() { return this._token; }

  _setAuthHeader(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  get(url, params)   { return this.client.get(url, { params }); }
  post(url, data)    { return this.client.post(url, data); }
  patch(url, data)   { return this.client.patch(url, data); }
  put(url, data)     { return this.client.put(url, data); }
  delete(url)        { return this.client.delete(url); }
}

module.exports = ApiClient;
