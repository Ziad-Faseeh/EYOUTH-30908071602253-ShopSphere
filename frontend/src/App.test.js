import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('Frontend Component Tests', () => {

  it('renders login form by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('switches to Sign Up mode when clicking the link', () => {
    render(<App />);
    const signUpLink = screen.getByText(/Sign Up/i, { selector: 'span' });
    fireEvent.click(signUpLink);
    
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  });

  it('allows user to type in fields', () => {
    render(<App />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'ziad@deci.com' } });
    fireEvent.change(passwordInput, { target: { value: '0000' } });

    expect(emailInput.value).toBe('ziad@deci.com');
    expect(passwordInput.value).toBe('0000');
  });

});