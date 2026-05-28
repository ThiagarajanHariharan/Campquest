import { getMealContext } from './App';

describe('getMealContext', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const testCases = [
    { hour: 0, expected: { label: 'Log Snack', emoji: '🌙', color: '#8b5cf6', period: 'night' } },
    { hour: 4, expected: { label: 'Log Snack', emoji: '🌙', color: '#8b5cf6', period: 'night' } },
    { hour: 5, expected: { label: 'Log Breakfast', emoji: '🍳', color: '#f59e0b', period: 'morning' } },
    { hour: 10, expected: { label: 'Log Breakfast', emoji: '🍳', color: '#f59e0b', period: 'morning' } },
    { hour: 11, expected: { label: 'Log Lunch', emoji: '🍜', color: '#10b981', period: 'afternoon' } },
    { hour: 14, expected: { label: 'Log Lunch', emoji: '🍜', color: '#10b981', period: 'afternoon' } },
    { hour: 15, expected: { label: 'Log Dinner', emoji: '🍽️', color: '#6c63ff', period: 'evening' } },
    { hour: 19, expected: { label: 'Log Dinner', emoji: '🍽️', color: '#6c63ff', period: 'evening' } },
    { hour: 20, expected: { label: 'Log Snack', emoji: '🌙', color: '#8b5cf6', period: 'night' } },
    { hour: 23, expected: { label: 'Log Snack', emoji: '🌙', color: '#8b5cf6', period: 'night' } },
  ];

  testCases.forEach(({ hour, expected }) => {
    it(`should return correct context for hour ${hour}`, () => {
      const mockDate = new Date(2024, 1, 1, hour, 0, 0);
      jest.setSystemTime(mockDate);
      expect(getMealContext()).toEqual(expected);
    });
  });
});
