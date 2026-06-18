import React from 'react';

const CategoryIcons = () => {
  const categories = [
    { name: 'Presentation', icon: 'presentation-chart-line', color: 'bg-blue-500' },
    { name: 'Social Media', icon: 'photo', color: 'bg-pink-500' },
    { name: 'Video', icon: 'video-camera', color: 'bg-red-500' },
    { name: 'Print', icon: 'printer', color: 'bg-green-500' },
    { name: 'Docs', icon: 'document-text', color: 'bg-purple-500' },
    { name: 'Whiteboard', icon: 'pencil-square', color: 'bg-yellow-500' },
    { name: 'Website', icon: 'globe-alt', color: 'bg-indigo-500' },
    { name: 'Email', icon: 'envelope', color: 'bg-orange-500' },
  ];

  const getIcon = (iconName) => {
    const icons = {
      'presentation-chart-line': 'M3 3v18h18V3H3zm14 12H7v-2h10v2zm0-4H7V9h10v2zm0-4H7V5h10v2z',
      'photo': 'M4 3a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h16v10.414l-3.5-3.5a2 2 0 00-2.828 0L9.5 13.914 7.414 11.828a2 2 0 00-2.828 0L4 12.586V5zm2 12.586l3.5-3.5 2.086 2.086a2 2 0 002.828 0l4.086-4.086L20 15.586V17H6v-.414zM8 7a1 1 0 100-2 1 1 0 000 2z',
      'video-camera': 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zm-3 0H4v4h8v-4zM3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
      'printer': 'M6 9V2a1 1 0 011-1h6a1 1 0 011 1v7h2a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8a1 1 0 011-1h2zm2 0h4V3H8v6zm-2 2v6h8v-6H6z',
      'document-text': 'M4 3a1 1 0 011-1h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3zm3 4h8v2H7V7zm0 4h8v2H7v-2zm0 4h5v2H7v-2z',
      'pencil-square': 'M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-5-4zM7 21V7h8v1H8v12h9V9h1v11H7zM15 5v3h3l-3-3z',
      'globe-alt': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      'envelope': 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'
    };
    return icons[iconName] || icons['document-text'];
  };

  return (
    <section className="categories">
      <h2 className="section-title">Design Categories</h2>
      <div className="categories-grid">
        {categories.map((category, index) => (
          <button key={index} className="category-card">
            <div className={`category-icon ${category.color}`}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d={getIcon(category.icon)} />
              </svg>
            </div>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryIcons;