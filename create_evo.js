

const url = 'http://localhost:8080/instance/create';
const apiKey = '8934E33F0B88-4A11-BB3B-1FFBBFF0AE50'; // Global API Key

const body = {
    instanceName: "GMZ PERFORMACE ATENDIMENTO",
    token: "8934E33F0B88-4A11-BB3B-1FFBBFF0AE50",
    qrcode: true
};

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
    },
    body: JSON.stringify(body)
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
