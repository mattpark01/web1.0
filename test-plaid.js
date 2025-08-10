// Test Plaid API endpoint
async function testPlaidLinkToken() {
  try {
    const response = await fetch('http://localhost:3000/api/plaid/create-link-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'test-user' }),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (data.link_token) {
      console.log('✅ Link token created successfully!');
    } else {
      console.log('❌ Failed to create link token');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testPlaidLinkToken();