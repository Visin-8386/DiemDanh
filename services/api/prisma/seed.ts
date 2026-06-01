import { PrismaClient, Role, AttendanceStatus, LeaveType, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hashSync(pw, 10);

// ── Helpers ──────────────────────────────────────────────────────────────────
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Trả về Date ngày làm việc (Thứ 2-6) */
function workDate(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day);
  return d;
}

/** Lấy tất cả ngày làm việc (T2-T6) trong khoảng */
function getWorkdays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Random giờ checkin/checkout quanh mốc chuẩn */
function timeAround(baseHour: number, baseMin: number, deltaMin: number): Date {
  const d = new Date(2000, 0, 1);
  d.setHours(baseHour, baseMin + randomInt(-5, deltaMin), 0, 0);
  return d;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding database — large dataset...');

  // ── 1. DEPARTMENTS ──────────────────────────────────────────────────────────
  const deptDefs = [
    { name: 'Phòng Công Nghệ Thông Tin', code: 'IT',   description: 'Phát triển và vận hành hệ thống' },
    { name: 'Phòng Nhân Sự',             code: 'HR',   description: 'Quản lý nhân sự và tuyển dụng' },
    { name: 'Phòng Marketing',            code: 'MKT',  description: 'Marketing và truyền thông' },
    { name: 'Phòng Kế Toán',             code: 'ACC',  description: 'Tài chính và kế toán' },
    { name: 'Phòng Kinh Doanh',          code: 'SALE', description: 'Bán hàng và phát triển khách hàng' },
    { name: 'Phòng Vận Hành',            code: 'OPS',  description: 'Vận hành và hậu cần' },
    { name: 'Phòng Nghiên Cứu & Phát Triển', code: 'RD', description: 'R&D sản phẩm mới' },
    { name: 'Phòng Pháp Lý',             code: 'LEG',  description: 'Pháp chế và tuân thủ' },
  ];

  const depts: Record<string, string> = {};
  for (const d of deptDefs) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: d,
    });
    depts[d.code] = dept.id;
  }
  console.log(`  ✅ ${deptDefs.length} departments`);

  // ── 2. SHIFTS ───────────────────────────────────────────────────────────────
  const shiftDefs = [
    { name: 'Ca Hành Chính', code: 'HC',    startTime: '08:00', endTime: '17:30', workDays: [1,2,3,4,5], isDefault: true,  late: 15, early: 15 },
    { name: 'Ca Sáng',       code: 'SANG',  startTime: '06:00', endTime: '14:00', workDays: [1,2,3,4,5,6], isDefault: false, late: 10, early: 10 },
    { name: 'Ca Chiều',      code: 'CHIEU', startTime: '14:00', endTime: '22:00', workDays: [1,2,3,4,5,6], isDefault: false, late: 10, early: 10 },
    { name: 'Ca Đêm',        code: 'DEM',   startTime: '22:00', endTime: '06:00', workDays: [1,2,3,4,5,6], isDefault: false, late: 20, early: 20 },
  ];

  const shifts: Record<string, string> = {};
  for (const s of shiftDefs) {
    const shift = await prisma.shift.upsert({
      where: { code: s.code },
      update: {},
      create: {
        name: s.name, code: s.code,
        startTime: s.startTime, endTime: s.endTime,
        lateThresholdMins: s.late, earlyLeaveMins: s.early,
        workDays: s.workDays, isDefault: s.isDefault,
      },
    });
    shifts[s.code] = shift.id;
  }
  console.log(`  ✅ ${shiftDefs.length} shifts`);

  // ── 3. EMPLOYEES ────────────────────────────────────────────────────────────
  // 3a. Tài khoản đặc biệt (dùng cho test)
  const specialAccounts = [
    { code: 'ADMIN',   fullName: 'Quản Trị Viên',    email: 'admin@company.com',    role: 'SUPER_ADMIN' as Role,    dept: 'HR',  pw: 'Admin@123456',   position: 'System Administrator',    hire: '2020-01-01' },
    { code: 'HR001',   fullName: 'Trần Thị Hoa',      email: 'hr@company.com',       role: 'HR_MANAGER' as Role,     dept: 'HR',  pw: 'Hr@123456',      position: 'HR Manager',              hire: '2021-03-15' },
    { code: 'HEAD_IT', fullName: 'Nguyễn Minh Tuấn',  email: 'head.it@company.com',  role: 'DEPARTMENT_HEAD' as Role,dept: 'IT',  pw: 'Head@123456',    position: 'IT Department Head',      hire: '2020-06-01' },
    { code: 'HEAD_MKT',fullName: 'Lê Thị Thu',        email: 'head.mkt@company.com', role: 'DEPARTMENT_HEAD' as Role,dept: 'MKT', pw: 'Head@123456',    position: 'Marketing Department Head',hire: '2021-01-10' },
    { code: 'NV001',   fullName: 'Nguyễn Văn An',     email: 'nv001@company.com',    role: 'EMPLOYEE' as Role,       dept: 'IT',  pw: 'Employee@123',   position: 'Senior Developer',        hire: '2022-02-01' },
    { code: 'NV002',   fullName: 'Trần Thị Bình',     email: 'nv002@company.com',    role: 'EMPLOYEE' as Role,       dept: 'IT',  pw: 'Employee@123',   position: 'Frontend Developer',      hire: '2022-05-15' },
    { code: 'NV003',   fullName: 'Lê Minh Châu',      email: 'nv003@company.com',    role: 'EMPLOYEE' as Role,       dept: 'HR',  pw: 'Employee@123',   position: 'HR Specialist',           hire: '2023-01-01' },
    { code: 'NV004',   fullName: 'Phạm Quốc Dũng',    email: 'nv004@company.com',    role: 'EMPLOYEE' as Role,       dept: 'MKT', pw: 'Employee@123',   position: 'Marketing Executive',     hire: '2023-03-01' },
    { code: 'NV005',   fullName: 'Hoàng Thị Lan',     email: 'nv005@company.com',    role: 'EMPLOYEE' as Role,       dept: 'IT',  pw: 'Employee@123',   position: 'DevOps Engineer',         hire: '2022-08-01' },
  ];

  const empIds: Record<string, string> = {};
  for (const e of specialAccounts) {
    const emp = await prisma.employee.upsert({
      where: { email: e.email },
      update: {},
      create: {
        code: e.code, fullName: e.fullName, email: e.email,
        role: e.role, position: e.position,
        departmentId: depts[e.dept],
        shiftId: shifts['HC'],
        hireDate: new Date(e.hire),
        passwordHash: hash(e.pw),
        annualLeaveLeft: 12,
        isFaceRegistered: e.role !== 'SUPER_ADMIN',
      },
    });
    empIds[e.code] = emp.id;
  }

  // 3b. Bulk employees — 110 nhân viên ngẫu nhiên
  const vietnameseNames = [
    'Nguyễn Văn Hùng', 'Trần Thị Mai', 'Lê Quang Huy', 'Phạm Thị Nga', 'Hoàng Văn Nam',
    'Đỗ Thị Hương', 'Vũ Minh Khoa', 'Bùi Thị Linh', 'Đinh Văn Tú', 'Lý Thị Thảo',
    'Phan Văn Đức', 'Trương Thị Yến', 'Ngô Minh Quân', 'Dương Thị Hà', 'Hà Văn Sơn',
    'Cao Thị Thu', 'Lưu Văn Phong', 'Tạ Thị Nhung', 'Mai Văn Lộc', 'Đặng Thị Vân',
    'Trịnh Minh Đạt', 'Võ Thị Kim', 'Châu Văn Bình', 'Huỳnh Thị Trang', 'Tống Văn Lâm',
    'Hồ Thị Diệp', 'Lương Minh Chiến', 'Nông Thị Hằng', 'Mạc Văn Thắng', 'Tô Thị Phương',
    'Kiều Văn Khánh', 'Liêu Thị Xuân', 'Giang Minh Tuấn', 'Ôn Thị Bích', 'Thiệu Văn Duy',
    'Sầm Thị Ngọc', 'Tăng Minh Phúc', 'Quách Thị Lan', 'Đào Văn Hải', 'La Thị Cẩm',
    'Doãn Minh Long', 'Chung Thị Hạnh', 'Giáp Văn Thành', 'Ninh Thị Quyên', 'Thái Minh Khải',
    'Phùng Thị Dung', 'Tiêu Văn Lực', 'Mã Thị Thơm', 'Cù Minh Nghĩa', 'Vi Thị Giang',
    'Đàm Văn Trọng', 'Linh Thị Mỹ', 'Lạc Văn Cường', 'Lê Thị Bảo', 'Cao Văn Kiên',
    'Nguyễn Thị Thu Hương', 'Trần Văn Quý', 'Phạm Minh Nhật', 'Lê Thị Thanh', 'Vũ Văn Đại',
    'Bùi Minh Hiếu', 'Đỗ Thị Phúc', 'Hoàng Văn Bảo', 'Đinh Thị Hoa', 'Lý Văn Sáng',
    'Phan Thị Kim Anh', 'Trương Văn Mạnh', 'Ngô Thị Huyền', 'Dương Văn Quang', 'Hà Thị Loan',
    'Cao Văn Tiến', 'Lưu Thị Thanh Hà', 'Mai Văn Tuấn', 'Đặng Minh Phương', 'Trịnh Thị Nga',
    'Võ Văn Thịnh', 'Châu Thị Hiền', 'Huỳnh Văn Tài', 'Tống Thị Bình', 'Hồ Văn Phát',
    'Lương Thị Hoa', 'Nông Văn Toàn', 'Mạc Thị Hồng', 'Kiều Minh Tuấn', 'Liêu Văn Phú',
    'Giang Thị Nhàn', 'Ôn Văn Thịnh', 'Thiệu Thị Yến', 'Sầm Văn Cảnh', 'Tăng Thị Tuyết',
    'Quách Văn Long', 'Đào Thị Hạnh', 'La Văn Dương', 'Doãn Thị Kim Chi', 'Chung Minh Nhân',
    'Giáp Thị Ngọc Ánh', 'Ninh Văn Phong', 'Thái Thị Bảo Châu', 'Phùng Minh Đức', 'Tiêu Thị Trúc',
    'Mã Văn Liêm', 'Cù Thị Phương Nga', 'Vi Văn Hải', 'Đàm Thị Bích Ngọc', 'Lạc Minh Hào',
  ];

  const positions: Record<string, string[]> = {
    IT:   ['Backend Developer', 'Frontend Developer', 'Fullstack Developer', 'QA Engineer', 'DevOps Engineer', 'Data Engineer', 'Mobile Developer', 'System Analyst'],
    HR:   ['HR Specialist', 'Recruiter', 'Training Coordinator', 'Payroll Specialist', 'HRBP'],
    MKT:  ['Marketing Specialist', 'Content Creator', 'SEO Specialist', 'Brand Manager', 'Digital Marketing'],
    ACC:  ['Accountant', 'Senior Accountant', 'Financial Analyst', 'Tax Specialist', 'Auditor'],
    SALE: ['Sales Executive', 'Account Manager', 'Business Development', 'Key Account', 'Sales Analyst'],
    OPS:  ['Operations Specialist', 'Logistics Coordinator', 'Warehouse Staff', 'Procurement Officer'],
    RD:   ['Research Engineer', 'Data Scientist', 'ML Engineer', 'Product Engineer', 'Innovation Lead'],
    LEG:  ['Legal Counsel', 'Compliance Officer', 'Contract Specialist', 'Paralegal'],
  };

  const deptCodes = Object.keys(depts);
  let nameIdx = 0;
  let nvCounter = 6;
  const allEmpIds: string[] = Object.values(empIds);

  for (let i = 0; i < 111; i++) {
    const deptCode = deptCodes[i % deptCodes.length];
    const name = vietnameseNames[nameIdx % vietnameseNames.length];
    nameIdx++;
    nvCounter++;
    const code = `NV${String(nvCounter).padStart(3, '0')}`;
    const emailPart = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    const email = `${emailPart}.${nvCounter}@company.com`;
    const hireYear = randomInt(2019, 2024);
    const hireMonth = randomInt(1, 12);
    const shiftCode = i % 10 === 0 ? 'SANG' : i % 15 === 0 ? 'CHIEU' : 'HC';

    try {
      const emp = await prisma.employee.upsert({
        where: { email },
        update: {},
        create: {
          code, fullName: name, email,
          position: randomItem(positions[deptCode] || ['Staff']),
          departmentId: depts[deptCode],
          shiftId: shifts[shiftCode],
          role: 'EMPLOYEE',
          hireDate: new Date(hireYear, hireMonth - 1, randomInt(1, 28)),
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

  // ── 4. ATTENDANCE — 6 tháng gần nhất ───────────────────────────────────────
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const workdays = getWorkdays(sixMonthsAgo, today);

  console.log(`  🗓️ Generating attendance for ${workdays.length} workdays × ${allEmpIds.length} employees...`);

  // Batch insert để tránh timeout
  let attendanceCount = 0;
  const BATCH_SIZE = 50;

  for (let bi = 0; bi < allEmpIds.length; bi += BATCH_SIZE) {
    const batchEmpIds = allEmpIds.slice(bi, bi + BATCH_SIZE);

    for (const empId of batchEmpIds) {
      // Mỗi nhân viên có "profile" ngẫu nhiên về thói quen đi làm
      const lateProb   = Math.random() * 0.25;  // 0-25% trễ
      const absentProb = Math.random() * 0.08;  // 0-8% vắng
      const leaveProb  = 0.03;                  // 3% nghỉ phép

      const records = workdays.map(day => {
        const rand = Math.random();
        const dateOnly = new Date(day);
        dateOnly.setHours(0, 0, 0, 0);

        if (rand < absentProb) {
          // Vắng mặt
          return { employeeId: empId, date: dateOnly, status: 'ABSENT' as AttendanceStatus, workMinutes: 0, lateMinutes: 0, overtimeMinutes: 0 };
        } else if (rand < absentProb + leaveProb) {
          // Nghỉ phép
          return { employeeId: empId, date: dateOnly, status: 'LEAVE' as AttendanceStatus, workMinutes: 0, lateMinutes: 0, overtimeMinutes: 0 };
        } else if (rand < absentProb + leaveProb + lateProb) {
          // Đi trễ
          const lateMin = randomInt(5, 90);
          const baseIn = new Date(dateOnly); baseIn.setHours(8, 15 + lateMin, 0, 0);
          const baseOut = new Date(dateOnly); baseOut.setHours(17, 30 + randomInt(-15, 30), 0, 0);
          const work = Math.max(0, (baseOut.getTime() - baseIn.getTime()) / 60000);
          return {
            employeeId: empId, date: dateOnly,
            checkInTime: baseIn, checkOutTime: baseOut,
            checkInConfidence: 0.75 + Math.random() * 0.2,
            checkOutConfidence: 0.75 + Math.random() * 0.2,
            status: 'LATE' as AttendanceStatus,
            workMinutes: Math.round(work), lateMinutes: lateMin, overtimeMinutes: 0,
          };
        } else {
          // Đúng giờ (hoặc sớm)
          const inMin = randomInt(-5, 10);
          const outMin = randomInt(-5, 60); // overtime
          const baseIn = new Date(dateOnly); baseIn.setHours(8, inMin, 0, 0);
          const baseOut = new Date(dateOnly); baseOut.setHours(17, 30 + outMin, 0, 0);
          const work = Math.max(0, (baseOut.getTime() - baseIn.getTime()) / 60000);
          return {
            employeeId: empId, date: dateOnly,
            checkInTime: baseIn, checkOutTime: baseOut,
            checkInConfidence: 0.82 + Math.random() * 0.17,
            checkOutConfidence: 0.82 + Math.random() * 0.17,
            status: 'PRESENT' as AttendanceStatus,
            workMinutes: Math.round(work),
            lateMinutes: 0,
            overtimeMinutes: outMin > 0 ? outMin : 0,
          };
        }
      });

      // Upsert từng record (skipDuplicates)
      await prisma.attendance.createMany({
        data: records.map(r => ({ ...r, date: r.date })),
        skipDuplicates: true,
      });
      attendanceCount += records.length;
    }

    process.stdout.write(`\r  ⏳ Attendance: ${Math.min(bi + BATCH_SIZE, allEmpIds.length)}/${allEmpIds.length} employees done`);
  }
  console.log(`\n  ✅ ~${attendanceCount} attendance records`);

  // ── 5. LEAVE REQUESTS ───────────────────────────────────────────────────────
  const leaveTypes: LeaveType[] = ['ANNUAL', 'SICK', 'UNPAID', 'BUSINESS', 'MATERNITY', 'OTHER'];
  const statuses: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  const adminId = empIds['ADMIN'];
  const hrId = empIds['HR001'];

  let leaveCount = 0;
  for (const empId of allEmpIds.slice(0, 80)) { // 80 nhân viên đầu
    const numLeaves = randomInt(0, 4);
    for (let i = 0; i < numLeaves; i++) {
      const monthsAgo = randomInt(1, 6);
      const start = new Date(today);
      start.setMonth(start.getMonth() - monthsAgo);
      start.setDate(randomInt(1, 20));
      start.setHours(0, 0, 0, 0);

      const days = randomInt(1, 5);
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);

      const status = randomItem(statuses);
      const approver = status !== 'PENDING' ? randomItem([adminId, hrId]) : null;

      try {
        await prisma.leaveRequest.create({
          data: {
            employeeId: empId,
            type: randomItem(leaveTypes),
            startDate: start,
            endDate: end,
            totalDays: days,
            reason: randomItem([
              'Việc cá nhân', 'Gia đình có việc', 'Khám bệnh định kỳ',
              'Công tác địa phương', 'Nghỉ dưỡng bệnh', 'Hội nghị khách hàng',
              'Đám cưới người thân', 'Học tập nâng cao', 'Sự kiện gia đình',
            ]),
            status,
            approvedById: approver,
            approvedAt: approver ? new Date() : null,
            rejectReason: status === 'REJECTED' ? randomItem([
              'Không đủ ngày phép còn lại',
              'Thời điểm bận dự án quan trọng',
              'Thiếu thông tin',
            ]) : null,
          },
        });
        leaveCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`  ✅ ${leaveCount} leave requests`);

  // ── 6. AUDIT LOGS ───────────────────────────────────────────────────────────
  const actions = ['LOGIN', 'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'APPROVE_LEAVE', 'REJECT_LEAVE', 'MANUAL_CHECKIN'];
  let auditCount = 0;
  for (let i = 0; i < 300; i++) {
    const daysAgo = randomInt(0, 180);
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - daysAgo);
    try {
      await prisma.auditLog.create({
        data: {
          userId: randomItem(allEmpIds.slice(0, 20)),
          action: randomItem(actions),
          entity: randomItem(['Employee', 'Attendance', 'LeaveRequest', null]),
          entityId: `fake-id-${randomInt(1000, 9999)}`,
          metadata: { timestamp: logDate.toISOString(), source: 'system' },
          ipAddress: `192.168.1.${randomInt(1, 254)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          createdAt: logDate,
        },
      });
      auditCount++;
    } catch { /* skip */ }
  }
  console.log(`  ✅ ${auditCount} audit logs`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin:         admin@company.com  / Admin@123456');
  console.log('👤 HR Manager:    hr@company.com     / Hr@123456');
  console.log('👤 IT Head:       head.it@company.com/ Head@123456');
  console.log('👤 Employee:      nv001@company.com  / Employee@123');
  console.log(`📊 Employees:     ${allEmpIds.length} total`);
  console.log(`📅 Attendance:    ~${attendanceCount} records (6 months)`);
  console.log(`📝 Leave:         ${leaveCount} requests`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
