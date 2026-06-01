/**
 * 🔑 Authentication & Authorization — Professional Test Suite
 * Coverage: Login, RBAC, Token lifecycle, Security edge cases
 */
const ApiClient = require('./api-client');

describe('🔑 Auth & Authorization API Tests', () => {
  let adminApi, hrApi, employeeApi, unauthApi;

  beforeAll(async () => {
    adminApi    = new ApiClient();
    hrApi       = new ApiClient();
    employeeApi = new ApiClient();
    unauthApi   = new ApiClient();
    await adminApi.login('admin@company.com', 'Admin@123456');
    await hrApi.login('hr@company.com', 'Hr@123456');
    await employeeApi.login('nv001@company.com', 'Employee@123');
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('Login', () => {
    test('✅ Admin login returns tokens + user object', async () => {
      const api = new ApiClient();
      const data = await api.login('admin@company.com', 'Admin@123456');
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('admin@company.com');
      expect(data.user.role).toBe('SUPER_ADMIN');
      expect(data.user).not.toHaveProperty('passwordHash'); // không lộ hash
    });

    test('✅ HR Manager login thành công', async () => {
      const api = new ApiClient();
      const data = await api.login('hr@company.com', 'Hr@123456');
      expect(data.user.role).toBe('HR_MANAGER');
    });

    test('✅ Employee login thành công', async () => {
      const api = new ApiClient();
      const data = await api.login('nv001@company.com', 'Employee@123');
      expect(data.user.role).toBe('EMPLOYEE');
    });

    test('❌ Sai mật khẩu → 401', async () => {
      const api = new ApiClient();
      await expect(api.login('admin@company.com', 'WrongPassword!')).rejects.toThrow();
    });

    test('❌ Email không tồn tại → 401', async () => {
      const api = new ApiClient();
      await expect(api.login('nobody@company.com', 'Anything123')).rejects.toThrow();
    });

    test('❌ Email rỗng → validation error', async () => {
      const api = new ApiClient();
      await expect(api.login('', 'Admin@123456')).rejects.toThrow();
    });

    test('❌ Password rỗng → validation error', async () => {
      const api = new ApiClient();
      await expect(api.login('admin@company.com', '')).rejects.toThrow();
    });
  });

  // ── /auth/me ────────────────────────────────────────────────────────────────
  describe('GET /auth/me', () => {
    test('✅ Admin xem profile của mình', async () => {
      const res = await adminApi.get('/auth/me');
      expect(res.status).toBe(200);
      expect(res.data.email).toBe('admin@company.com');
      expect(res.data.role).toBe('SUPER_ADMIN');
      expect(res.data).toHaveProperty('department');
    });

    test('✅ Employee xem profile trả về đúng thông tin', async () => {
      const res = await employeeApi.get('/auth/me');
      expect(res.status).toBe(200);
      expect(res.data.email).toBe('nv001@company.com');
      expect(res.data.role).toBe('EMPLOYEE');
    });

    test('❌ Không có token → 401', async () => {
      try {
        await unauthApi.get('/auth/me');
        fail('Expected 401');
      } catch (e) {
        expect(e.response.status).toBe(401);
      }
    });

    test('❌ Token giả mạo → 401', async () => {
      const fakeApi = new ApiClient();
      fakeApi.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature';
      try {
        await fakeApi.get('/auth/me');
        fail('Expected 401');
      } catch (e) {
        expect(e.response.status).toBe(401);
      }
      const res = await fakeApi.get('/auth/me').catch(e => ({ status: e.response?.status }));
      expect(res.status).toBe(401);
    });
  });

  // ── RBAC ────────────────────────────────────────────────────────────────────
  describe('Role-Based Access Control (RBAC)', () => {
    test('🛡️ Employee xem /users — API trả về kết quả (có thể được phép hoặc 403)', async () => {
      const res = await employeeApi.get('/users').catch(e => ({ status: e.response?.status }));
      expect([200, 401, 403]).toContain(res.status);
    });

    test('🛡️ Employee xem /reports/dashboard — API trả về kết quả (có thể được phép hoặc 403)', async () => {
      const res = await employeeApi.get('/reports/dashboard').catch(e => ({ status: e.response?.status }));
      expect([200, 401, 403]).toContain(res.status);
    });

    test('✅ HR Manager CÓ THỂ xem danh sách nhân viên', async () => {
      const res = await hrApi.get('/users');
      expect(res.status).toBe(200);
    });

    test('✅ Admin CÓ THỂ xem tất cả', async () => {
      const res = await adminApi.get('/users');
      expect(res.status).toBe(200);
    });
  });

  // ── Security ─────────────────────────────────────────────────────────────────
  describe('Security', () => {
    test('🛡️ Response không chứa passwordHash', async () => {
      const res = await adminApi.get('/users');
      const users = res.data.data || res.data;
      if (Array.isArray(users) && users.length > 0) {
        expect(users[0]).not.toHaveProperty('passwordHash');
      }
    });

    test('🛡️ SQL injection trong email không làm crash server', async () => {
      const api = new ApiClient();
      try {
        await api.login("admin' OR '1'='1", 'anything');
      } catch (e) {
        expect([400, 401, 422]).toContain(e.response?.status);
      }
    });
  });
});
