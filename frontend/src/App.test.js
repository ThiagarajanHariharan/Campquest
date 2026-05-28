import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock the getItem method to handle testing specific scenarios
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders login screen when no user is authenticated', () => {
    render(<App />);
    const loginTitle = screen.getByText(/CampusQuest Go/i);
    expect(loginTitle).toBeInTheDocument();
    const subTitle = screen.getByText(/Your campus fitness companion/i);
    expect(subTitle).toBeInTheDocument();
  });

  it('renders StudentApp when a student user is authenticated', () => {
    const studentUser = { id: 1, name: 'Alex', role: 'student' };
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'cq_user') return JSON.stringify(studentUser);
      return null;
    });

    render(<App />);
    const greeting = screen.getByText(/Greetings, Alex!/i);
    expect(greeting).toBeInTheDocument();
    const dashboardTab = screen.getByRole('button', { name: /📊 Dashboard/i });
    expect(dashboardTab).toBeInTheDocument();
  });

  it('renders StallOwnerApp when a stall owner is authenticated', () => {
    const ownerUser = { id: 4, name: 'Mary', role: 'stall_owner' };
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'cq_user') return JSON.stringify(ownerUser);
      return null;
    });

    render(<App />);
    const ownerGreeting = screen.getByText(/Welcome, Mary!/i);
    expect(ownerGreeting).toBeInTheDocument();
    const stallDashboardTitle = screen.getByRole('heading', { name: /Stall Dashboard/i });
    expect(stallDashboardTitle).toBeInTheDocument();
  });
});
