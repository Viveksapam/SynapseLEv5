import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

describe('App Component', () => {
  it('renders without crashing', () => {
    
    render(
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    );
    
    
    
    expect(document.body).toBeDefined();
  });
});

