import React from 'react';

const GlobalHeader = () => (
  <header className="site-header">
    <nav className="nav-bar">
      <a className="brand" href="#">BrandName</a>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <button className="cta-button">Get Started</button>
    </nav>
  </header>
);

export default GlobalHeader;
