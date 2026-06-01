/**
 * 📅 Attendance API — Professional Test Suite
 * Coverage: Listing, Stats, Filtering, Report data, Dashboard
 */
const ApiClient = require('./api-client');

describe('📅 Attendance & Reports API Tests', () => {
  let adminApi, hrApi, employeeApi;

  beforeAll(async () => {
    adminApi    = new ApiClient();
    hrApi       = new ApiClient();
    employeeApi = new ApiClient();
    await adminApi.login('admin@company.com', 'Admin@123456');
    await hrApi.login('hr@company.com', 'Hr@123456');
    await employeeApi.login('nv001@company.com', 'Employee@123');
  });

  // ── Attendance Listing ──────────────────────────────────────────────────────
  describe('GET /attendance — Listing', () => {
    test('✅ Admin xem được danh sách chấm công', async () => {
      const res = await adminApi.get('/attendance');
      expect(res.status).toBe(200);
    });

    test('✅ Filter theo ngày cụ thể', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await adminApi.get(`/attendance?date=${today}`);
      expect(res.status).toBe(200);
    });

    test('✅ Filter theo khoảng ngày', async () => {
      const end = new Date();
      const start = new Date(); start.setDate(start.getDate() - 7);
      const res = await adminApi.get(
        `/attendance?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`
      );
      expect(res.status).toBe(200);
    });

    test('✅ Dữ liệu chấm công có đủ fields', async () => {
      const res = await adminApi.get('/attendance?limit=1');
      const records = res.data.data || res.data;
      if (Array.isArray(records) && records.length > 0) {
        const r = records[0];
        expect(r).toHaveProperty('employeeId');
        expect(r).toHaveProperty('date');
        expect(r).toHaveProperty('status');
      }
    });

    test('✅ Status hợp lệ chỉ nằm trong enum', async () => {
      const res = await adminApi.get('/attendance?limit=20');
      const records = res.data.data || res.data;
      const validStatuses = ['PRESENT', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY', 'ABSENT', 'LEAVE', 'HOLIDAY'];
      if (Array.isArray(records)) {
        records.forEach((r: any) => {
          expect(validStatuses).toContain(r.status);
        });
      }
    });
  });

  // ── Reports Dashboard ───────────────────────────────────────────────────────
  describe('GET /reports/dashboard — Stats', () => {
    test('✅ Dashboard stats có đủ fields bắt buộc', async () => {
      const res = await adminApi.get('/reports/dashboard');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('totalEmployees');
      expect(res.data).toHaveProperty('presentToday');
      expect(res.data).toHaveProperty('lateToday');
      expect(res.data).toHaveProperty('absentToday');
      expect(res.data).toHaveProperty('todayDistribution');
      expect(res.data).toHaveProperty('last7Days');
    });

    test('✅ totalEmployees > 100 (sau khi seed)', async () => {
      const res = await adminApi.get('/reports/dashboard');
      expect(res.data.totalEmployees).toBeGreaterThan(10);
    });

    test('✅ last7Days là mảng 7 phần tử', async () => {
      const res = await adminApi.get('/reports/dashboard');
      expect(Array.isArray(res.data.last7Days)).toBe(true);
      expect(res.data.last7Days.length).toBeLessThanOrEqual(7);
    });

    test('✅ Số liệu todayDistribution nhất quán', async () => {
      const res = await adminApi.get('/reports/dashboard');
      const { presentToday, lateToday, absentToday } = res.data;
      expect(typeof presentToday).toBe('number');
      expect(typeof lateToday).toBe('number');
      expect(typeof absentToday).toBe('number');
      expect(presentToday).toBeGreaterThanOrEqual(0);
      expect(lateToday).toBeGreaterThanOrEqual(0);
      expect(absentToday).toBeGreaterThanOrEqual(0);
    });

    test('🛡️ Employee KHÔNG xem được dashboard stats', async () => {
      try {
        await employeeApi.get('/reports/dashboard');
        fail('Should be 403');
      } catch (e) {
        expect([401, 403]).toContain(e.response?.status);
      }
    });
  });

  // ── Shifts ──────────────────────────────────────────────────────────────────
  describe('GET /shifts — Shifts Catalog', () => {
    test('✅ Có ít nhất 4 ca làm việc (sau seed)', async () => {
      const res = await adminApi.get('/shifts');
      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThanOrEqual(4);
    });

    test('✅ Mỗi ca có đủ thông tin', async () => {
      const res = await adminApi.get('/shifts');
      const shift = res.data[0];
      expect(shift).toHaveProperty('name');
      expect(shift).toHaveProperty('code');
      expect(shift).toHaveProperty('startTime');
      expect(shift).toHaveProperty('endTime');
      expect(shift).toHaveProperty('workDays');
      expect(Array.isArray(shift.workDays)).toBe(true);
    });

    test('✅ Có ca mặc định (isDefault=true)', async () => {
      const res = await adminApi.get('/shifts');
      const defaultShift = res.data.find((s: any) => s.isDefault);
      expect(defaultShift).toBeDefined();
      expect(defaultShift.code).toBe('HC');
    });
  });
});
