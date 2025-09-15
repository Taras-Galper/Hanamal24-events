// test-env.js - Test environment variables
console.log('=== Environment Variables Test ===');
console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'SET' : 'NOT SET');
console.log('AIRTABLE_BASE:', process.env.AIRTABLE_BASE ? 'SET' : 'NOT SET');
console.log('BASE_URL:', process.env.BASE_URL || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

if (process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE) {
  console.log('✅ Airtable credentials are available');
} else {
  console.log('❌ Airtable credentials are missing');
}
