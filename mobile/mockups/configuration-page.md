```jsx
import React, { useState } from 'react';

const WorkoutTracker = () => {
  const [exercises] = useState([
    {
      name: "Push-up",
      sets: [
        { reps: '', weight: '', rir: '', completed: false, techniques: { rp: false, ds: false, p: false } },
        { reps: '', weight: '', rir: '', completed: false, techniques: { rp: false, ds: false, p: false } },
        { reps: '', weight: '', rir: '', completed: false, techniques: { rp: false, ds: false, p: false } }
      ]
    },
    {
      name: "Bench Press",
      sets: [
        { reps: '', weight: '', rir: '', completed: false, techniques: { rp: false, ds: false, p: false } },
        { reps: '', weight: '', rir: '', completed: false, techniques: { rp: false, ds: false, p: false } },
        { reps: '', weight: '', rir: '', completed: false, techniques: { rp: false, ds: false, p: false } }
      ]
    }
  ]);

  const [exerciseSets, setExerciseSets] = useState(
    exercises.reduce((acc, exercise, exerciseIndex) => {
      acc[exerciseIndex] = exercise.sets;
      return acc;
    }, {})
  );

  // Technique data state
  const [techniqueData, setTechniqueData] = useState({});

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseIndex]: prev[exerciseIndex].map((set, idx) => 
        idx === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const updateTechnique = (exerciseIndex, setIndex, technique) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseIndex]: prev[exerciseIndex].map((set, idx) => 
        idx === setIndex 
          ? { ...set, techniques: { ...set.techniques, [technique]: !set.techniques[technique] } }
          : set
      )
    }));

    // Initialize technique data when activating
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    if (!exerciseSets[exerciseIndex][setIndex].techniques[technique]) {
      setTechniqueData(prev => ({
        ...prev,
        [key]: technique === 'rp' 
          ? { series: [{ reps: '', restTime: 15 }] }
          : technique === 'ds'
          ? { weights: [{ weight: '', reps: '' }] }
          : { partialReps: 5 }
      }));
    }
  };

  const incrementValue = (exerciseIndex, setIndex, field) => {
    const currentValue = parseInt(exerciseSets[exerciseIndex][setIndex][field]) || 0;
    updateSet(exerciseIndex, setIndex, field, (currentValue + 1).toString());
  };

  const decrementValue = (exerciseIndex, setIndex, field) => {
    const currentValue = parseInt(exerciseSets[exerciseIndex][setIndex][field]) || 0;
    const newValue = Math.max(0, currentValue - 1);
    updateSet(exerciseIndex, setIndex, field, newValue.toString());
  };

  const updateTechniqueData = (exerciseIndex, setIndex, technique, field, value, subIndex = 0) => {
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    setTechniqueData(prev => {
      const current = prev[key] || {};
      
      if (technique === 'rp') {
        const newSeries = [...(current.series || [{ reps: '', restTime: 15 }])];
        newSeries[subIndex] = { ...newSeries[subIndex], [field]: value };
        return { ...prev, [key]: { ...current, series: newSeries } };
      } else if (technique === 'ds') {
        const newWeights = [...(current.weights || [{ weight: '' }])];
        newWeights[subIndex] = { ...newWeights[subIndex], [field]: value };
        return { ...prev, [key]: { ...current, weights: newWeights } };
      } else {
        return { ...prev, [key]: { ...current, [field]: value } };
      }
    });
  };

  const addTechniqueSeries = (exerciseIndex, setIndex, technique) => {
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    setTechniqueData(prev => {
      const current = prev[key] || {};
      
      if (technique === 'rp') {
        return {
          ...prev,
          [key]: {
            ...current,
            series: [...(current.series || []), { reps: '', restTime: 15 }]
          }
        };
      } else if (technique === 'ds') {
        return {
          ...prev,
          [key]: {
            ...current,
            weights: [...(current.weights || []), { weight: '', reps: '' }]
          }
        };
      }
      return prev;
    });
  };

  const removeTechniqueSeries = (exerciseIndex, setIndex, technique, subIndex) => {
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    setTechniqueData(prev => {
      const current = prev[key] || {};
      
      if (technique === 'rp' && current.series && current.series.length > 1) {
        return {
          ...prev,
          [key]: {
            ...current,
            series: current.series.filter((_, idx) => idx !== subIndex)
          }
        };
      } else if (technique === 'ds' && current.weights && current.weights.length > 1) {
        return {
          ...prev,
          [key]: {
            ...current,
            weights: current.weights.filter((_, idx) => idx !== subIndex)
          }
        };
      }
      return prev;
    });
  };

  const incrementTechniqueValue = (exerciseIndex, setIndex, technique, field, subIndex = 0) => {
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    const current = techniqueData[key] || {};
    
    if (technique === 'p') {
      const currentValue = parseInt(current[field]) || 0;
      updateTechniqueData(exerciseIndex, setIndex, technique, field, (currentValue + 1).toString());
    } else if (technique === 'rp') {
      const increment = field === 'restTime' ? 5 : 1;
      const currentValue = parseInt(current.series?.[subIndex]?.[field]) || (field === 'restTime' ? 15 : 0);
      updateTechniqueData(exerciseIndex, setIndex, technique, field, (currentValue + increment).toString(), subIndex);
    } else if (technique === 'ds') {
      const currentValue = parseInt(current.weights?.[subIndex]?.[field]) || 0;
      updateTechniqueData(exerciseIndex, setIndex, technique, field, (currentValue + 1).toString(), subIndex);
    }
  };

  const decrementTechniqueValue = (exerciseIndex, setIndex, technique, field, subIndex = 0) => {
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    const current = techniqueData[key] || {};
    
    if (technique === 'p') {
      const currentValue = parseInt(current[field]) || 0;
      const newValue = Math.max(1, currentValue - 1);
      updateTechniqueData(exerciseIndex, setIndex, technique, field, newValue.toString());
    } else if (technique === 'rp') {
      const decrement = field === 'restTime' ? 5 : 1;
      const currentValue = parseInt(current.series?.[subIndex]?.[field]) || (field === 'restTime' ? 15 : 0);
      const minValue = field === 'restTime' ? 5 : 0;
      const newValue = Math.max(minValue, currentValue - decrement);
      updateTechniqueData(exerciseIndex, setIndex, technique, field, newValue.toString(), subIndex);
    } else if (technique === 'ds') {
      const currentValue = parseInt(current.weights?.[subIndex]?.[field]) || 0;
      const newValue = Math.max(0, currentValue - 1);
      updateTechniqueData(exerciseIndex, setIndex, technique, field, newValue.toString(), subIndex);
    }
  };

  const addSet = (exerciseIndex) => {
    const currentSets = exerciseSets[exerciseIndex];
    const lastSet = currentSets[currentSets.length - 1];
    setExerciseSets(prev => ({
      ...prev,
      [exerciseIndex]: [...prev[exerciseIndex], { 
        reps: lastSet.reps, 
        weight: lastSet.weight, 
        rir: lastSet.rir, 
        completed: false, 
        techniques: { rp: false, ds: false, p: false }
      }]
    }));
  };

  const removeSet = (exerciseIndex) => {
    if (exerciseSets[exerciseIndex].length > 1) {
      setExerciseSets(prev => ({
        ...prev,
        [exerciseIndex]: prev[exerciseIndex].slice(0, -1)
      }));
    }
  };

  const getTechniqueData = (exerciseIndex, setIndex, technique) => {
    const key = `${exerciseIndex}-${setIndex}-${technique}`;
    return techniqueData[key] || (
      technique === 'rp' ? { series: [{ reps: '', restTime: 15 }] } :
      technique === 'ds' ? { weights: [{ weight: '', reps: '' }] } :
      { partialReps: 5 }
    );
  };

  return (
    <div className="app-container">
      <div className="gradient-background">
        <div className="workout-content">
          
          {/* Exercises */}
          {exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="exercise-section">
              
              {/* Exercise Title */}
              <h2 className="exercise-title">{exercise.name}</h2>

              {/* Sets */}
              {exerciseSets[exerciseIndex].map((set, setIndex) => (
                <div key={setIndex} className={`exercise-card set-card ${set.completed ? 'completed' : ''}`}>
                  
                  {/* Set Header */}
                  <div className="set-header">
                    <span className="set-label">Serie {setIndex + 1}</span>
                  </div>

                  {/* Inputs Section */}
                  <div className="inputs-section">
                    <div className="input-field">
                      <label className="field-label">Repeticiones</label>
                      <div className="input-group">
                        <button 
                          className="control-btn"
                          onClick={() => decrementValue(exerciseIndex, setIndex, 'reps')}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className="set-input"
                        />
                        <button 
                          className="control-btn"
                          onClick={() => incrementValue(exerciseIndex, setIndex, 'reps')}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="input-field">
                      <label className="field-label">Peso (kg)</label>
                      <div className="input-group">
                        <button 
                          className="control-btn"
                          onClick={() => decrementValue(exerciseIndex, setIndex, 'weight')}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.weight}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                          className="set-input"
                        />
                        <button 
                          className="control-btn"
                          onClick={() => incrementValue(exerciseIndex, setIndex, 'weight')}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="input-field">
                      <label className="field-label">RIR</label>
                      <div className="input-group">
                        <button 
                          className="control-btn"
                          onClick={() => decrementValue(exerciseIndex, setIndex, 'rir')}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.rir}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'rir', e.target.value)}
                          className="set-input"
                        />
                        <button 
                          className="control-btn"
                          onClick={() => incrementValue(exerciseIndex, setIndex, 'rir')}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Techniques Section */}
                  <div className="techniques-section">
                    <div className="techniques-row">
                      <span className="section-label">Técnicas avanzadas</span>
                      <div className="technique-buttons">
                        <button
                          className={`technique-btn ${set.techniques.rp ? 'active rp' : ''}`}
                          onClick={() => updateTechnique(exerciseIndex, setIndex, 'rp')}
                          title="Rest Pause"
                        >
                          RP
                        </button>
                        <button
                          className={`technique-btn ${set.techniques.ds ? 'active ds' : ''}`}
                          onClick={() => updateTechnique(exerciseIndex, setIndex, 'ds')}
                          title="Drop Set"
                        >
                          DS
                        </button>
                        <button
                          className={`technique-btn ${set.techniques.p ? 'active p' : ''}`}
                          onClick={() => updateTechnique(exerciseIndex, setIndex, 'p')}
                          title="Partials"
                        >
                          P
                        </button>
                      </div>
                    </div>

                    {/* Rest Pause Configuration */}
                    {set.techniques.rp && (
                      <div className="technique-config rp-config">
                        <div className="config-header">
                          <span className="config-label">Configuración Rest Pause</span>
                          <div className="config-actions">
                            <button 
                              className="mini-btn"
                              onClick={() => addTechniqueSeries(exerciseIndex, setIndex, 'rp')}
                            >
                              +
                            </button>
                            {getTechniqueData(exerciseIndex, setIndex, 'rp').series.length > 1 && (
                              <button 
                                className="mini-btn"
                                onClick={() => removeTechniqueSeries(exerciseIndex, setIndex, 'rp', getTechniqueData(exerciseIndex, setIndex, 'rp').series.length - 1)}
                              >
                                −
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {getTechniqueData(exerciseIndex, setIndex, 'rp').series.map((rpSeries, rpIndex) => (
                          <div key={rpIndex} className="rp-series">
                            <span className="rp-series-label">RP {rpIndex + 1}</span>
                            
                            <div className="rp-controls">
                              <div className="rp-field">
                                <label className="mini-label">Reps</label>
                                <div className="mini-input-group">
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => decrementTechniqueValue(exerciseIndex, setIndex, 'rp', 'reps', rpIndex)}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={rpSeries.reps}
                                    onChange={(e) => updateTechniqueData(exerciseIndex, setIndex, 'rp', 'reps', e.target.value, rpIndex)}
                                    className="mini-input"
                                  />
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => incrementTechniqueValue(exerciseIndex, setIndex, 'rp', 'reps', rpIndex)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              
                              <div className="rp-field">
                                <label className="mini-label">Descanso (seg)</label>
                                <div className="mini-input-group">
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => decrementTechniqueValue(exerciseIndex, setIndex, 'rp', 'restTime', rpIndex)}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    placeholder="15"
                                    value={rpSeries.restTime}
                                    onChange={(e) => updateTechniqueData(exerciseIndex, setIndex, 'rp', 'restTime', e.target.value, rpIndex)}
                                    className="mini-input"
                                  />
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => incrementTechniqueValue(exerciseIndex, setIndex, 'rp', 'restTime', rpIndex)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Drop Set Configuration */}
                    {set.techniques.ds && (
                      <div className="technique-config ds-config">
                        <div className="config-header">
                          <span className="config-label">Configuración Drop Set</span>
                          <div className="config-actions">
                            <button 
                              className="mini-btn"
                              onClick={() => addTechniqueSeries(exerciseIndex, setIndex, 'ds')}
                            >
                              +
                            </button>
                            {getTechniqueData(exerciseIndex, setIndex, 'ds').weights.length > 1 && (
                              <button 
                                className="mini-btn"
                                onClick={() => removeTechniqueSeries(exerciseIndex, setIndex, 'ds', getTechniqueData(exerciseIndex, setIndex, 'ds').weights.length - 1)}
                              >
                                −
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {getTechniqueData(exerciseIndex, setIndex, 'ds').weights.map((dsWeight, dsIndex) => (
                          <div key={dsIndex} className="ds-drop">
                            <span className="ds-drop-label">Drop {dsIndex + 1}</span>
                            
                            <div className="ds-controls">
                              <div className="ds-field">
                                <label className="mini-label">Reps</label>
                                <div className="mini-input-group">
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => decrementTechniqueValue(exerciseIndex, setIndex, 'ds', 'reps', dsIndex)}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={dsWeight.reps}
                                    onChange={(e) => updateTechniqueData(exerciseIndex, setIndex, 'ds', 'reps', e.target.value, dsIndex)}
                                    className="mini-input"
                                  />
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => incrementTechniqueValue(exerciseIndex, setIndex, 'ds', 'reps', dsIndex)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              
                              <div className="ds-field">
                                <label className="mini-label">Peso (kg)</label>
                                <div className="mini-input-group">
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => decrementTechniqueValue(exerciseIndex, setIndex, 'ds', 'weight', dsIndex)}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={dsWeight.weight}
                                    onChange={(e) => updateTechniqueData(exerciseIndex, setIndex, 'ds', 'weight', e.target.value, dsIndex)}
                                    className="mini-input"
                                  />
                                  <button 
                                    className="mini-control-btn"
                                    onClick={() => incrementTechniqueValue(exerciseIndex, setIndex, 'ds', 'weight', dsIndex)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Partials Configuration */}
                    {set.techniques.p && (
                      <div className="technique-config p-config">
                        <div className="config-header">
                          <span className="config-label">Configuración Partials</span>
                        </div>
                        
                        <div className="p-control">
                          <label className="mini-label">Repeticiones parciales</label>
                          <div className="mini-input-group">
                            <button 
                              className="mini-control-btn"
                              onClick={() => decrementTechniqueValue(exerciseIndex, setIndex, 'p', 'partialReps')}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              placeholder="5"
                              value={getTechniqueData(exerciseIndex, setIndex, 'p').partialReps}
                              onChange={(e) => updateTechniqueData(exerciseIndex, setIndex, 'p', 'partialReps', e.target.value)}
                              className="mini-input"
                            />
                            <button 
                              className="mini-control-btn"
                              onClick={() => incrementTechniqueValue(exerciseIndex, setIndex, 'p', 'partialReps')}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Action Buttons per Exercise */}
              <div className="action-buttons">
                <button 
                  className="action-btn secondary" 
                  onClick={() => removeSet(exerciseIndex)} 
                  disabled={exerciseSets[exerciseIndex].length <= 1}
                >
                  Eliminar serie
                </button>
                <button className="action-btn primary" onClick={() => addSet(exerciseIndex)}>
                  Agregar Serie
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .gradient-background {
          min-height: 100vh;
          background: radial-gradient(ellipse at top left, #373C56 0%, #121623 100%);
          padding: 20px;
          box-sizing: border-box;
        }
        
        .workout-content {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }
        
        .exercise-section {
          margin-bottom: 40px;
        }
        
        .exercise-section:last-child {
          margin-bottom: 0;
        }
        
        .exercise-title {
          color: white;
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 20px 0;
          text-align: center;
        }
        
        .exercise-card {
          background-color: #1f2940;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .set-card.completed {
          opacity: 0.7;
          border-left: 4px solid #2979ff;
        }
        
        .set-header {
          margin-bottom: 20px;
        }
        
        .set-label {
          color: white;
          font-size: 16px;
          font-weight: bold;
        }
        
        .inputs-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .input-field {
          flex: 1;
          min-width: 100px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .field-label {
          color: #a5a5a5;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
        
        .input-group {
          display: flex;
          align-items: center;
          background-color: #293048;
          border-radius: 5px;
          height: 44px;
          position: relative;
        }
        
        .control-btn {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 44px;
          user-select: none;
          position: absolute;
          top: 0;
          z-index: 1;
        }
        
        .control-btn:first-child {
          left: 0;
        }
        
        .control-btn:last-child {
          right: 0;
        }
        
        .control-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .set-input {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: none;
          border: none;
          color: white;
          text-align: center;
          font-size: 16px;
          outline: none;
          padding: 0 35px;
          box-sizing: border-box;
        }
        
        .set-input::placeholder {
          color: #a5a5a5;
        }
        
        .set-input::-webkit-outer-spin-button,
        .set-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .set-input[type=number] {
          -moz-appearance: textfield;
        }
        
        .techniques-section {
          border-top: 1px solid #293048;
          padding-top: 15px;
        }
        
        .techniques-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }
        
        .section-label {
          color: #a5a5a5;
          font-size: 14px;
          font-weight: 500;
          flex-shrink: 0;
        }
        
        .technique-buttons {
          display: flex;
          gap: 8px;
        }
        
        .technique-btn {
          background: none;
          border: 1px solid #a5a5a5;
          border-radius: 6px;
          color: #a5a5a5;
          font-weight: 600;
          font-size: 12px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 32px;
          text-align: center;
        }
        
        .technique-btn:hover {
          border-color: white;
          color: white;
        }
        
        .technique-btn.active.rp {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        
        .technique-btn.active.ds {
          background: #f59e0b;
          border-color: #f59e0b;
          color: white;
        }
        
        .technique-btn.active.p {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: white;
        }
        
        .technique-config {
          margin-top: 15px;
          background: #293048;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #373c56;
        }
        
        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .config-label {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }
        
        .config-actions {
          display: flex;
          gap: 5px;
        }
        
        .mini-btn {
          background: #373c56;
          border: none;
          border-radius: 4px;
          color: #a5a5a5;
          font-size: 14px;
          font-weight: bold;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mini-btn:hover {
          background: #454a68;
          color: white;
        }
        
        .rp-series, .ds-drop, .p-control {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #373c56;
        }
        
        .rp-series:last-child, .ds-drop:last-child, .p-control:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .rp-series-label, .ds-drop-label {
          color: #a5a5a5;
          font-size: 11px;
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
        }
        
        .rp-controls, .ds-controls {
          display: flex;
          gap: 10px;
        }
        
        .rp-field, .ds-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .mini-label {
          color: #a5a5a5;
          font-size: 10px;
          font-weight: 500;
          text-align: center;
        }
        
        .mini-input-group {
          display: flex;
          align-items: center;
          background-color: #373c56;
          border-radius: 4px;
          height: 32px;
          position: relative;
        }
        
        .mini-control-btn {
          background: none;
          border: none;
          color: white;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 32px;
          user-select: none;
          position: absolute;
          top: 0;
          z-index: 1;
        }
        
        .mini-control-btn:first-child {
          left: 0;
        }
        
        .mini-control-btn:last-child {
          right: 0;
        }
        
        .mini-control-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .mini-input {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: none;
          border: none;
          color: white;
          text-align: center;
          font-size: 12px;
          outline: none;
          padding: 0 26px;
          box-sizing: border-box;
        }
        
        .mini-input::placeholder {
          color: #6b7280;
        }
        
        .mini-input::-webkit-outer-spin-button,
        .mini-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .mini-input[type=number] {
          -moz-appearance: textfield;
        }
        
        .ds-weight {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        
        .ds-weight .mini-input-group {
          flex: 1;
          max-width: 120px;
        }
        
        .p-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        
        .p-control .mini-input-group {
          flex: 1;
          max-width: 120px;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 15px;
        }
        
        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn.primary {
          background-color: #2979ff;
          color: white;
        }
        
        .action-btn.primary:hover {
          background-color: #1976d2;
        }
        
        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .action-btn:disabled:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* Mobile responsive */
        @media (max-width: 480px) {
          .gradient-background {
            padding: 15px;
          }
          
          .exercise-card {
            padding: 15px;
          }
          
          .set-header {
            margin-bottom: 20px;
          }
          
          .inputs-section {
            flex-direction: column;
            gap: 15px;
          }
          
          .input-field {
            min-width: 100%;
          }
          
          .input-group {
            height: 40px;
          }
          
          .control-btn {
            width: 30px;
            height: 40px;
            font-size: 18px;
          }
          
          .set-input {
            font-size: 14px;
            padding: 0 32px;
          }
          
          .technique-btn {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkoutTracker;
```