import { getBackendUrl } from '../utils/config';
const BACKEND_URL = getBackendUrl();

/**
 * Sends a job description to the FastAPI backend for multi-agent RAG analysis.
 * 
 * @param {string} jobDescription - The raw job description text.
 * @returns {Promise<Object>} The structured ATS alignment response from the backend.
 */
export async function analyzeJobDescription(jobDescription) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in analyzeJobDescription service:', error);
    throw error;
  }
}
