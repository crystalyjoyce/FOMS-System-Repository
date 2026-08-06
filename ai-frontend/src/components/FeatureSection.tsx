import React from 'react';

const FeatureSection = () => (
  <section className="features" id="features">
    <h2>Features</h2>
    <div className="feature-grid">
      <article className="feature-card">
        <h3>Responsive Layout</h3>
        <p>Flexible and mobile-first design structure ready for any screen size.</p>
      </article>
      <article className="feature-card">
        <h3>React 19</h3>
        <p>Modern React app using the latest stable React 19 APIs.</p>
      </article>
      <article className="feature-card">
        <h3>Vanilla CSS</h3>
        <p>Clean stylesheet with no CSS frameworks or preprocessors.</p>
      </article>
    </div>
  </section>
);

export default FeatureSection;
