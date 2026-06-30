import React from 'react';
import { GlobalHeader, HomeHero, FeatureSection, AboutSection, GlobalFooter } from './components';

function App() {
  return (
    <div className="app-shell">
      <GlobalHeader />
      <main>
        <HomeHero />
        <FeatureSection />
        <AboutSection />
      </main>
      <GlobalFooter />
    </div>
  );
}

export default App;
