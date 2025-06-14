const axios = require('axios');

async function registerUser() {
    try {
        const response = await axios.post('http://localhost:5000/api/register', {
            username: 'admin1',
            password: 'securepassword'
        });
        console.log('User registered:', response.data);
    } catch (error) {
        console.error('Registration error:', error.response.data);
    }
}

registerUser();