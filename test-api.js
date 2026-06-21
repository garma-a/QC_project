async function run() {
  try {
    // First login
    const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@garma.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    
    // Now fetch qc-results
    const res = await fetch('http://localhost:4000/api/v1/qc-results?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
