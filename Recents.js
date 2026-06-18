import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Recents = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentProjects();
  }, []);

  const fetchRecentProjects = async () => {
    try {
      const response = await api.getRecentProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to fetch recent projects:', error);
      // Fallback to mock data
      setProjects([
        {
          id: 1,
          title: 'Startup Pitch Deck',
          type: 'Presentation',
          lastAccessed: new Date().toISOString(),
          thumbnail: null
        },
        {
          id: 2,
          title: 'Business Report Q4',
          type: 'Document',
          lastAccessed: new Date(Date.now() - 86400000).toISOString(),
          thumbnail: null
        },
        {
          id: 3,
          title: 'Social Media Kit',
          type: 'Design',
          lastAccessed: new Date(Date.now() - 172800000).toISOString(),
          thumbnail: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <section className="recents">
        <h2 className="section-title">Recent Projects</h2>
        <div className="loading-skeleton">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="recents">
      <div className="recents-header">
        <h2 className="section-title">Recent Projects</h2>
        <button className="view-all-btn">View All</button>
      </div>

      {projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id || project._id} className="project-card">
              <div className="project-thumbnail">
                <div className="thumbnail-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className="project-type">{project.type}</div>
              </div>
              <div className="project-info">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-date">{formatDate(project.lastAccessed || project.updatedAt)}</p>
              </div>
              <button className="project-menu">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p>No recent projects yet. Create your first design!</p>
        </div>
      )}
    </section>
  );
};

export default Recents;