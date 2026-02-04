import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalyzeRequest, AnalyzeResponse, APIError } from "@/types/resume";

function buildPrompt(resumeText: string, jobDescription?: string): string {
  return `You are a helpful assistant that analyzes resumes and job descriptions.

I will provide text for a resume, and optionally a job description.

Your task is to:

1. Score the resume between 0 and 100 for job fit.
2. List 5 bullet points of the **strengths** of the resume.
3. List 5 bullet points of the **weaknesses** or areas to improve.
4. If a job description is provided, compute a **match percentage** based on how well the resume aligns with the job.
5. Provide concise and clear output in JSON format.

Output format MUST be exactly:

{
  "resumeScore": <number 0-100>,
  "matchPercentage": <number 0-100 or null if no job description provided>,
  "strengths": [
    "<strength bullet 1>",
    "<strength bullet 2>",
    "<strength bullet 3>",
    "<strength bullet 4>",
    "<strength bullet 5>"
  ],
  "weaknesses": [
    "<weakness bullet 1>",
    "<weakness bullet 2>",
    "<weakness bullet 3>",
    "<weakness bullet 4>",
    "<weakness bullet 5>"
  ]
}

Criteria:
- Score should reflect clarity, relevance, keywords, structure, and job description alignment (if provided).
- matchPercentage is ONLY computed if a job description is provided, else set it to null.
- Strengths should highlight positive aspects of the resume (skills, achievements, clarity).
- Weaknesses should highlight suggestions for improvement (missing keywords, unclear formatting, lack of results, etc.)

Here is the resume text:
${resumeText}

Here is the job description text (leave blank if none):
${jobDescription || ""}

Respond ONLY with valid JSON. Do not include any other text or markdown formatting.`;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client inside the handler to avoid build-time errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body: AnalyzeRequest = await request.json();

    if (!body.resumeText || body.resumeText.trim().length === 0) {
      const error: APIError = { error: "Resume text is required" };
      return NextResponse.json(error, { status: 400 });
    }

    const prompt = buildPrompt(body.resumeText, body.jobDescription);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      const error: APIError = { error: "No response from OpenAI" };
      return NextResponse.json(error, { status: 500 });
    }

    // Parse the JSON response from OpenAI
    let analysisResult: AnalyzeResponse;
    try {
      analysisResult = JSON.parse(responseContent);
    } catch {
      const error: APIError = {
        error: "Failed to parse OpenAI response",
        details: responseContent,
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Validate the response structure
    if (
      typeof analysisResult.resumeScore !== "number" ||
      !Array.isArray(analysisResult.strengths) ||
      !Array.isArray(analysisResult.weaknesses)
    ) {
      const error: APIError = {
        error: "Invalid response structure from OpenAI",
        details: responseContent,
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing resume:", error);
    const apiError: APIError = {
      error: "Failed to analyze resume",
      details: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}
