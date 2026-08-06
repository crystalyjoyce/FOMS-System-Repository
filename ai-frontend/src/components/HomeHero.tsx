import React from 'react';

const HomeHero = () => (
  <section className="hero" id="home">
    <div className="hero-copy">
      <h1>React 19 Frontend Interface</h1>
      <p>Built with Vite, TypeScript, and vanilla CSS for a lightweight frontend experience.</p>
      <div className="hero-actions">
        <a className="primary-button" href="#features">Explore</a>
        <a className="secondary-button" href="#contact">Contact</a>
      </div>
    </div>
    <div className="hero-visual">
      <div className="visual-card">Interface preview</div>
    </div>
  </section>
);

export default HomeHero;
