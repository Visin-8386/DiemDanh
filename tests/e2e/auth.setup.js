/**
 * Auth Setup — chạy 1 lần trước tất cả tests.
 * Dùng Playwright APIRequestContext để login → lấy tokens từ API.
 * Lưu tokens + user vào file JSON để inject vào localStorage trong từng test.
 */
const { test: setup } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const AUTH_FILE = path.join(__dirname, '.auth', 'admin.json');

setup('get auth tokens via API', async ({ request }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Gọi API login trực tiếp (không dùng browser)
  const res = await request.post('/api/auth/login', {
    data: { email: 'admin@company.com', password: 'Admin@123456' },
  });

  if (!res.ok()) {
    throw new Error(`Login API failed: ${res.status()} ${await res.text()}`);
  }

  const body = await res.json();
  const { user, accessToken, refreshToken } = body;

  if (!accessToken || !user) {
    throw new Error(`Missing tokens in response: ${JSON.stringify(body)}`);
  }

  // Lưu vào file để tests đọc lại
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ user, accessToken, refreshToken }, null, 2));
  console.log(`✅ Auth tokens saved. User: ${user.fullName} (${user.role})`);
});
