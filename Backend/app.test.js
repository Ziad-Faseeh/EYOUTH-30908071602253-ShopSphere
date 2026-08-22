const request = require('supertest');
const app = require('./app');

describe('Backend API Integration Tests', () => {
  
  it('POST /api/auth/login - Should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ziad@deci.com',
        password: '0000'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBe('fake-jwt-token');
  });

  it('POST /api/auth/login - Should fail with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@user.com',
        password: '123'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('GET /api/products - Should fetch all products successfully', async () => {
    const res = await request(app).get('/api/products');
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('title');
  });

});