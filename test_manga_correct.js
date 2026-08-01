const url = 'https://mdpsrbmfzaosuvhamvbs.supabase.co/rest/v1/products?select=*&name=ilike.*manga*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHNyYm1memFvc3V2aGFtdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTkxNjgsImV4cCI6MjA4NDkzNTE2OH0.FieQkWGUZ-iRx6XHqk8vNaa9NnNuPtkSFn6f7W5vO_U';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
