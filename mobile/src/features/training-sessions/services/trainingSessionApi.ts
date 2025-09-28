/* Training Session API Service */

import { 
  TrainingSession, 
  CreateTrainingSessionRequest, 
  UpdateProgressRequest, 
  CompleteSessionRequest 
} from '../types';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

export const trainingSessionApi = {
  // Get active training session for a profile
  getActiveSession: async (profileId: number): Promise<TrainingSession | null> => {
    const response = await fetch(`${API_BASE_URL}/training-sessions/active/${profileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get active session: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  // Create new training session
  createSession: async (sessionData: CreateTrainingSessionRequest): Promise<{ sessionId: number }> => {
    const response = await fetch(`${API_BASE_URL}/training-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create training session');
    }
    
    const result = await response.json();
    return result.data;
  },

  // Update training session progress
  updateProgress: async (sessionId: number, progressData: UpdateProgressRequest): Promise<{ progressId: number }> => {
    const response = await fetch(`${API_BASE_URL}/training-sessions/${sessionId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update progress');
    }
    
    const result = await response.json();
    return result.data;
  },

  // Complete training session
  completeSession: async (sessionId: number, completionData?: CompleteSessionRequest): Promise<{ workoutSessionId: number }> => {
    console.log('🏁 [API] Attempting to complete training session:', {
      sessionId,
      sessionIdType: typeof sessionId,
      isValidNumber: !isNaN(sessionId) && isFinite(sessionId),
      completionData
    });

    if (!sessionId || isNaN(sessionId) || !isFinite(sessionId)) {
      const error = new Error(`Invalid sessionId: ${sessionId} (type: ${typeof sessionId})`);
      console.error('❌ [API] Complete session failed - invalid sessionId:', error.message);
      throw error;
    }

    const url = `${API_BASE_URL}/training-sessions/${sessionId}/complete`;
    console.log('🌐 [API] Making request to:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData || {}),
      });
      
      console.log('📡 [API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [API] Complete session failed - server error:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(error.message || `Failed to complete session: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ [API] Session completed successfully:', result);
      return result.data;
    } catch (fetchError) {
      console.error('❌ [API] Complete session failed - network/parse error:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
      throw fetchError;
    }
  },

  // Cancel training session
  cancelSession: async (sessionId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/training-sessions/${sessionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel session');
    }
  },

  // Get training session details
  getSessionDetails: async (sessionId: number): Promise<TrainingSession> => {
    const response = await fetch(`${API_BASE_URL}/training-sessions/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session details: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }
};