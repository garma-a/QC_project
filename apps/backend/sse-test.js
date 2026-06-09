// using native fetch

async function testSse() {
  console.log('Connecting to SSE...');
  // First login to get a token
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lab.local', password: 'Password123!' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }
  
  const { accessToken } = await loginRes.json();
  
  const sseRes = await fetch('http://localhost:4000/api/v1/machines/stream', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'text/event-stream'
    }
  });

  console.log('SSE status:', sseRes.status);
  
  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();
  
  // Read stream in background
  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('SSE chunk received:', decoder.decode(value));
    }
  })();

  // Now trigger a machine creation
  setTimeout(async () => {
    console.log('Creating a machine...');
    const createRes = await fetch('http://localhost:4000/api/v1/machines', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Machine SSE',
        hospCode: 'HOSP1',
        sectionId: 1
      })
    });
    console.log('Create machine status:', createRes.status);
    console.log(await createRes.text());
  }, 2000);
}

testSse().catch(console.error);
