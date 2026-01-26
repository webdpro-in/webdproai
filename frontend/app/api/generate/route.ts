import { NextResponse } from "next/server";

export async function POST(req: Request) {
   try {
      const body = await req.json();
      const { prompt } = body;

      if (!prompt) {
         return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
      }

      // Call AI Service
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:4000";
      const response = await fetch(`${aiServiceUrl}/generate`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
         throw new Error(`AI Service failed: ${response.statusText}`);
      }

      const result = await response.json();

      return NextResponse.json(result);

   } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
   }
}
