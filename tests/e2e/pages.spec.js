/**
 * E2E Tests — Next.js Web UI Routing & 404 Prevention
 *
 * Chiến lược auth:
 *   - auth.setup.js lấy JWT tokens từ API → lưu vào .auth/admin.json
 *   - beforeEach dùng page.addInitScript() inject tokens vào localStorage
 *     TRƯỚC khi bất kỳ JS nào chạy → Zustand persist đọc đúng ngay lập tức
 *     → layout.useEffect() nhìn thấy isAuthenticated() = true → không redirect
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ─── Load tokens đã lưu từ setup ─────────────────────────────────────────────
function getAuthTokens() {
  const file = path.join(__dirname, '.auth', 'admin.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// ─── Inject auth vào localStorage trước khi page JS chạy ─────────────────────
// Zustand persist đọc localStorage khi store khởi tạo → sẽ thấy token ngay
test.beforeEach(async ({ page }) => {
  const tokens = getAuthTokens();
  await page.addInitScript((t) => {
    // Format Zustand persist middleware lưu (key: 'diemdanh-auth')
    localStorage.setItem('diemdanh-auth', JSON.stringify({
      state: {
        user: t.user,
        accessToken: t.accessToken,
        refreshToken: t.refreshToken,
      },
      version: 0,
    }));
    // Các key phụ mà setAuth() cũng lưu thêm
    localStorage.setItem('access_token', t.accessToken);
    localStorage.setItem('refresh_token', t.refreshToken);
  }, tokens);
});

// ─── Helper: navigate và chờ dashboard layout render ─────────────────────────
async function goDashboard(page, url) {
  await page.goto(url);
  // Sidebar = bằng chứng layout đã render và auth đã pass
  await page.waitForSelector('aside', { timeout: 12000 });
  // Chờ <main> content render
  await page.waitForSelector('main h1', { timeout: 8000 });
}

// ─── Helper: lấy h1 trong <main> ─────────────────────────────────────────────
const mainH1 = (page) => page.locator('main h1');

// ─────────────────────────────────────────────────────────────────────────────
test.describe('🖥️ Next.js Web UI — Routing & 404 Prevention Tests', () => {

  // ── 1. Login page ──────────────────────────────────────────────────────────
  test('✅ Trang Login hiển thị đúng (không bị 404)', async ({ page }) => {
    await page.goto('/login');
    // Login page chỉ có 1 h1
    await expect(page.locator('h1')).toHaveText('DiemDanh');
    await expect(page.locator('h2')).toContainText('Đăng Nhập');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();
    await expect(page.locator('text=Tài khoản demo')).toBeVisible();
  });

  // ── 2. Dashboard ───────────────────────────────────────────────────────────
  test('✅ Trang Dashboard — stat cards & charts', async ({ page }) => {
    await goDashboard(page, '/dashboard');
    await expect(mainH1(page)).toHaveText('Tổng Quan');
    await expect(page.getByText('Có Mặt Hôm Nay', { exact: true })).toBeVisible();
    await expect(page.getByText('Đi Muộn',         { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Vắng Mặt',        { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Chờ Duyệt',       { exact: true })).toBeVisible();
    await expect(page.locator('text=Làm mới')).toBeVisible();
    await expect(page.locator('text=Tỷ Lệ Có Mặt 7 Ngày Qua')).toBeVisible();
  });

  // ── 3. Attendance (camera) ─────────────────────────────────────────────────
  test('✅ Trang Điểm Danh (Camera) — không bị 404', async ({ page }) => {
    await goDashboard(page, '/attendance');
    await expect(mainH1(page)).toHaveText('Điểm Danh');
    await expect(page.getByText('Vào', { exact: true })).toBeVisible();
    await expect(page.getByText('Ra',  { exact: true })).toBeVisible();
    await expect(page.locator('#checkin-btn')).toBeVisible();
    await expect(page.locator('text=Hướng dẫn')).toBeVisible();
    await expect(page.locator('text=Thời Gian Hiện Tại')).toBeVisible();
  });

  // ── 4. Employees ──────────────────────────────────────────────────────────
  test('✅ Trang Nhân Viên — có nút Thêm Nhân Viên', async ({ page }) => {
    await goDashboard(page, '/employees');
    await expect(mainH1(page)).toHaveText('Nhân Viên');
    await expect(page.locator('#add-employee-btn')).toBeVisible();
    await expect(page.locator('input[placeholder*="tên, mã nhân viên"]')).toBeVisible();
    await expect(page.locator('select:has(option[value=""])')).toBeVisible();
  });

  // ── 5. Timesheets ─────────────────────────────────────────────────────────
  test('✅ Trang Chấm Công (Timesheets) — không bị 404', async ({ page }) => {
    await goDashboard(page, '/timesheets');
    await expect(mainH1(page)).toHaveText('Chấm Công');
    await expect(page.locator('text=Xuất Excel')).toBeVisible();
    await expect(page.locator('th:has-text("Ngày")')).toBeVisible();
    await expect(page.locator('th:has-text("Nhân Viên")')).toBeVisible();
    await expect(page.locator('th:has-text("Trạng Thái")')).toBeVisible();
  });

  // ── 6. Leave ──────────────────────────────────────────────────────────────
  test('✅ Trang Đơn Nghỉ Phép — không bị 404', async ({ page }) => {
    await goDashboard(page, '/leave');
    await expect(mainH1(page)).toHaveText('Đơn Nghỉ Phép');
    await expect(page.locator('text=Tạo Đơn Nghỉ')).toBeVisible();
    await expect(page.locator('text=Đơn Của Tôi')).toBeVisible();
    await expect(page.locator('text=Quản Lý Đơn')).toBeVisible();
  });

  // ── 7. Reports ────────────────────────────────────────────────────────────
  test('✅ Trang Báo Cáo — không bị 404', async ({ page }) => {
    await goDashboard(page, '/reports');
    await expect(mainH1(page)).toHaveText('Báo Cáo');
    await expect(page.locator('text=Xuất Excel')).toBeVisible();
    await expect(page.locator('text=Tổng Đúng Giờ')).toBeVisible();
    await expect(page.locator('text=Tổng Đi Muộn')).toBeVisible();
    await expect(page.locator('text=Tổng Vắng Mặt')).toBeVisible();
    await expect(page.locator('text=Chi Tiết Nhân Viên')).toBeVisible();
  });

  // ── 8. Settings ───────────────────────────────────────────────────────────
  test('✅ Trang Cài Đặt — không bị 404', async ({ page }) => {
    await goDashboard(page, '/settings');
    await expect(mainH1(page)).toHaveText('Cài Đặt');
    await expect(page.locator('text=Thông Tin Tài Khoản')).toBeVisible();
    await expect(page.locator('text=Thông Tin Hệ Thống')).toBeVisible();
    await expect(page.locator('text=InsightFace buffalo_sc')).toBeVisible();
    await expect(page.locator('text=PostgreSQL 16')).toBeVisible();
  });

  // ── 9. Modal: Thêm Nhân Viên ──────────────────────────────────────────────
  test('✅ Mở / đóng modal Thêm Nhân Viên không bị lỗi', async ({ page }) => {
    await goDashboard(page, '/employees');
    await page.click('#add-employee-btn');
    await expect(page.locator('text=Thêm Nhân Viên Mới')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('text=Tạo Nhân Viên')).toBeVisible();
    await page.click('text=Hủy');
    await expect(page.locator('text=Thêm Nhân Viên Mới')).not.toBeVisible({ timeout: 3000 });
  });

  // ── 10. Modal: Tạo Đơn Nghỉ ───────────────────────────────────────────────
  test('✅ Mở / đóng modal Tạo Đơn Nghỉ không bị lỗi', async ({ page }) => {
    await goDashboard(page, '/leave');
    await page.click('text=Tạo Đơn Nghỉ');
    await expect(page.locator('text=Tạo Đơn Nghỉ Phép')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('text=Gửi Đơn')).toBeVisible();
    await page.click('text=Hủy');
    await expect(page.locator('text=Tạo Đơn Nghỉ Phép')).not.toBeVisible({ timeout: 3000 });
  });

  // ── 11. Sidebar navigation ────────────────────────────────────────────────
  test('✅ Sidebar navigation — click các link không bị 404', async ({ page }) => {
    await goDashboard(page, '/dashboard');
    const links = [
      { label: 'Điểm Danh',  h1: 'Điểm Danh'  },
      { label: 'Chấm Công',   h1: 'Chấm Công'   },
      { label: 'Nhân Viên',   h1: 'Nhân Viên'   },
    ];
    for (const { label, h1 } of links) {
      await page.locator(`aside a:has-text("${label}")`).click();
      await page.waitForSelector('main h1', { timeout: 8000 });
      await expect(mainH1(page)).toHaveText(h1, { timeout: 6000 });
    }
  });

  // ── 12. Logout flow ───────────────────────────────────────────────────────
  test('✅ Đăng xuất → redirect về trang Login', async ({ page }) => {
    await goDashboard(page, '/dashboard');
    await page.click('#logout-btn');
    await page.waitForURL('**/login', { timeout: 8000 });
    await expect(page.locator('h2')).toContainText('Đăng Nhập');
  });
});
