const request = require('supertest');

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { app, pool } = require('./index');

describe('Rewards Store Service Tests - POST /api/rewards/claim', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if user_id or merchandise_id is missing', async () => {
    const res = await request(app).post('/api/rewards/claim').send({ quantity: 1 });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toMatch(/Missing required fields/);
    expect(mockClient.query).not.toHaveBeenCalled();
  });

  it('should return 400 if quantity is less than 1', async () => {
    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 1,
      merchandise_id: 1,
      quantity: 0
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Quantity must be at least 1');
  });

  it('should return 404 if merchandise is not found or unavailable', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // SELECT merchandise FOR UPDATE

    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 1,
      merchandise_id: 99,
      quantity: 1
    });

    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('Merchandise not found or unavailable');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should return 400 if insufficient stock', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Shirt', cost_in_points: 100, stock_quantity: 0 }] }); // SELECT merchandise FOR UPDATE

    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 1,
      merchandise_id: 1,
      quantity: 1
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Insufficient stock');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should return 404 if user not found', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Shirt', cost_in_points: 100, stock_quantity: 10 }] }) // SELECT merchandise FOR UPDATE
      .mockResolvedValueOnce({ rows: [] }); // SELECT users FOR UPDATE

    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 99,
      merchandise_id: 1,
      quantity: 1
    });

    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('User not found');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should return 400 if user has insufficient quest points', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Shirt', cost_in_points: 100, stock_quantity: 10 }] }) // SELECT merchandise
      .mockResolvedValueOnce({ rows: [{ id: 1, username: 'test', quest_points: 50 }] }); // SELECT user

    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 1,
      merchandise_id: 1,
      quantity: 1
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Insufficient quest points');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should successfully claim merchandise', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Shirt', cost_in_points: 100, stock_quantity: 10 }] }) // SELECT merchandise
      .mockResolvedValueOnce({ rows: [{ id: 1, username: 'test', quest_points: 150 }] }) // SELECT user
      .mockResolvedValueOnce({ rows: [{ id: 1, username: 'test', quest_points: 50 }] }) // UPDATE user
      .mockResolvedValueOnce() // UPDATE merchandise stock
      .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, merchandise_id: 1, quantity: 1, points_spent: 100 }] }) // INSERT transaction
      .mockResolvedValueOnce(); // COMMIT

    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 1,
      merchandise_id: 1,
      quantity: 1
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toMatch(/Successfully claimed/);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should return 500 and rollback on database error', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app).post('/api/rewards/claim').send({
      user_id: 1,
      merchandise_id: 1,
      quantity: 1
    });

    expect(res.statusCode).toEqual(500);
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
