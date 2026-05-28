import { getMealContext } from './App';

describe('getMealContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns morning context between 5:00 and 10:59', () => {
    jest.setSystemTime(new Date('2023-01-01T08:00:00'));
    expect(getMealContext()).toEqual({
      label: 'Log Breakfast',
      emoji: '🍳',
      color: '#f59e0b',
      period: 'morning',
    });
  });

  it('returns afternoon context between 11:00 and 14:59', () => {
    jest.setSystemTime(new Date('2023-01-01T12:00:00'));
    expect(getMealContext()).toEqual({
      label: 'Log Lunch',
      emoji: '🍜',
      color: '#10b981',
      period: 'afternoon',
    });
  });

  it('returns evening context between 15:00 and 19:59', () => {
    jest.setSystemTime(new Date('2023-01-01T18:00:00'));
    expect(getMealContext()).toEqual({
      label: 'Log Dinner',
      emoji: '🍽️',
      color: '#6c63ff',
      period: 'evening',
    });
  });

  it('returns night context between 20:00 and 4:59 (late night)', () => {
    jest.setSystemTime(new Date('2023-01-01T22:00:00'));
    expect(getMealContext()).toEqual({
      label: 'Log Snack',
      emoji: '🌙',
      color: '#8b5cf6',
      period: 'night',
    });
  });

  it('returns night context between 20:00 and 4:59 (early morning)', () => {
    jest.setSystemTime(new Date('2023-01-01T02:00:00'));
    expect(getMealContext()).toEqual({
      label: 'Log Snack',
      emoji: '🌙',
      color: '#8b5cf6',
      period: 'night',
    });
  });
});
