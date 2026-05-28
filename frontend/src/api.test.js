import { api } from './App';

describe('api helper', () => {
  beforeEach(() => {
    // Clear mock before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call fetch with default options and return JSON', async () => {
    const mockData = { success: true };
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const result = await api('https://example.com/api');

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(mockData);
  });

  it('should merge custom options and override default headers if needed', async () => {
    const mockData = { custom: 'data' };
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const customOpts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer token',
      },
      body: 'foo=bar',
    };

    const result = await api('https://example.com/api', customOpts);

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer token',
      },
      body: 'foo=bar',
    });
    expect(result).toEqual(mockData);
  });

  it('should return service unreachable error on fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await api('https://example.com/api');

    expect(result).toEqual({ error: 'Service unreachable' });
  });

  it('should return service unreachable error on JSON parse failure', async () => {
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockRejectedValueOnce(new Error('Syntax error')),
    });

    const result = await api('https://example.com/api');

    expect(result).toEqual({ error: 'Service unreachable' });
  });
});
