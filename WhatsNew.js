import React from 'react';

const WhatsNew = () => {
  const features = [
    {
      title: 'AI-Powered Design Assistant',
      description: 'Generate stunning visuals and layouts with our advanced AI technology.',
      image: 'ai-design.jpg',
      gradient: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Smart Templates',
      description: 'Choose from hundreds of professionally designed templates for any occasion.',
      image: 'templates.jpg',
      gradient: 'from-blue-400 to-indigo-600'
    },
    {
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time, anywhere in the world.',
      image: 'collaboration.jpg',
      gradient: 'from-green-400 to-teal-600'
    },
    {
      title: 'Advanced Export Options',
      description: 'Export your designs in multiple formats including PDF, PNG, and SVG.',
      image: 'export.jpg',
      gradient: 'from-orange-400 to-red-600'
    }
  ];

  return (
    <section className="whats-new">
      <h2 className="section-title">What's New</h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className={`feature-image bg-gradient-to-br ${feature.gradient}`}>
              <div className="feature-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zM4 9h16a1 1 0 010 2H4a1 1 0 010-2zM4 13h16a1 1 0 010 2H4a1 1 0 010-2zM4 17h16a1 1 0 010 2H4a1 1 0 010-2z"/>
                </svg>
              </div>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <button className="feature-btn">Learn More</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatsNew;