import { getBackendUrl } from '../utils/config';

/**
 * Sends a job description to the FastAPI backend for multi-agent RAG analysis.
 * 
 * @param {string} jobDescription - The raw job description text.
 * @returns {Promise<Object>} The structured ATS alignment response from the backend.
 */
export async function analyzeJobDescription(jobDescription) {
  const BACKEND_URL = getBackendUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout for multi-agent retries

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in analyzeJobDescription service:', error);
    if (error.name === 'AbortError') {
      throw new Error('Analysis request timed out. The model may be experiencing high demand. Please try again.');
    }
    throw error;
  }
}
