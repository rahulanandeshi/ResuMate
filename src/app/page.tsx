"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const validateFile = (file: File): boolean => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a PDF or Word document (.pdf or .docx)");
      return false;
    }
    setError("");
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setResumeText(""); // Clear manual text when file is selected
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to extract text");
    }

    return data.text;
  };

  const handleAnalyze = async () => {
    setError("");

    // Validate input
    if (!selectedFile && !resumeText.trim()) {
      setError("Please upload a resume file or paste the resume text");
      return;
    }

    setIsLoading(true);

    try {
      let textToAnalyze = resumeText;

      // Extract text from file if uploaded
      if (selectedFile) {
        setLoadingMessage("Extracting text from your resume...");
        textToAnalyze = await extractTextFromFile(selectedFile);
      }

      // Call the analyze API
      setLoadingMessage("AI is analyzing your resume...");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: textToAnalyze,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      // Store result and navigate to results page
      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="loader-container">
          <div className="loader-orb" />
          <p className="loader-text">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <main className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            ResuMate
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            ResuMate is an AI-powered resume analyzer that scores resumes, lists
            strengths and weaknesses, and optionally matches with job descriptions.
          </p>
        </header>

        {/* Main Form */}
        <div className="glass-card p-8 md:p-10">
          {/* Error Message */}
          {error && (
            <div className="error-message mb-6">
              {error}
            </div>
          )}

          {/* Job Description Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Job Description
              <span className="text-gray-400 font-normal ml-2">(Optional)</span>
            </label>
            <textarea
              className="glass-input min-h-[120px] resize-y"
              placeholder="Paste the job description here to get a match percentage..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Resume Input Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Resume
            </label>

            {/* File Upload Zone */}
            <div
              className={`upload-zone mb-4 ${isDragOver ? "drag-over" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleInputChange}
                className="hidden"
                disabled={isLoading}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="file-badge">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedFile.name}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports PDF and Word (.docx) files
                  </p>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
              <span className="text-sm text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
            </div>

            {/* Manual Text Input */}
            <textarea
              className="glass-input min-h-[180px] resize-y"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              }}
              disabled={isLoading || !!selectedFile}
            />
            {selectedFile && (
              <p className="text-xs text-gray-400 mt-2">
                Remove the uploaded file to paste text manually
              </p>
            )}
          </div>

          {/* Analyze Button */}
          <button
            className="glass-button w-full text-lg"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            Analyze Resume
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-white/30">
          <p className="text-sm text-gray-500">
            Powered by AI • Built by <span className="font-semibold gradient-text">Rahul Anandeshi</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
