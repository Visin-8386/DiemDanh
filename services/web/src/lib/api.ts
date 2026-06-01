import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
          localStorage.setItem('access_token', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const employeeApi = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  stats: () => api.get('/users/stats'),
};

export const attendanceApi = {
  checkIn: (photo: Blob) => {
    const form = new FormData();
    form.append('file', photo, 'capture.jpg');
    return api.post('/attendance/checkin', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  checkOut: (photo: Blob) => {
    const form = new FormData();
    form.append('file', photo, 'capture.jpg');
    return api.post('/attendance/checkout', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  today: () => api.get('/attendance/today'),
  my: (params?: any) => api.get('/attendance/my', { params }),
  all: (params?: any) => api.get('/attendance', { params }),
  update: (id: string, data: any) => api.patch(`/attendance/${id}`, data),
};

export const faceApi = {
  register: (employeeId: string, files: Blob[]) => {
    const form = new FormData();
    files.forEach((f, i) => form.append('files', f, `photo${i}.jpg`));
    return api.post(`/face/register/${employeeId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  status: (employeeId: string) => api.get(`/face/status/${employeeId}`),
  delete: (employeeId: string) => api.delete(`/face/${employeeId}`),
};

export const leaveApi = {
  create: (data: any) => api.post('/leave', data),
  my: () => api.get('/leave/my'),
  all: (params?: any) => api.get('/leave', { params }),
  approve: (id: string) => api.patch(`/leave/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/leave/${id}/reject`, { reason }),
  cancel: (id: string) => api.delete(`/leave/${id}`),
};

export const reportApi = {
  dashboard: () => api.get('/reports/dashboard'),
  monthly: (month: string, deptId?: string) =>
    api.get('/reports/monthly', { params: { month, departmentId: deptId } }),
  exportExcel: (month: string, deptId?: string) =>
    api.get('/reports/export/excel', { params: { month, departmentId: deptId }, responseType: 'blob' }),
};

export const departmentApi = {
  list: () => api.get('/departments'),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const shiftApi = {
  list: () => api.get('/shifts'),
  create: (data: any) => api.post('/shifts', data),
};
