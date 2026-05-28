import { api } from './App';

describe('api helper', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should make a request with default headers and return JSON', async () => {
    const mockData = { success: true };
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockData)
    });

    const result = await api('http://example.com/api');

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/api', {
      headers: { 'Content-Type': 'application/json' }
    });
    expect(result).toEqual(mockData);
  });

  it('should merge custom options and headers', async () => {
    const mockData = { id: 1 };
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockData)
    });

    const opts = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
        'X-Custom': '123'
      },
      body: JSON.stringify({ name: 'test' })
    };

    const result = await api('http://example.com/data', opts);

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'X-Custom': '123'
      },
      body: JSON.stringify({ name: 'test' })
    });
    expect(result).toEqual(mockData);
  });

  it('should return service unreachable error on fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await api('http://example.com/fail');

    expect(result).toEqual({ error: 'Service unreachable' });
  });

  it('should return service unreachable error on JSON parse failure', async () => {
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON'))
    });

    const result = await api('http://example.com/bad-json');

    expect(result).toEqual({ error: 'Service unreachable' });
  });
});
