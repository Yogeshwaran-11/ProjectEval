import React from 'react';
import { ExternalLink, X, Presentation, Globe } from 'lucide-react';
import { GithubIcon } from './Icons';

export const MediaModal = ({ isOpen, onClose, title, url, type = 'link' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'github':
        return <GithubIcon size={20} color="#3730A3" />;
      case 'ppt':
        return <Presentation size={20} color="#7C3AED" />;
      case 'demo':
      default:
        return <Globe size={20} color="#166534" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {getIcon()}
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Verified Deliverable Link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.3rem 0.5rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="card-body">
          <div style={{ background: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Target URL
            </span>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-primary)', wordBreak: 'break-all', marginTop: '0.35rem' }}>
              {url || 'No URL specified by team'}
            </p>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Faculty juries and evaluators can launch this project artifact directly in a secure new browser tab for live testing and code inspection.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={onClose}
              >
                Launch Artifact <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
