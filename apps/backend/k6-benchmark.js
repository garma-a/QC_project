import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  // Ramp-up and ramp-down simulation for realistic real-world load
  stages: [
    { duration: '5s', target: 20 },  // Ramp-up to 20 virtual users over 5 seconds
    { duration: '15s', target: 50 }, // Ramp-up to 50 users and hold for 15 seconds
    { duration: '5s', target: 0 },   // Ramp-down to 0 users gracefully
  ],
};

const BASE_URL = 'http://localhost:4000/api/v1';

// =========================================================================
// SETUP FUNCTION: Runs EXACTLY ONCE before the load test begins
// =========================================================================
export function setup() {
  const loginPayload = JSON.stringify({
    email: 'admin@lab.local',
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
  // 1. SIMULATE BROWSE (READ HEAVY)
  // ==========================================
  const getMachinesRes = http.get(`${BASE_URL}/machines`, authParams);
  check(getMachinesRes, {
    'fetched machines successfully': (r) => r.status === 200,
  });

  // Small delay to simulate user reading the screen
  sleep(0.5);

  // ==========================================
  // 2. SIMULATE RESOURCE CREATION (WRITE)
  // ==========================================
  const randStr = randomString(8);
  const userPayload = JSON.stringify({
    firstName: `K6_${randStr}`,
    lastName: 'LoadTest',
    email: `k6_${randStr}@lab.local`, // Guaranteed unique!
    password: 'Password123!',
    role: 'TECHNICIAN'
  });

  const createUserRes = http.post(`${BASE_URL}/users`, userPayload, authParams);
  check(createUserRes, {
    'created user successfully': (r) => r.status === 201,
  });

  const createdUser = createUserRes.json();
  const userId = createdUser ? createdUser.id : null;

  // ==========================================
  // 3. SIMULATE RESOURCE MODIFICATION (UPDATE)
  // ==========================================
  if (userId) {
    // Wait before editing
    sleep(0.5);

    const patchPayload = JSON.stringify({
      firstName: `K6_Updated_${randStr}`,
    });
    const patchUserRes = http.patch(`${BASE_URL}/users/${userId}`, patchPayload, authParams);
    check(patchUserRes, {
      'updated user successfully': (r) => r.status === 200,
    });

    // ==========================================
    // 4. SIMULATE RESOURCE CLEANUP (DELETE)
    // ==========================================
    const deleteRes = http.del(`${BASE_URL}/users/${userId}`, null, authParams);
    check(deleteRes, {
      'deleted user successfully': (r) => r.status === 200 || r.status === 204,
    });
  }

  // ==========================================
  // 5. THINK TIME
  // ==========================================
  sleep(1);
}
