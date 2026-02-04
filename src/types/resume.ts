export interface AnalyzeRequest {
  resumeText: string;
  jobDescription?: string;
}

export interface AnalyzeResponse {
  resumeScore: number;
  matchPercentage: number | null;
  strengths: string[];
  weaknesses: string[];
}

export interface APIError {
  error: string;
  details?: string;
}
