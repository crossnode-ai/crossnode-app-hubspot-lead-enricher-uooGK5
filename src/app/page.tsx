"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.crossnode.ai";
const AGENT_ID = "9e471e8b-7835-451c-acf3-bc6d628a06b2";

interface AgentOutput {
  result: string;
}

export default function Page() {
  const [inputQuery, setInputQuery] = useState<string>("");
  const [enrichmentResult, setEnrichmentResult] = useState<AgentOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputQuery(event.target.value);
    if (error) {
      setError(null);
    }
  };

  const runLeadEnrichmentAgent = async () => {
    if (!inputQuery.trim()) {
      setError("Please enter a query.");
      toast. ("Please enter a query.", {
        description: "Input cannot be empty."
      });
      return;
    }

    setLoading(true);
    setError(null);
    setEnrichmentResult(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/agents/${AGENT_ID}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CROSSNODE_API_KEY}`
        },
        body: JSON.stringify({
          input_data: { start_input: { input: inputQuery } } // Map UI input to agent's expected schema
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || response.statusText;
        throw new Error(`Agent run failed: ${errorMessage}`);
      }

      const data = await response.json();
      
      // Validate output structure based on schema
      if (data && data.output_data && typeof data.output_data.result === 'string') {
        setEnrichmentResult(data.output_data);
        toast.success("Lead enrichment successful!");
      } else {
        throw new Error("Invalid agent output format.");
      }

    } catch (err) {
      console.error("Lead enrichment error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error("Lead enrichment failed", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>HubSpot Lead Enricher</CardTitle>
          <CardDescription>Enter lead details to enrich company data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lead-query">Lead Identifier (e.g., Email or Company Domain)</Label>
              <Input 
                id="lead-query" 
                placeholder="example@company.com or company.com"
                value={inputQuery}
                onChange={handleInputChange}
                disabled={loading}
                aria-describedby="lead-query-error"
              />
              {error && (
                <p id="lead-query-error" className="text-sm font-medium text-red-500 mt-2">
                  {error}
                </p>
              )}
            </div>
            
            <Button 
              onClick={runLeadEnrichmentAgent} 
              disabled={loading || !inputQuery.trim()}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enriching...</span>
                </div>
              ) : (
                <span>Enrich Lead</span>
              )}
            </Button>

            {enrichmentResult && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-semibold mb-2">Enrichment Result:</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                  {enrichmentResult.result}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
