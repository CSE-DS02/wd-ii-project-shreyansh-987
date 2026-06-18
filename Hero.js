import React from 'react';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">What will you design today?</h1>
        <p className="hero-subtitle">
          Create stunning PDFs, presentations, and documents with AI assistance.
          Choose from templates or start from scratch.
        </p>
        <div className="hero-actions">
          <button className="btn-primary">Create New Project</button>
          <button className="btn-secondary">Browse Templates</button>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-mockup">
          <div className="mockup-screen">
            <div className="mockup-content">
              <div className="mockup-header"></div>
              <div className="mockup-body">
                <div className="mockup-element"></div>
                <div className="mockup-element small"></div>
                <div className="mockup-element"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;