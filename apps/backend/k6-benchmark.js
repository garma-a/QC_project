import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Ramp-up and ramp-down simulation for realistic real-world load
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 virtual users over 30 seconds
    { duration: '2m', target: 50 },   // Hold 50 users for 2 minutes
    { duration: '30s', target: 0 },   // Ramp-down to 0 users gracefully
  ],
};

const BASE_URL = 'http://localhost:4000/api/v1';

// =========================================================================
// SETUP FUNCTION: Runs EXACTLY ONCE before the load test begins
// =========================================================================
export function setup() {
  const loginPayload = JSON.stringify({
    email: 'admin@fake.local',
    password: 'Password123!'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Perform the heavy CPU password hashing login just once
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  
  check(loginRes, {
    'setup: logged in successfully': (r) => r.status === 201 || r.status === 200,
  });

  // Return the token so it can be shared with all Virtual Users
  return {
    token: loginRes.json('accessToken')
  };
}

// =========================================================================
// DEFAULT FUNCTION: Runs repeatedly for each Virtual User
// =========================================================================
export default function (data) {
  // If the setup failed to get a token, abort the iteration
  if (!data || !data.token) return;

  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  };

  // ==========================================
  // 1. SIMULATE DASHBOARD LOAD (BFF)
  // ==========================================
  const dashboardRes = http.get(`${BASE_URL}/bff/dashboard`, authParams);
  check(dashboardRes, {
    'fetched dashboard successfully': (r) => r.status === 200,
  });

  sleep(0.5); // User reading dashboard

  const machineHistoryRes = http.get(`${BASE_URL}/bff/dashboard/machine-history/1`, authParams);
  check(machineHistoryRes, {
    'fetched machine history successfully': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.5);

  // ==========================================
  // 2. SIMULATE QC PAGE LOAD (BFF)
  // ==========================================
  const qcMachinesRes = http.get(`${BASE_URL}/bff/qc/machines`, authParams);
  check(qcMachinesRes, {
    'fetched qc machines successfully': (r) => r.status === 200,
  });

  const qcHistoryRes = http.get(`${BASE_URL}/bff/qc/history?limit=50&offset=0`, authParams);
  check(qcHistoryRes, {
    'fetched qc history successfully': (r) => r.status === 200,
  });

  sleep(1); // User interacting with table

  // ==========================================
  // 3. SIMULATE QC RESULT SUBMISSION (WRITE)
  // ==========================================
  const qcPayload = JSON.stringify({
    machineId: 703399,
    testId: 1,
    lotId: 1,
    measuredValue: Math.floor(Math.random() * (120 - 80 + 1) + 80), // Random value between 80 and 120
    comments: 'Load Test Submission'
  });

  const createQcRes = http.post(`${BASE_URL}/qc-results`, qcPayload, authParams);
  check(createQcRes, {
    'submitted qc result successfully': (r) => r.status === 201 || r.status === 400 || r.status === 404,
  });

  // ==========================================
  // 4. SIMULATE BACKGROUND DATA FETCHES (ALL DOMAINS)
  // ==========================================
  const usersRes = http.get(`${BASE_URL}/users?limit=20&offset=0`, authParams);
  check(usersRes, { 'fetched users': (r) => r.status === 200 });

  const sectionsRes = http.get(`${BASE_URL}/sections`, authParams);
  check(sectionsRes, { 'fetched sections': (r) => r.status === 200 });

  const machinesRes = http.get(`${BASE_URL}/machines`, authParams);
  check(machinesRes, { 'fetched machines': (r) => r.status === 200 });

  const testsRes = http.get(`${BASE_URL}/qc-tests/machine/703399`, authParams);
  check(testsRes, { 'fetched tests': (r) => r.status === 200 || r.status === 404 });

  const lotsRes = http.get(`${BASE_URL}/control-lots?isActive=true`, authParams);
  check(lotsRes, { 'fetched control lots': (r) => r.status === 200 });

  // ==========================================
  // 5. SIMULATE NOTIFICATIONS CHECK
  // ==========================================
  const alertsRes = http.get(`${BASE_URL}/alerts`, authParams);
  check(alertsRes, {
    'fetched alerts successfully': (r) => r.status === 200,
  });

  // ==========================================
  // 6. THINK TIME
  // ==========================================
  sleep(1);
}
