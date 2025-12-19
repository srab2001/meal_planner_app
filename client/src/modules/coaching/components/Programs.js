import React, { useState } from 'react';
import auditLogger from '../../../shared/services/AuditLogger';
import './Programs.css';

/**
 * Programs - Coaching programs with progress tracking
 * 
 * Features:
 * - Browse available programs
 * - Enroll in programs
 * - Track module completion
 * - Progress visualization
 */
export default function Programs({ programs, onUpdatePrograms }) {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'enrolled', 'completed'

  // Filter programs based on active tab
  const filteredPrograms = programs.filter(program => {
    if (activeTab === 'enrolled') return program.enrolled && program.progress < 100;
    if (activeTab === 'completed') return program.progress === 100;
    return true;
  });

  // Enroll in a program
  const handleEnroll = (programId) => {
    const program = programs.find(p => p.id === programId);
    const updatedPrograms = programs.map(p => 
      p.id === programId ? { ...p, enrolled: true, startedAt: new Date().toISOString() } : p
    );
    
    // Log program enrollment
    auditLogger.log({
      category: auditLogger.CATEGORIES.PROGRAM,
      action: 'program_enrolled',
      level: auditLogger.LEVELS.INFO,
      details: { programId, name: program?.name }
    });
    
    onUpdatePrograms(updatedPrograms);
  };

  // Unenroll from a program
  const handleUnenroll = (programId) => {
    const program = programs.find(p => p.id === programId);
    if (window.confirm('Are you sure you want to leave this program? Your progress will be lost.')) {
      const updatedPrograms = programs.map(p => 
        p.id === programId ? { 
          ...p, 
          enrolled: false, 
          progress: 0,
          modules: p.modules.map(m => ({ ...m, completed: false }))
        } : p
      );
      
      // Log program unenrollment
      auditLogger.log({
        category: auditLogger.CATEGORIES.PROGRAM,
        action: 'program_unenrolled',
        level: auditLogger.LEVELS.WARN,
        details: { programId, name: program?.name, previousProgress: program?.progress }
      });
      
      onUpdatePrograms(updatedPrograms);
      setSelectedProgram(null);
    }
  };

  // Complete a module
  const handleCompleteModule = (programId, moduleId) => {
    const program = programs.find(p => p.id === programId);
    const module = program?.modules.find(m => m.id === moduleId);
    
    const updatedPrograms = programs.map(p => {
      if (p.id === programId) {
        const updatedModules = p.modules.map(m =>
          m.id === moduleId ? { ...m, completed: true, completedAt: new Date().toISOString() } : m
        );
        const completedCount = updatedModules.filter(m => m.completed).length;
        const progress = Math.round((completedCount / updatedModules.length) * 100);
        
        // Log program completion if 100%
        if (progress === 100 && p.progress < 100) {
          auditLogger.log({
            category: auditLogger.CATEGORIES.PROGRAM,
            action: 'program_completed',
            level: auditLogger.LEVELS.INFO,
            details: { programId, name: p.name }
          });
        }
        
        return { ...p, modules: updatedModules, progress };
      }
      return p;
    });
    
    // Log module completion
    auditLogger.log({
      category: auditLogger.CATEGORIES.PROGRAM,
      action: 'module_completed',
      level: auditLogger.LEVELS.INFO,
      details: { programId, moduleId, moduleName: module?.title, programName: program?.name }
    });
    
    onUpdatePrograms(updatedPrograms);
    
    // Update selected program view
    if (selectedProgram) {
      setSelectedProgram(updatedPrograms.find(p => p.id === selectedProgram.id));
    }
  };

  // Reset module completion
  const handleResetModule = (programId, moduleId) => {
    const program = programs.find(p => p.id === programId);
    const module = program?.modules.find(m => m.id === moduleId);
    
    const updatedPrograms = programs.map(p => {
      if (p.id === programId) {
        const updatedModules = p.modules.map(m =>
          m.id === moduleId ? { ...m, completed: false, completedAt: null } : m
        );
        const completedCount = updatedModules.filter(m => m.completed).length;
        const progress = Math.round((completedCount / updatedModules.length) * 100);
        return { ...p, modules: updatedModules, progress };
      }
      return p;
    });
    
    // Log module reset
    auditLogger.log({
      category: auditLogger.CATEGORIES.PROGRAM,
      action: 'module_reset',
      level: auditLogger.LEVELS.DEBUG,
      details: { programId, moduleId, moduleName: module?.title }
    });
    
    onUpdatePrograms(updatedPrograms);
    
    // Update selected program view
    if (selectedProgram) {
      setSelectedProgram(updatedPrograms.find(p => p.id === selectedProgram.id));
    }
  };

  // View program details
  const handleViewProgram = (program) => {
    setSelectedProgram(program);
  };

  // Back to program list
  const handleBack = () => {
    setSelectedProgram(null);
  };

  // Render program details view
  if (selectedProgram) {
    const program = programs.find(p => p.id === selectedProgram.id) || selectedProgram;
    
    return (
      <div className="programs-detail">
        <button className="back-btn" onClick={handleBack}>
          ← Back to Programs
        </button>

        <div className="program-header" style={{ '--program-color': program.color }}>
          <span className="program-icon-large">{program.icon}</span>
          <div className="program-info">
            <h2>{program.name}</h2>
            <p>{program.description}</p>
            <span className="program-duration">📅 {program.duration}</span>
          </div>
        </div>

        <div className="program-progress-section">
          <div className="progress-header">
            <span>Progress</span>
            <span className="progress-percent">{program.progress}%</span>
          </div>
          <div className="progress-bar-large">
            <div 
              className="progress-fill" 
              style={{ width: `${program.progress}%`, backgroundColor: program.color }}
            />
          </div>
          {program.progress === 100 && (
            <div className="completion-badge">
              🎉 Congratulations! You've completed this program!
            </div>
          )}
        </div>

        <div className="modules-section">
          <h3>Modules</h3>
          <div className="modules-list">
            {program.modules.map((module, index) => (
              <div 
                key={module.id} 
                className={`module-item ${module.completed ? 'completed' : ''}`}
              >
                <div className="module-number">{index + 1}</div>
                <div className="module-content">
                  <h4>{module.title}</h4>
                  {module.completed && module.completedAt && (
                    <span className="completed-date">
                      Completed {new Date(module.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {program.enrolled && (
                  <button 
                    className={`module-action ${module.completed ? 'reset' : 'complete'}`}
                    onClick={() => module.completed 
                      ? handleResetModule(program.id, module.id)
                      : handleCompleteModule(program.id, module.id)
                    }
                  >
                    {module.completed ? '↩️ Redo' : '✓ Complete'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="program-actions">
          {!program.enrolled ? (
            <button 
              className="enroll-btn primary"
              onClick={() => handleEnroll(program.id)}
            >
              Start Program
            </button>
          ) : (
            <button 
              className="unenroll-btn"
              onClick={() => handleUnenroll(program.id)}
            >
              Leave Program
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render program list view
  return (
    <div className="programs">
      <div className="programs-header">
        <h2>Coaching Programs</h2>
        <p>Structured programs to help you reach your health goals</p>
      </div>

      {/* Tabs */}
      <div className="programs-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Programs
        </button>
        <button 
          className={`tab ${activeTab === 'enrolled' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrolled')}
        >
          My Programs
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      {/* Programs Grid */}
      <div className="programs-grid">
        {filteredPrograms.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h3>No programs found</h3>
            <p>
              {activeTab === 'enrolled' 
                ? "You haven't enrolled in any programs yet." 
                : activeTab === 'completed'
                ? "You haven't completed any programs yet."
                : "No programs available."}
            </p>
            {activeTab !== 'all' && (
              <button onClick={() => setActiveTab('all')}>
                Browse All Programs
              </button>
            )}
          </div>
        ) : (
          filteredPrograms.map(program => (
            <div 
              key={program.id}
              className={`program-card ${program.enrolled ? 'enrolled' : ''}`}
              style={{ '--program-color': program.color }}
              onClick={() => handleViewProgram(program)}
            >
              <div className="program-card-header">
                <span className="program-icon">{program.icon}</span>
                {program.enrolled && (
                  <span className="enrolled-badge">Enrolled</span>
                )}
              </div>
              <h3>{program.name}</h3>
              <p>{program.description}</p>
              <div className="program-meta">
                <span className="duration">📅 {program.duration}</span>
                <span className="modules">📖 {program.modules.length} modules</span>
              </div>
              {program.enrolled && (
                <div className="program-progress">
                  <div className="progress-bar-small">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${program.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{program.progress}%</span>
                </div>
              )}
              <button className="view-btn">
                {program.enrolled ? 'Continue' : 'Learn More'} →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
