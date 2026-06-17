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

/**
 * Sends a GitHub URL to the backend for ingestion and scoring.
 */
export async function analyzeGithubRepo(githubUrl) {
  const BACKEND_URL = getBackendUrl();
  const response = await fetch(`${BACKEND_URL}/api/github/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ github_url: githubUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${response.status})`);
  }

  return response.json();
}

/**
 * Queries the RAG model for a specific repository.
 */
export async function chatGithubRepo(githubUrl, question, chatHistory = []) {
  const BACKEND_URL = getBackendUrl();
  const response = await fetch(`${BACKEND_URL}/api/github/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      github_url: githubUrl,
      question: question,
      chat_history: chatHistory,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${response.status})`);
  }

  return response.json();
}

