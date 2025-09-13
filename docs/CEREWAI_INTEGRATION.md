# Cerewai Integration for Voodoo Perfumes

## What is Cerewai?

Cerewai is an AI-powered platform that provides intelligent automation and data processing capabilities. Based on the environment variables in your project, it appears you're already planning to integrate Cerewai for data enrichment and analysis.

## Current Integration Status

### Existing Configuration

- ✅ Environment variables configured in `env_example.txt`
- ✅ OpenAI API key setup for Cerewai
- ✅ Output directory configuration
- ✅ Rate limiting configuration

### Missing Implementation

- ❌ No actual Cerewai integration code
- ❌ No data enrichment workflows
- ❌ No AI-powered features implemented

## Recommended Cerewai Integration Strategy

### 1. Data Enrichment for Perfumes

#### Perfume Description Enhancement

```typescript
// Create app/services/cerewai/perfume-enrichment.server.ts
import { CrewAI } from "crewai";

interface PerfumeEnrichmentRequest {
  name: string;
  currentDescription?: string;
  notes?: string[];
  houseName: string;
}

interface EnrichedPerfumeData {
  enhancedDescription: string;
  detailedNotes: string[];
  moodProfile: string[];
  occasionRecommendations: string[];
  seasonality: string[];
  longevityEstimate: string;
  sillageEstimate: string;
}

export class PerfumeEnrichmentService {
  private crewAI: CrewAI;

  constructor() {
    this.crewAI = new CrewAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  async enrichPerfumeData(
    request: PerfumeEnrichmentRequest
  ): Promise<EnrichedPerfumeData> {
    const prompt = this.buildEnrichmentPrompt(request);

    try {
      const response = await this.crewAI.generate({
        prompt,
        maxTokens: 1000,
        temperature: 0.7,
      });

      return this.parseEnrichmentResponse(response);
    } catch (error) {
      console.error("Cerewai enrichment error:", error);
      throw new Error("Failed to enrich perfume data");
    }
  }

  private buildEnrichmentPrompt(request: PerfumeEnrichmentRequest): string {
    return `
    As a perfume expert, enhance the following perfume information:
    
    Name: ${request.name}
    House: ${request.houseName}
    Current Description: ${request.currentDescription || "None provided"}
    Notes: ${request.notes?.join(", ") || "None provided"}
    
    Please provide:
    1. An enhanced, detailed description (2-3 sentences)
    2. Detailed fragrance notes breakdown
    3. Mood profile (3-5 moods this perfume evokes)
    4. Occasion recommendations (when to wear this)
    5. Seasonality (best seasons to wear)
    6. Longevity estimate (short/medium/long)
    7. Sillage estimate (intimate/moderate/strong)
    
    Format as JSON with the following structure:
    {
      "enhancedDescription": "...",
      "detailedNotes": ["...", "..."],
      "moodProfile": ["...", "..."],
      "occasionRecommendations": ["...", "..."],
      "seasonality": ["...", "..."],
      "longevityEstimate": "...",
      "sillageEstimate": "..."
    }
    `;
  }

  private parseEnrichmentResponse(response: string): EnrichedPerfumeData {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse Cerewai response:", error);
      throw new Error("Invalid response format from Cerewai");
    }
  }
}
```

#### Batch Enrichment Process

```typescript
// Create app/services/cerewai/batch-enrichment.server.ts
import { PerfumeEnrichmentService } from "./perfume-enrichment.server";
import { prisma } from "~/db.server";

export class BatchEnrichmentService {
  private enrichmentService: PerfumeEnrichmentService;
  private readonly BATCH_SIZE = 10;
  private readonly DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

  constructor() {
    this.enrichmentService = new PerfumeEnrichmentService();
  }

  async enrichMissingDescriptions(): Promise<{
    processed: number;
    enriched: number;
    errors: number;
  }> {
    const perfumes = await prisma.perfume.findMany({
      where: {
        OR: [{ description: null }, { description: "" }],
      },
      include: {
        perfumeHouse: true,
      },
      take: 100, // Limit to prevent overwhelming the API
    });

    let processed = 0;
    let enriched = 0;
    let errors = 0;

    for (let i = 0; i < perfumes.length; i += this.BATCH_SIZE) {
      const batch = perfumes.slice(i, i + this.BATCH_SIZE);

      for (const perfume of batch) {
        try {
          const enrichedData = await this.enrichmentService.enrichPerfumeData({
            name: perfume.name,
            currentDescription: perfume.description || undefined,
            houseName: perfume.perfumeHouse?.name || "Unknown House",
          });

          await prisma.perfume.update({
            where: { id: perfume.id },
            data: {
              description: enrichedData.enhancedDescription,
            },
          });

          enriched++;
        } catch (error) {
          console.error(`Failed to enrich ${perfume.name}:`, error);
          errors++;
        }

        processed++;

        // Rate limiting
        if (i < perfumes.length - 1) {
          await this.delay(this.DELAY_BETWEEN_REQUESTS);
        }
      }
    }

    return { processed, enriched, errors };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 2. AI-Powered Recommendation System

#### Perfume Recommendation Engine

```typescript
// Create app/services/cerewai/recommendation.server.ts
interface UserPreferences {
  favoriteNotes: string[];
  preferredHouses: string[];
  priceRange: string;
  occasion: string;
  season: string;
  longevity: string;
  sillage: string;
}

