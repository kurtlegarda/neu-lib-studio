'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate a natural language summary of visitor trends
 * based on filtered visit log data for administrators.
 *
 * - adminVisitTrendSummary - A function that triggers the visitor trend summary generation.
 * - AdminVisitTrendSummaryInput - The input type for the adminVisitTrendSummary function.
 * - AdminVisitTrendSummaryOutput - The return type for the adminVisitTrendSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdminVisitTrendSummaryInputSchema = z.object({
  visits: z.array(
    z.object({
      timestamp: z
        .string()
        .describe('ISO formatted timestamp of the visit (e.g., 2023-10-27T10:30:00.000Z).'),
      reason:
        z.string().describe('The reason for the visit (e.g., Reading, Researching, Use of Computer, Meeting, Borrowing Books, Other).'),
      college: z.string().optional().describe('The college of the visitor, if available.'),
      program: z.string().optional().describe('The program of study of the visitor, if available.'),
      isEmployee: z.boolean().optional().describe('Whether the visitor is an employee.'),
      employeeType: z.string().optional().describe('Type of employee (Teacher or Staff), if applicable.'),
    })
  ).describe('An array of filtered visitor log entries.'),
  dateRange: z.object({
    startDate: z.string().describe('The start date of the filtered data in YYYY-MM-DD format.'),
    endDate: z.string().describe('The end date of the filtered data in YYYY-MM-DD format.'),
  }).describe('The date range for which the visit data was filtered.'),
});
export type AdminVisitTrendSummaryInput = z.infer<typeof AdminVisitTrendSummaryInputSchema>;

const AdminVisitTrendSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise natural language summary of the overall visitor trends.'),
});
export type AdminVisitTrendSummaryOutput = z.infer<typeof AdminVisitTrendSummaryOutputSchema>;

export async function adminVisitTrendSummary(
  input: AdminVisitTrendSummaryInput
): Promise<AdminVisitTrendSummaryOutput> {
  return adminVisitTrendSummaryFlow(input);
}

const adminVisitTrendSummaryPrompt = ai.definePrompt({
  name: 'adminVisitTrendSummaryPrompt',
  input: { schema: AdminVisitTrendSummaryInputSchema },
  output: { schema: AdminVisitTrendSummaryOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing visitor log data for libraries.
Your task is to provide a concise, natural language summary of the overall visitor trends based on the provided filtered data for the date range from {{{dateRange.startDate}}} to {{{dateRange.endDate}}}.

Analyze the following visitor log entries and identify key operational insights:
- Peak visit times (e.g., specific hours of the day, days of the week, or dates).
- Most popular reasons for visits.
- Any significant changes, anomalies, or interesting patterns in visitor behavior over the period.
- Demographic insights such as common colleges, programs, or employee vs. student trends.

Use the 'timestamp' field to infer peak times. The 'reason' field for popular activities. And other fields for demographics.

Visitor data (format: Date/Time, Reason, College, Program, Employee Status):
{{#if visits}}
  {{#each visits}}
    - {{this.timestamp}}, Reason: {{this.reason}}, College: {{this.college}}, Program: {{this.program}}, Employee: {{this.isEmployee}}{{#if this.employeeType}} ({{this.employeeType}}){{/if}}
  {{/each}}
{{else}}
  No visit data provided for this range.
{{/if}}

Provide a summary that is easy to understand for an administrator. The summary should be focused on trends and insights, not just a recitation of data points.`,
});

const adminVisitTrendSummaryFlow = ai.defineFlow(
  {
    name: 'adminVisitTrendSummaryFlow',
    inputSchema: AdminVisitTrendSummaryInputSchema,
    outputSchema: AdminVisitTrendSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await adminVisitTrendSummaryPrompt(input);
    return output!;
  }
);
