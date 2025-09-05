import React, { useState, useEffect } from 'react';
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaVolumeUp,
  FaExpand,
  FaCompress,
  FaListUl,
  FaTimes,
  // Hint icons
  FaPause,
  FaWind,
  FaMusic,
  FaBold,
  FaHourglassHalf,
  FaSmile,
  FaLightbulb,
} from 'react-icons/fa';
import './ScriptViewer.css';

const ScriptViewer = ({ script, onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [isSectionsListOpen, setSectionsListOpen] = useState(false);

  // Page-only chrome hide: add/remove class on <body>
  useEffect(() => {
    document.body.classList.add('script-viewer-page');
    return () => {
      document.body.classList.remove('script-viewer-page');
    };
  }, []);

  const nextSlide = () => {
    if (currentSlide < script.sections.length - 1) {
      setSlideDirection('next');
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setSlideDirection('prev');
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const goToSlide = (index) => {
    setSlideDirection(index > currentSlide ? 'next' : 'prev');
    setCurrentSlide(index);
    setSectionsListOpen(false);
  };

  const toggleFullScreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element
        .requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch((err) => console.log(err?.message));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullScreen(false))
        .catch(() => setIsFullScreen(false));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
      if (e.key === 'Escape' && document.fullscreenElement) {
        toggleFullScreen();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide]);

  // Map instruction text to icon + class
  const renderHintNode = (instruction) => {
    const txt = instruction.trim();
    if (txt.includes('Pause')) {
      return (
        <span className="hint hint-pause">
          <FaPause /> {txt}
        </span>
      );
    }
    if (txt.includes('Breath')) {
      return (
        <span className="hint hint-breath">
          <FaWind /> {txt}
        </span>
      );
    }
    if (txt.includes('Pitch')) {
      return (
        <span className="hint hint-pitch">
          <FaMusic /> {txt}
        </span>
      );
    }
    if (txt.includes('ज़ोर') || txt.includes('तेज़')) {
      return (
        <span className="hint hint-emphasis">
          <FaBold /> {txt}
        </span>
      );
    }
    if (txt.includes('धीरे') || txt.includes('गहराई')) {
      return (
        <span className="hint hint-slow">
          <FaHourglassHalf /> {txt}
        </span>
      );
    }
    if (txt.includes('भाव')) {
      return (
        <span className="hint hint-emotion">
          <FaSmile /> {txt}
        </span>
      );
    }
    return (
      <span className="hint hint-general">
        <FaLightbulb /> {txt}
      </span>
    );
  };

  // Parse content into React nodes with hint icons
  const parseContentWithHints = (content) => {
    return content.split('\n').map((line, idx) => {
      if (!line.trim()) return <br key={`br-${idx}`} />;
      const parts = line.split(/(\([^)]+\))/g); // keep paren groups
      return (
        <p key={`p-${idx}`}>
          {parts.map((part, i) => {
            const isHint = /^\([^)]+\)$/.test(part);
            if (!isHint) return <span key={`t-${idx}-${i}`}>{part}</span>;
            const inner = part.slice(1, -1);
            return <React.Fragment key={`h-${idx}-${i}`}>{renderHintNode(inner)}</React.Fragment>;
          })}
        </p>
      );
    });
  };

  const currentSection = script.sections[currentSlide];

  const SectionsListComponent = () => (
    <div className="sections-list-panel" role="navigation" aria-label="Sections list">
      <div className="sections-list-header">
        <h4>Secciones del Guion</h4>
        <button
          className="mobile-only close-sections-btn control-btn"
          onClick={() => setSectionsListOpen(false)}
          aria-label="Close sections panel"
          title="Close"
        >
          <FaTimes />
        </button>
      </div>
      <ul className="sections-list">
        {script.sections.map((section, index) => (
          <li
            key={index}
            onClick={() => goToSlide(index)}
            className={`section-item ${currentSlide === index ? 'active' : ''}`}
            tabIndex={0}
            role="button"
            aria-current={currentSlide === index ? 'true' : 'false'}
            aria-label={`Go to ${section.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToSlide(index);
              }
            }}
          >
            <span className="section-item-time">{section.timeStamp}</span>
            <span className="section-item-title">{section.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`script-viewer-container ${isFullScreen ? 'fullscreen' : ''}`}>
      {/* Sidebar (Desktop) */}
      <aside className="viewer-sidebar" aria-label="Sidebar">
        <SectionsListComponent />
      </aside>

      {/* Main */}
      <main className="viewer-main">
        {/* Fixed Top Bar */}
        <header className="top-bar" role="banner">
          <button
            onClick={onBack}
            className="control-btn back-btn"
            aria-label="Back"
            title="Back"
          >
            <FaArrowLeft /> <span className="desktop-only">Atrás</span>
          </button>

          <div className="script-main-title" title={script.title} aria-live="polite">
            {script.title}
          </div>

          <div className="top-controls">
            <button
              onClick={() => setSectionsListOpen(true)}
              className="control-btn mobile-only"
              aria-label="Open sections"
              title="Sections"
            >
              <FaListUl />
            </button>
            <button
              onClick={toggleFullScreen}
              className="control-btn"
              aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullScreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="slide-content-area" role="region" aria-label="Slide content">
          <div className={`slide-wrapper slide-animation-${slideDirection}`}>
            <div className="slide-header">
              <span className="timestamp-badge">{currentSection.timeStamp}</span>
              <h1>{currentSection.title}</h1>
              <span className="mood-indicator">
                <FaVolumeUp /> {currentSection.mood}
              </span>
            </div>
            <div className="slide-text">{parseContentWithHints(currentSection.content)}</div>
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <footer className="bottom-bar" role="contentinfo" aria-label="Slide controls">
          <div className="progress-indicator" aria-live="polite">
            {currentSlide + 1} de {script.sections.length}
          </div>

          <div className="main-controls" role="group" aria-label="Navigation controls">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="nav-control-btn"
              aria-label="Previous section"
              title="Previous"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === script.sections.length - 1}
              className="nav-control-btn"
              aria-label="Next section"
              title="Next"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="placeholder" aria-hidden="true"></div>
        </footer>
      </main>

      {/* Sections modal (Mobile) */}
      <div
        className={`sections-modal-overlay ${isSectionsListOpen ? 'open' : ''}`}
        onClick={() => setSectionsListOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Sections"
      >
        <div className="sections-modal-content" onClick={(e) => e.stopPropagation()}>
          <SectionsListComponent />
        </div>
      </div>
    </div>
  );
};

export default ScriptViewer;
