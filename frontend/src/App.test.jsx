import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

describe('App Component', () => {
  it('renders without crashing', () => {
    // App uses routing, so we wrap it in a Router
    render(
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    );
    
    // Check if the main container is present, or a known text from App
    // We'll just check if the app renders
    expect(document.body).toBeDefined();
  });
});