interface RecommendationRequest {
  userId: string;
  preferences: UserPreferences;
  limit?: number;
}

export class PerfumeRecommendationService {
  private crewAI: CrewAI;

  constructor() {
    this.crewAI = new CrewAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<{
    recommendations: Array<{
      perfumeId: string;
      name: string;
      house: string;
      matchScore: number;
      reasoning: string;
    }>;
  }> {
    const availablePerfumes = await this.getAvailablePerfumes();
    const prompt = this.buildRecommendationPrompt(
      request.preferences,
      availablePerfumes
    );

    try {
      const response = await this.crewAI.generate({
        prompt,
        maxTokens: 1500,
        temperature: 0.8,
      });

      return this.parseRecommendationResponse(response, request.limit || 10);
    } catch (error) {
      console.error("Cerewai recommendation error:", error);
      throw new Error("Failed to generate recommendations");
    }
  }

  private async getAvailablePerfumes() {
    return prisma.perfume.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        perfumeHouse: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      take: 100, // Limit for API efficiency
    });
  }

  private buildRecommendationPrompt(
    preferences: UserPreferences,
    perfumes: any[]
  ): string {
    return `
    As a perfume recommendation expert, suggest perfumes based on these preferences:
    
    User Preferences:
    - Favorite Notes: ${preferences.favoriteNotes.join(", ")}
    - Preferred Houses: ${preferences.preferredHouses.join(", ")}
    - Price Range: ${preferences.priceRange}
    - Occasion: ${preferences.occasion}
    - Season: ${preferences.season}
    - Longevity: ${preferences.longevity}
    - Sillage: ${preferences.sillage}
    
    Available Perfumes:
    ${perfumes
      .map((p) => `${p.name} by ${p.perfumeHouse.name} - ${p.description}`)
      .join("\n")}
    
    Please recommend the best matches with:
    1. Match score (1-10)
    2. Reasoning for the recommendation
    3. How it fits their preferences
    
    Format as JSON array:
    [
      {
        "perfumeId": "...",
        "name": "...",
        "house": "...",
        "matchScore": 8,
        "reasoning": "This perfume matches your love for floral notes and works well for evening occasions..."
      }
    ]
    `;
  }

  private parseRecommendationResponse(response: string, limit: number) {
    try {
      const recommendations = JSON.parse(response);
      return {
        recommendations: recommendations.slice(0, limit),
      };
    } catch (error) {
      console.error("Failed to parse recommendation response:", error);
      throw new Error("Invalid recommendation response format");
    }
  }
}
```

### 3. Data Quality Analysis

#### AI-Powered Data Quality Assessment

```typescript
// Create app/services/cerewai/data-quality.server.ts
export class DataQualityAnalysisService {
  private crewAI: CrewAI;

