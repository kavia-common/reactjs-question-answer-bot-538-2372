import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header title', () => {
  render(<App />);
  const title = screen.getByRole('banner');
  expect(title).toBeInTheDocument();
  expect(screen.getByText(/ReactJS Q&A Chatbot/i)).toBeInTheDocument();
});
