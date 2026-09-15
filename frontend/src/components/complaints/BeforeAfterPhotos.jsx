import React, { useState } from 'react';
import { Maximize2, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

const BeforeAfterPhotos = ({ issuePhoto, resolutionPhoto }) => {
  const [activeZoomUrl, setActiveZoomUrl] = useState(null);

  const getFullUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL || ''}${path}`;
  };

  const beforeUrl = getFullUrl(issuePhoto);
  const afterUrl = getFullUrl(resolutionPhoto);

  return (
    <div className="before-after-container">
      <h3 className="section-subtitle">Visual Proof & Inspection (Before vs After)</h3>

      <div className="photos-comparison-grid">
        {/* BEFORE PHOTO CARD */}
        <div className="photo-compare-card before">
          <div className="photo-compare-header">
            <span className="badge-photo-type before">BEFORE REPAIR</span>
            <span className="photo-subtitle">Original Reported Issue</span>
          </div>

          {beforeUrl ? (
            <div className="photo-wrapper" onClick={() => setActiveZoomUrl(beforeUrl)}>
              <img src={beforeUrl} alt="Before Repair Evidence" className="compare-img" />
              <div className="zoom-hover-overlay">
                <Maximize2 size={16} />
                <span>Enlarge Before Image</span>
              </div>
            </div>
          ) : (
            <div className="no-photo-box">
              <ImageIcon size={28} opacity={0.3} />
              <span>No initial issue photo attached</span>
            </div>
          )}
        </div>

        {/* AFTER PHOTO CARD */}
        <div className="photo-compare-card after">
          <div className="photo-compare-header">
            <span className="badge-photo-type after">AFTER REPAIR</span>
            <span className="photo-subtitle">Resolution Evidence</span>
          </div>

          {afterUrl ? (
            <div className="photo-wrapper" onClick={() => setActiveZoomUrl(afterUrl)}>
              <img src={afterUrl} alt="After Repair Evidence" className="compare-img" />
              <div className="zoom-hover-overlay">
                <Maximize2 size={16} />
                <span>Enlarge After Image</span>
              </div>
            </div>
          ) : (
            <div className="no-photo-box">
              <ImageIcon size={28} opacity={0.3} />
              <span>No after-repair photo attached</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeZoomUrl && (
        <div className="image-lightbox-modal" onClick={() => setActiveZoomUrl(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveZoomUrl(null)} className="lightbox-close-btn">
              <X size={20} />
            </button>
            <img src={activeZoomUrl} alt="Enlarged photo preview" className="lightbox-full-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BeforeAfterPhotos;
