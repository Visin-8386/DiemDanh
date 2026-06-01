// seed.js — JavaScript version for Docker production container
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hashSync(pw, 10);

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getWorkdays(start, end) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

async function main() {
  console.log('🌱 Seeding database — large dataset...');

  // ── DEPARTMENTS ─────────────────────────────────────────────────────────────
  const deptDefs = [
    { name: 'Phòng Công Nghệ Thông Tin',     code: 'IT',   description: 'Phát triển và vận hành hệ thống' },
    { name: 'Phòng Nhân Sự',                 code: 'HR',   description: 'Quản lý nhân sự và tuyển dụng' },
    { name: 'Phòng Marketing',                code: 'MKT',  description: 'Marketing và truyền thông' },
    { name: 'Phòng Kế Toán',                 code: 'ACC',  description: 'Tài chính và kế toán' },
    { name: 'Phòng Kinh Doanh',              code: 'SALE', description: 'Bán hàng và phát triển khách hàng' },
    { name: 'Phòng Vận Hành',                code: 'OPS',  description: 'Vận hành và hậu cần' },
    { name: 'Phòng Nghiên Cứu & Phát Triển', code: 'RD',   description: 'R&D sản phẩm mới' },
    { name: 'Phòng Pháp Lý',                 code: 'LEG',  description: 'Pháp chế và tuân thủ' },
  ];

  const depts = {};
  for (const d of deptDefs) {
    const dept = await prisma.department.upsert({
      where: { code: d.code }, update: { name: d.name }, create: d,
    });
    depts[d.code] = dept.id;
  }
  console.log(`  ✅ ${deptDefs.length} departments`);

  // ── SHIFTS ──────────────────────────────────────────────────────────────────
  const shiftDefs = [
    { name: 'Ca Hành Chính', code: 'HC',    startTime: '08:00', endTime: '17:30', workDays: [1,2,3,4,5], isDefault: true,  lateThresholdMins: 15, earlyLeaveMins: 15 },
    { name: 'Ca Sáng',       code: 'SANG',  startTime: '06:00', endTime: '14:00', workDays: [1,2,3,4,5,6], isDefault: false, lateThresholdMins: 10, earlyLeaveMins: 10 },
    { name: 'Ca Chiều',      code: 'CHIEU', startTime: '14:00', endTime: '22:00', workDays: [1,2,3,4,5,6], isDefault: false, lateThresholdMins: 10, earlyLeaveMins: 10 },
    { name: 'Ca Đêm',        code: 'DEM',   startTime: '22:00', endTime: '06:00', workDays: [1,2,3,4,5,6], isDefault: false, lateThresholdMins: 20, earlyLeaveMins: 20 },
  ];

  const shifts = {};
  for (const s of shiftDefs) {
    const shift = await prisma.shift.upsert({ where: { code: s.code }, update: {}, create: s });
    shifts[s.code] = shift.id;
  }
  console.log(`  ✅ ${shiftDefs.length} shifts`);

  // ── SPECIAL ACCOUNTS ────────────────────────────────────────────────────────
  const specials = [
    { code:'ADMIN',    fullName:'Quản Trị Viên',     email:'admin@company.com',     role:'SUPER_ADMIN',     dept:'HR',  pw:'Admin@123456', position:'System Administrator',     hire:'2020-01-01' },
    { code:'HR001',    fullName:'Trần Thị Hoa',       email:'hr@company.com',        role:'HR_MANAGER',      dept:'HR',  pw:'Hr@123456',    position:'HR Manager',               hire:'2021-03-15' },
    { code:'HEAD_IT',  fullName:'Nguyễn Minh Tuấn',   email:'head.it@company.com',   role:'DEPARTMENT_HEAD', dept:'IT',  pw:'Head@123456',  position:'IT Department Head',       hire:'2020-06-01' },
    { code:'HEAD_MKT', fullName:'Lê Thị Thu',          email:'head.mkt@company.com',  role:'DEPARTMENT_HEAD', dept:'MKT', pw:'Head@123456',  position:'Marketing Department Head',hire:'2021-01-10' },
    { code:'NV001',    fullName:'Nguyễn Văn An',      email:'nv001@company.com',     role:'EMPLOYEE',        dept:'IT',  pw:'Employee@123', position:'Senior Developer',         hire:'2022-02-01' },
    { code:'NV002',    fullName:'Trần Thị Bình',      email:'nv002@company.com',     role:'EMPLOYEE',        dept:'IT',  pw:'Employee@123', position:'Frontend Developer',       hire:'2022-05-15' },
    { code:'NV003',    fullName:'Lê Minh Châu',       email:'nv003@company.com',     role:'EMPLOYEE',        dept:'HR',  pw:'Employee@123', position:'HR Specialist',            hire:'2023-01-01' },
    { code:'NV004',    fullName:'Phạm Quốc Dũng',     email:'nv004@company.com',     role:'EMPLOYEE',        dept:'MKT', pw:'Employee@123', position:'Marketing Executive',      hire:'2023-03-01' },
    { code:'NV005',    fullName:'Hoàng Thị Lan',      email:'nv005@company.com',     role:'EMPLOYEE',        dept:'IT',  pw:'Employee@123', position:'DevOps Engineer',          hire:'2022-08-01' },
  ];

  const empIds = {};
  for (const e of specials) {
    const emp = await prisma.employee.upsert({
      where: { code: e.code },
      // Luôn cập nhật email + password để test credentials không bị stale
      update: { email: e.email, passwordHash: hash(e.pw), role: e.role },
      create: {
        code: e.code, fullName: e.fullName, email: e.email, role: e.role,
        position: e.position, departmentId: depts[e.dept], shiftId: shifts['HC'],
        hireDate: new Date(e.hire), passwordHash: hash(e.pw), annualLeaveLeft: 12,
        isFaceRegistered: e.role !== 'SUPER_ADMIN',
      },
    });
    empIds[e.code] = emp.id;
  }

  // ── BULK EMPLOYEES ──────────────────────────────────────────────────────────
  const names = [
    'Nguyễn Văn Hùng','Trần Thị Mai','Lê Quang Huy','Phạm Thị Nga','Hoàng Văn Nam',
    'Đỗ Thị Hương','Vũ Minh Khoa','Bùi Thị Linh','Đinh Văn Tú','Lý Thị Thảo',
    'Phan Văn Đức','Trương Thị Yến','Ngô Minh Quân','Dương Thị Hà','Hà Văn Sơn',
    'Cao Thị Thu','Lưu Văn Phong','Tạ Thị Nhung','Mai Văn Lộc','Đặng Thị Vân',
    'Trịnh Minh Đạt','Võ Thị Kim','Châu Văn Bình','Huỳnh Thị Trang','Tống Văn Lâm',
    'Hồ Thị Diệp','Lương Minh Chiến','Nông Thị Hằng','Mạc Văn Thắng','Tô Thị Phương',
    'Kiều Văn Khánh','Liêu Thị Xuân','Giang Minh Tuấn','Ôn Thị Bích','Thiệu Văn Duy',
    'Sầm Thị Ngọc','Tăng Minh Phúc','Quách Thị Lan','Đào Văn Hải','La Thị Cẩm',
    'Doãn Minh Long','Chung Thị Hạnh','Giáp Văn Thành','Ninh Thị Quyên','Thái Minh Khải',
    'Phùng Thị Dung','Tiêu Văn Lực','Mã Thị Thơm','Cù Minh Nghĩa','Vi Thị Giang',
    'Đàm Văn Trọng','Linh Thị Mỹ','Lạc Văn Cường','Lê Thị Bảo','Cao Văn Kiên',
    'Nguyễn Thị Thu Hương','Trần Văn Quý','Phạm Minh Nhật','Lê Thị Thanh','Vũ Văn Đại',
    'Bùi Minh Hiếu','Đỗ Thị Phúc','Hoàng Văn Bảo','Đinh Thị Hoa','Lý Văn Sáng',
    'Phan Thị Kim Anh','Trương Văn Mạnh','Ngô Thị Huyền','Dương Văn Quang','Hà Thị Loan',
    'Cao Văn Tiến','Lưu Thị Thanh Hà','Mai Văn Tuấn','Đặng Minh Phương','Trịnh Thị Nga',
    'Võ Văn Thịnh','Châu Thị Hiền','Huỳnh Văn Tài','Tống Thị Bình','Hồ Văn Phát',
    'Lương Thị Hoa','Nông Văn Toàn','Mạc Thị Hồng','Kiều Minh Tuấn','Liêu Văn Phú',
    'Giang Thị Nhàn','Ôn Văn Thịnh','Thiệu Thị Yến','Sầm Văn Cảnh','Tăng Thị Tuyết',
    'Quách Văn Long','Đào Thị Hạnh','La Văn Dương','Doãn Thị Kim Chi','Chung Minh Nhân',
    'Giáp Thị Ngọc Ánh','Ninh Văn Phong','Thái Thị Bảo Châu','Phùng Minh Đức','Tiêu Thị Trúc',
    'Mã Văn Liêm','Cù Thị Phương Nga','Vi Văn Hải','Đàm Thị Bích Ngọc','Lạc Minh Hào',
  ];

  const positions = {
    IT:   ['Backend Developer','Frontend Developer','Fullstack Developer','QA Engineer','DevOps Engineer','Data Engineer'],
    HR:   ['HR Specialist','Recruiter','Training Coordinator','Payroll Specialist'],
    MKT:  ['Marketing Specialist','Content Creator','SEO Specialist','Brand Manager'],
    ACC:  ['Accountant','Senior Accountant','Financial Analyst','Tax Specialist'],
    SALE: ['Sales Executive','Account Manager','Business Development','Key Account'],
    OPS:  ['Operations Specialist','Logistics Coordinator','Warehouse Staff'],
    RD:   ['Research Engineer','Data Scientist','ML Engineer','Product Engineer'],
    LEG:  ['Legal Counsel','Compliance Officer','Contract Specialist'],
  };

  const deptCodes = Object.keys(depts);
  let nameIdx = 0, nvCounter = 5;
  const allEmpIds = Object.values(empIds);

  for (let i = 0; i < 111; i++) {
    const deptCode = deptCodes[i % deptCodes.length];
    const name = names[nameIdx % names.length]; nameIdx++; nvCounter++;
    const code = `NV${String(nvCounter).padStart(3, '0')}`;
    const emailSlug = code.toLowerCase();
    const email = `${emailSlug}@company.com`;
    const shiftCode = i % 10 === 0 ? 'SANG' : i % 15 === 0 ? 'CHIEU' : 'HC';

    try {
      const emp = await prisma.employee.upsert({
        where: { email }, update: {},
        create: {
          code, fullName: name, email,
          position: randomItem(positions[deptCode] || ['Staff']),
          departmentId: depts[deptCode], shiftId: shifts[shiftCode],
          role: 'EMPLOYEE',
          hireDate: new Date(randomInt(2019,2024), randomInt(0,11), randomInt(1,28)),
          passwordHash: hash('Employee@123'),
          annualLeaveLeft: randomInt(5, 15),
          isFaceRegistered: Math.random() > 0.3,
          status: Math.random() > 0.05 ? 'ACTIVE' : 'INACTIVE',
        },
      });
      allEmpIds.push(emp.id);
    } catch { /* skip duplicate */ }
  }
  console.log(`  ✅ ${allEmpIds.length} total employees`);

  // ── ATTENDANCE — 6 tháng gần nhất ──────────────────────────────────────────
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const workdays = getWorkdays(sixMonthsAgo, today);
  console.log(`  🗓️ Workdays: ${workdays.length} days × ${allEmpIds.length} employees`);

  let attendanceCount = 0;
  const BATCH = 30;

  for (let bi = 0; bi < allEmpIds.length; bi += BATCH) {
    const batch = allEmpIds.slice(bi, bi + BATCH);
    for (const empId of batch) {
      const lateProb = Math.random() * 0.2;
      const absentProb = Math.random() * 0.07;
      const data = [];

      for (const day of workdays) {
        const dateOnly = new Date(day); dateOnly.setHours(0,0,0,0);
        const rand = Math.random();

        if (rand < absentProb) {
          data.push({ employeeId:empId, date:dateOnly, status:'ABSENT', workMinutes:0, lateMinutes:0, overtimeMinutes:0 });
        } else if (rand < absentProb + 0.03) {
          data.push({ employeeId:empId, date:dateOnly, status:'LEAVE',  workMinutes:0, lateMinutes:0, overtimeMinutes:0 });
        } else if (rand < absentProb + 0.03 + lateProb) {
          const late = randomInt(5, 90);
          const inT  = new Date(dateOnly); inT.setHours(8, 15 + late, 0, 0);
          const outT = new Date(dateOnly); outT.setHours(17, 30 + randomInt(-15,30), 0, 0);
          data.push({
            employeeId:empId, date:dateOnly,
            checkInTime:inT, checkOutTime:outT,
            checkInConfidence: 0.75 + Math.random()*0.2,
            checkOutConfidence: 0.75 + Math.random()*0.2,
            status:'LATE', workMinutes:Math.round((outT-inT)/60000), lateMinutes:late, overtimeMinutes:0,
          });
        } else {
          const outMin = randomInt(-5,60);
          const inT  = new Date(dateOnly); inT.setHours(8, randomInt(-5,10), 0, 0);
          const outT = new Date(dateOnly); outT.setHours(17, 30+outMin, 0, 0);
          data.push({
            employeeId:empId, date:dateOnly,
            checkInTime:inT, checkOutTime:outT,
            checkInConfidence: 0.82 + Math.random()*0.17,
            checkOutConfidence: 0.82 + Math.random()*0.17,
            status:'PRESENT', workMinutes:Math.round((outT-inT)/60000),
            lateMinutes:0, overtimeMinutes: outMin > 0 ? outMin : 0,
          });
        }
      }

      await prisma.attendance.createMany({ data, skipDuplicates: true });
      attendanceCount += data.length;
    }
    process.stdout.write(`\r  ⏳ ${Math.min(bi+BATCH, allEmpIds.length)}/${allEmpIds.length} employees`);
  }
  console.log(`\n  ✅ ~${attendanceCount} attendance records`);

  // ── LEAVE REQUESTS ──────────────────────────────────────────────────────────
  const leaveTypes = ['ANNUAL','SICK','UNPAID','BUSINESS','MATERNITY','OTHER'];
  const lStatuses  = ['PENDING','APPROVED','REJECTED'];
  const reasons    = ['Việc cá nhân','Gia đình có việc','Khám bệnh','Công tác','Nghỉ dưỡng','Đám cưới','Học tập','Sự kiện gia đình'];
  const rejectReasons = ['Không đủ ngày phép','Bận dự án','Thiếu thông tin'];
  let leaveCount = 0;

  for (const empId of allEmpIds.slice(0, 80)) {
    const n = randomInt(0, 4);
    for (let i = 0; i < n; i++) {
      const mAgo = randomInt(1,6);
      const start = new Date(today);
      start.setMonth(start.getMonth() - mAgo);
      start.setDate(randomInt(1,20)); start.setHours(0,0,0,0);
      const days = randomInt(1,5);
      const end = new Date(start); end.setDate(end.getDate() + days - 1);
      const status = randomItem(lStatuses);
      const approver = status !== 'PENDING' ? randomItem([empIds['ADMIN'], empIds['HR001']]) : null;
      try {
        await prisma.leaveRequest.create({
          data: {
            employeeId:empId, type:randomItem(leaveTypes),
            startDate:start, endDate:end, totalDays:days,
            reason:randomItem(reasons), status,
            approvedById:approver, approvedAt:approver ? new Date() : null,
            rejectReason:status === 'REJECTED' ? randomItem(rejectReasons) : null,
          },
        });
        leaveCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`  ✅ ${leaveCount} leave requests`);

  // ── AUDIT LOGS ──────────────────────────────────────────────────────────────
  const actions = ['LOGIN','CREATE_EMPLOYEE','UPDATE_EMPLOYEE','APPROVE_LEAVE','REJECT_LEAVE','MANUAL_CHECKIN'];
  let auditCount = 0;
  for (let i = 0; i < 300; i++) {
    const daysAgo = randomInt(0,180);
    const logDate = new Date(today); logDate.setDate(logDate.getDate() - daysAgo);
    try {
      await prisma.auditLog.create({
        data: {
          userId: randomItem(allEmpIds.slice(0,15)),
          action: randomItem(actions),
          entity: randomItem(['Employee','Attendance','LeaveRequest',null]),
          entityId: `id-${randomInt(1000,9999)}`,
          metadata: { ts: logDate.toISOString() },
          ipAddress: `192.168.${randomInt(1,5)}.${randomInt(1,254)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          createdAt: logDate,
        },
      });
      auditCount++;
    } catch { /* skip */ }
  }
  console.log(`  ✅ ${auditCount} audit logs`);

  console.log('\n🎉 Seed completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin:       admin@company.com  / Admin@123456');
  console.log('👤 HR Manager:  hr@company.com     / Hr@123456');
  console.log('👤 IT Head:     head.it@company.com/ Head@123456');
  console.log('👤 Employee:    nv001@company.com  / Employee@123');
  console.log(`📊 Total employees: ${allEmpIds.length}`);
  console.log(`📅 Attendance records: ~${attendanceCount}`);
  console.log(`📝 Leave requests: ${leaveCount}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
