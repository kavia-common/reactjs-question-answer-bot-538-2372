import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header title', () => {
  render(<App />);
  // The header component uses role="banner" and contains the title text
  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /ReactJS Q&A Chatbot/i })).toBeInTheDocument();
});