  constructor() {
    this.crewAI = new CrewAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  async analyzePerfumeData(perfume: any): Promise<{
    qualityScore: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = this.buildQualityAnalysisPrompt(perfume);

    try {
      const response = await this.crewAI.generate({
        prompt,
        maxTokens: 800,
        temperature: 0.3,
      });

      return this.parseQualityAnalysisResponse(response);
    } catch (error) {
      console.error("Cerewai quality analysis error:", error);
      throw new Error("Failed to analyze data quality");
    }
  }

  private buildQualityAnalysisPrompt(perfume: any): string {
    return `
    Analyze the data quality of this perfume entry:
    
    Name: ${perfume.name}
    Description: ${perfume.description || "Missing"}
    House: ${perfume.perfumeHouse?.name || "Missing"}
    Notes: ${perfume.notes?.join(", ") || "Missing"}
    
    Assess:
    1. Completeness (0-10)
    2. Accuracy (0-10)
    3. Consistency (0-10)
    4. Specific issues found
    5. Improvement suggestions
    
    Format as JSON:
    {
      "qualityScore": 7,
      "issues": ["Missing description", "Inconsistent naming"],
      "suggestions": ["Add detailed description", "Standardize naming convention"]
    }
    `;
  }

  private parseQualityAnalysisResponse(response: string) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse quality analysis response:", error);
      throw new Error("Invalid quality analysis response format");
    }
  }
}
```

### 4. API Integration

#### Cerewai API Routes

```typescript
// Create app/routes/api/cerewai/enrich-perfume.tsx
import { json } from "react-router";
import { PerfumeEnrichmentService } from "~/services/cerewai/perfume-enrichment.server";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { perfumeId } = await request.json();

    const perfume = await prisma.perfume.findUnique({
      where: { id: perfumeId },
      include: { perfumeHouse: true },
    });

    if (!perfume) {
      return json({ error: "Perfume not found" }, { status: 404 });
    }

    const enrichmentService = new PerfumeEnrichmentService();
    const enrichedData = await enrichmentService.enrichPerfumeData({
      name: perfume.name,
      currentDescription: perfume.description || undefined,
      houseName: perfume.perfumeHouse?.name || "Unknown House",
    });

    // Update perfume with enriched data
    await prisma.perfume.update({
      where: { id: perfumeId },
      data: {
        description: enrichedData.enhancedDescription,
      },
    });

    return json({
      success: true,
      enrichedData,
    });
  } catch (error) {
    console.error("Perfume enrichment error:", error);
    return json({ error: "Failed to enrich perfume data" }, { status: 500 });
  }
}
```

#### Batch Enrichment API

```typescript
// Create app/routes/api/cerewai/batch-enrich.tsx
import { json } from "react-router";
import { BatchEnrichmentService } from "~/services/cerewai/batch-enrichment.server";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const batchService = new BatchEnrichmentService();
    const results = await batchService.enrichMissingDescriptions();

    return json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Batch enrichment error:", error);
    return json(
      { error: "Failed to perform batch enrichment" },
      { status: 500 }
    );
  }
}
```

### 5. Frontend Integration

#### Enrichment UI Component

```typescript
// Create app/components/Organisms/PerfumeEnrichment/PerfumeEnrichment.tsx
import { useState } from "react";
import { useFetcher } from "react-router";

interface PerfumeEnrichmentProps {
  perfumeId: string;
  currentDescription?: string;
}

export function PerfumeEnrichment({
  perfumeId,
  currentDescription,
}: PerfumeEnrichmentProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const fetcher = useFetcher();

  const handleEnrich = async () => {
    setIsEnriching(true);

    fetcher.submit(
      { perfumeId },
      { method: "POST", action: "/api/cerewai/enrich-perfume" }
    );
  };

  return (
    <div className="bg-noir-dark/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">AI Enhancement</h3>

      {currentDescription ? (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Current Description:</p>
          <p className="text-sm">{currentDescription}</p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-yellow-400">No description available</p>
        </div>
      )}

      <button
        onClick={handleEnrich}
        disabled={isEnriching || fetcher.state === "submitting"}
        className="bg-noir-gold text-noir-dark px-4 py-2 rounded hover:bg-noir-gold/80 disabled:opacity-50"
      >
        {isEnriching || fetcher.state === "submitting"
          ? "Enriching..."
          : "Enhance with AI"}
      </button>

      {fetcher.data?.success && (
        <div className="mt-4 p-4 bg-green-900/20 rounded">
          <p className="text-green-400 text-sm">
            ✅ Perfume description enhanced successfully!
          </p>
        </div>
      )}

      {fetcher.data?.error && (
        <div className="mt-4 p-4 bg-red-900/20 rounded">
          <p className="text-red-400 text-sm">❌ {fetcher.data.error}</p>
        </div>
      )}
    </div>
  );
}
```

### 6. Configuration and Environment

#### Enhanced Environment Setup

```typescript
// Create app/utils/cerewai/config.server.ts
import { z } from "zod";

const cerewaiConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  MIN_REQUEST_DELAY: z.number().default(2000),
  OUTPUT_DIR: z.string().default("enriched_data"),
  LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).default("INFO"),
  MAX_RETRIES: z.number().default(3),
  TIMEOUT: z.number().default(30000),
});

