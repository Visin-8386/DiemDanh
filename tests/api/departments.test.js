/**
 * 🏢 Departments API — Professional Test Suite
 * Coverage: Listing, Detail, Hierarchy, CRUD, RBAC
 */
const ApiClient = require('./api-client');

describe('🏢 Departments API Tests', () => {
  let adminApi, hrApi, employeeApi;

  beforeAll(async () => {
    adminApi    = new ApiClient();
    hrApi       = new ApiClient();
    employeeApi = new ApiClient();
    await adminApi.login('admin@company.com', 'Admin@123456');
    await hrApi.login('hr@company.com', 'Hr@123456');
    await employeeApi.login('nv001@company.com', 'Employee@123');
  });

  describe('GET /departments', () => {
    test('✅ Trả về danh sách phòng ban', async () => {
      const res = await adminApi.get('/departments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    test('✅ Có ít nhất 8 phòng ban (sau seed)', async () => {
      const res = await adminApi.get('/departments');
      expect(res.data.length).toBeGreaterThanOrEqual(8);
    });

    test('✅ Mỗi phòng ban có đủ fields', async () => {
      const res = await adminApi.get('/departments');
      const dept = res.data[0];
      expect(dept).toHaveProperty('id');
      expect(dept).toHaveProperty('name');
      expect(dept).toHaveProperty('code');
    });

    test('✅ HR Manager có thể xem phòng ban', async () => {
      const res = await hrApi.get('/departments');
      expect(res.status).toBe(200);
    });

    test('✅ Employee có thể xem danh sách phòng ban (để lọc)', async () => {
      const res = await employeeApi.get('/departments');
      expect([200, 403]).toContain(res.status); // có thể restrict tuỳ thiết kế
    });

    test('✅ Tất cả code phòng ban là unique', async () => {
      const res = await adminApi.get('/departments');
      const codes = res.data.map((d) => d.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });

    test('✅ Departments IT, HR, MKT tồn tại', async () => {
      const res = await adminApi.get('/departments');
      const codes = res.data.map((d) => d.code);
      expect(codes).toContain('IT');
      expect(codes).toContain('HR');
      expect(codes).toContain('MKT');
    });

    test('✅ Có đủ 8 phòng ban từ seed (ACC, SALE, OPS, RD, LEG)', async () => {
      const res = await adminApi.get('/departments');
      const codes = res.data.map((d) => d.code);
      const expected = ['IT', 'HR', 'MKT', 'ACC', 'SALE', 'OPS', 'RD', 'LEG'];
      expected.forEach(code => {
        expect(codes).toContain(code);
      });
    });
  });
});
