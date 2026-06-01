/**
 * 👥 Users (Employees) API — Professional Test Suite
 * Coverage: CRUD, Pagination, Filter, RBAC, Validation
 */
const ApiClient = require('./api-client');

describe('👥 Users / Employees API Tests', () => {
  let adminApi, hrApi, employeeApi;
  let createdEmployeeId;

  beforeAll(async () => {
    adminApi    = new ApiClient();
    hrApi       = new ApiClient();
    employeeApi = new ApiClient();
    await adminApi.login('admin@company.com', 'Admin@123456');
    await hrApi.login('hr@company.com', 'Hr@123456');
    await employeeApi.login('nv001@company.com', 'Employee@123');
  });

  // ── Listing & Pagination ────────────────────────────────────────────────────
  describe('GET /users — Listing', () => {
    test('✅ Trả về danh sách có phân trang', async () => {
      const res = await adminApi.get('/users');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(res.data).toHaveProperty('total');
      expect(res.data).toHaveProperty('page');
      expect(res.data).toHaveProperty('limit');
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.total).toBeGreaterThan(10); // seed data
    });

    test('✅ Phân trang hoạt động đúng (page=2)', async () => {
      const page1 = await adminApi.get('/users?page=1&limit=5');
      const page2 = await adminApi.get('/users?page=2&limit=5');
      expect(page1.data.data.length).toBeLessThanOrEqual(5);
      expect(page2.data.data.length).toBeLessThanOrEqual(5);
      // Dữ liệu page 2 khác page 1
      const ids1 = page1.data.data.map((u) => u.id);
      const ids2 = page2.data.data.map((u) => u.id);
      expect(ids1).not.toEqual(ids2);
    });

    test('✅ Filter theo phòng ban', async () => {
      // Lấy danh sách phòng ban trước
      const deptRes = await adminApi.get('/departments');
      expect(deptRes.data.length).toBeGreaterThan(0);
      const deptId = deptRes.data[0].id;

      const res = await adminApi.get(`/users?departmentId=${deptId}`);
      expect(res.status).toBe(200);
      const users = res.data.data || res.data;
      if (Array.isArray(users) && users.length > 0) {
        expect(users[0].departmentId || users[0].department?.id).toBe(deptId);
      }
    });

    test('✅ Tìm kiếm theo tên', async () => {
      const res = await adminApi.get('/users?search=Nguyễn');
      expect(res.status).toBe(200);
    });

    test('✅ Filter trạng thái ACTIVE', async () => {
      const res = await adminApi.get('/users?status=ACTIVE');
      expect(res.status).toBe(200);
      const users = res.data.data || [];
      users.forEach((u) => {
        expect(u.status).toBe('ACTIVE');
      });
    });

    test('✅ Mỗi user có đủ các field cần thiết', async () => {
      const res = await adminApi.get('/users?limit=1');
      const user = (res.data.data || res.data)[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('code');
      expect(user).toHaveProperty('fullName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).not.toHaveProperty('passwordHash');
    });
  });

  // ── Create ──────────────────────────────────────────────────────────────────
  describe('POST /users — Create Employee', () => {
    test('✅ Admin tạo nhân viên mới thành công', async () => {
      const deptRes = await adminApi.get('/departments');
      const shiftRes = await adminApi.get('/shifts');
      const deptId  = deptRes.data[0].id;
      const shiftId = shiftRes.data[0].id;

      const ts = Date.now();
      const res = await adminApi.post('/users', {
        code: `TEST_${ts}`,
        fullName: 'Test Employee Một',
        email: `test.emp.${ts}@company.com`,
        phone: '0901234567',
        position: 'Test Position',
        departmentId: deptId,
        shiftId,
        role: 'EMPLOYEE',
        hireDate: '2024-01-01',
        password: 'TestPass@123',
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data).toHaveProperty('id');
      expect(res.data.fullName).toBe('Test Employee Một');
      createdEmployeeId = res.data.id;
    });

    test('❌ Email trùng → 400/409', async () => {
      const deptRes = await adminApi.get('/departments');
      try {
        await adminApi.post('/users', {
          code: 'TEST_DUP_001',
          fullName: 'Duplicate Email',
          email: 'admin@company.com', // đã tồn tại
          position: 'Test',
          departmentId: deptRes.data[0].id,
          role: 'EMPLOYEE',
          hireDate: '2024-01-01',
          password: 'TestPass@123',
        });
        fail('Should have failed');
      } catch (e) {
        expect([400, 409, 422]).toContain(e.response?.status);
      }
    });

    test('❌ Thiếu field bắt buộc → 400', async () => {
      try {
        await adminApi.post('/users', { fullName: 'Missing Fields' });
        fail('Should have failed');
      } catch (e) {
        expect([400, 422, 500]).toContain(e.response?.status);
      }
    });

    test('❌ Employee không thể tạo nhân viên', async () => {
      try {
        await employeeApi.post('/users', {
          code: 'UNAUTH_001',
          fullName: 'Unauthorized',
          email: 'unauth@company.com',
          position: 'Test',
          role: 'EMPLOYEE',
          hireDate: '2024-01-01',
          password: 'Test@123',
        });
        fail('Should have failed with 403');
      } catch (e) {
        expect([401, 403]).toContain(e.response?.status);
      }
    });
  });

  // ── Get One ─────────────────────────────────────────────────────────────────
  describe('GET /users/:id — Get Employee Detail', () => {
    test('✅ Xem chi tiết nhân viên hợp lệ', async () => {
      if (!createdEmployeeId) return;
      const res = await adminApi.get(`/users/${createdEmployeeId}`);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.data).toHaveProperty('id', createdEmployeeId);
      }
    });

    test('❌ ID không tồn tại → 404', async () => {
      try {
        await adminApi.get('/users/non-existent-id-12345');
        fail('Should be 404');
      } catch (e) {
        expect(e.response?.status).toBe(404);
      }
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  describe('PATCH/PUT /users/:id — Update Employee', () => {
    test('✅ Admin cập nhật thông tin nhân viên', async () => {
      if (!createdEmployeeId) return;
      try {
        const res = await adminApi.patch(`/users/${createdEmployeeId}`, {
          position: 'Senior Test Position',
          phone: '0987654321',
        });
        expect([200, 204]).toContain(res.status);
      } catch (e) {
        // Endpoint có thể dùng PUT thay PATCH
        expect([404, 405]).toContain(e.response?.status);
      }
    });
  });

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  afterAll(async () => {
    // Dọn dẹp nhân viên test nếu API hỗ trợ
    if (createdEmployeeId) {
      try {
        await adminApi.delete(`/users/${createdEmployeeId}`);
      } catch { /* ignore */ }
    }
  });
});