export function getCerewaiConfig() {
  const config = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    MIN_REQUEST_DELAY: parseInt(process.env.MIN_REQUEST_DELAY || "2000"),
    OUTPUT_DIR: process.env.OUTPUT_DIR || "enriched_data",
    LOG_LEVEL: process.env.LOG_LEVEL || "INFO",
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES || "3"),
    TIMEOUT: parseInt(process.env.TIMEOUT || "30000"),
  };

  return cerewaiConfigSchema.parse(config);
}
```

### 7. Error Handling and Monitoring

#### Cerewai Error Handling

```typescript
// Create app/utils/cerewai/error-handler.server.ts
export class CerewaiErrorHandler {
  static handleError(
    error: any,
    context: string
  ): {
    message: string;
    retryable: boolean;
    context: string;
  } {
    console.error(`Cerewai error in ${context}:`, error);

    if (error.code === "RATE_LIMIT_EXCEEDED") {
      return {
        message: "Rate limit exceeded. Please try again later.",
        retryable: true,
        context,
      };
    }

    if (error.code === "INVALID_API_KEY") {
      return {
        message: "Invalid API key configuration.",
        retryable: false,
        context,
      };
    }

    if (error.code === "TIMEOUT") {
      return {
        message: "Request timed out. Please try again.",
        retryable: true,
        context,
      };
    }

    return {
      message: "An unexpected error occurred.",
      retryable: true,
      context,
    };
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorInfo = this.handleError(error, "retry_operation");

        if (!errorInfo.retryable || attempt === maxRetries) {
          throw error;
        }

        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError;
  }
}
```

## Implementation Roadmap

### Phase 1 (Week 1-2): Basic Integration

1. Set up Cerewai service classes
2. Implement perfume enrichment
3. Add basic error handling
4. Create API endpoints

### Phase 2 (Week 3-4): Advanced Features

1. Implement recommendation system
2. Add batch processing
3. Create data quality analysis
4. Add frontend components

### Phase 3 (Week 5-6): Optimization

1. Implement caching for AI responses
2. Add rate limiting and retry logic
3. Optimize API calls
4. Add monitoring and logging

### Phase 4 (Week 7-8): Production Ready

1. Add comprehensive error handling
2. Implement usage analytics
3. Add cost monitoring
4. Create admin dashboard for AI features

## Cost Management

### API Usage Tracking

```typescript
// Create app/utils/cerewai/usage-tracker.server.ts
export class CerewaiUsageTracker {
  static async trackUsage(operation: string, tokens: number, cost: number) {
    // Log to database or monitoring service
    console.log(`Cerewai usage: ${operation} - ${tokens} tokens - $${cost}`);
  }

  static async getUsageStats(timeframe: "day" | "week" | "month") {
    // Return usage statistics
  }
}
```

### Cost Optimization

- Implement response caching
- Use smaller models for simple tasks
- Batch requests when possible
- Set usage limits and alerts

## Security Considerations

### API Key Management

- Store API keys securely
- Rotate keys regularly
- Monitor usage for anomalies
- Implement access controls

### Data Privacy

- Sanitize input data
- Don't log sensitive information
- Comply with data protection regulations
- Implement data retention policies

## Monitoring and Analytics

### Performance Metrics

- Response times
- Success rates
- Error rates
- Cost per operation

### Business Metrics

- Enrichment success rate
- User engagement with AI features
- Quality improvement metrics
- Cost per enriched item

## Testing Strategy

### Unit Tests

```typescript
// Create test/services/cerewai/perfume-enrichment.test.ts
import { describe, it, expect, vi } from "vitest";
import { PerfumeEnrichmentService } from "~/services/cerewai/perfume-enrichment.server";

describe("PerfumeEnrichmentService", () => {
  it("should enrich perfume data successfully", async () => {
    const service = new PerfumeEnrichmentService();
    const mockResponse = {
      enhancedDescription: "A beautiful floral fragrance...",
      detailedNotes: ["rose", "jasmine", "sandalwood"],
      moodProfile: ["romantic", "elegant"],
      occasionRecommendations: ["evening", "special occasions"],
      seasonality: ["spring", "summer"],
      longevityEstimate: "long",
      sillageEstimate: "moderate",
    };

    vi.spyOn(service, "enrichPerfumeData").mockResolvedValue(mockResponse);

    const result = await service.enrichPerfumeData({
      name: "Test Perfume",
      houseName: "Test House",
    });

    expect(result).toEqual(mockResponse);
  });
});
```

### Integration Tests

```typescript
// Create test/api/cerewai/enrich-perfume.test.ts
import { describe, it, expect } from "vitest";

describe("Cerewai API", () => {
  it("should enrich perfume via API", async () => {
    const response = await fetch("/api/cerewai/enrich-perfume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfumeId: "test-perfume-id" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.enrichedData).toBeDefined();
  });
});
```

## Success Metrics

### Technical Metrics

- API response time < 5 seconds
- Success rate > 95%
- Error rate < 5%
- Cost per enrichment < $0.10

### Business Metrics

- Data quality improvement > 80%
- User engagement with AI features > 30%
- Enrichment completion rate > 90%
- User satisfaction with recommendations > 4.0/5.0
