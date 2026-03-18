'use server';
/**
 * @fileOverview This file implements a Genkit flow for analyzing free-text "Other" reasons for library visits.
 *
 * - adminOtherReasonAnalysis - A function that analyzes a list of "Other" reasons to identify recurring themes and categories.
 * - AdminOtherReasonAnalysisInput - The input type for the adminOtherReasonAnalysis function.
 * - AdminOtherReasonAnalysisOutput - The return type for the adminOtherReasonAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminOtherReasonAnalysisInputSchema = z.object({
  otherReasons: z
    .array(z.string())
    .describe('A list of free-text "Other" reasons for library visits.'),
});
export type AdminOtherReasonAnalysisInput = z.infer<
  typeof AdminOtherReasonAnalysisInputSchema
>;

const AdminOtherReasonAnalysisOutputSchema = z.object({
  analysis: z
    .array(
      z.object({
        category: z
          .string()
          .describe('A concise category name for the identified theme.'),
        summary: z.string().describe('A brief summary explaining the theme.'),
        exampleReasons: z
          .array(z.string())
          .describe(
            'A few example free-text reasons that fall under this category.'
          ),
      })
    )
    .describe(
      'An array of identified themes/categories from the free-text "Other" reasons.'
    ),
});
export type AdminOtherReasonAnalysisOutput = z.infer<
  typeof AdminOtherReasonAnalysisOutputSchema
>;

const adminOtherReasonAnalysisPrompt = ai.definePrompt({
  name: 'adminOtherReasonAnalysisPrompt',
  input: {schema: AdminOtherReasonAnalysisInputSchema},
  output: {schema: AdminOtherReasonAnalysisOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing qualitative data. Your task is to review a list of free-text reasons provided by library visitors under the "Other" category.

Your goal is to identify recurring themes, patterns, or categories within these reasons. For each identified theme, provide a concise category name, a brief summary explaining the theme, and a few example free-text reasons that illustrate this theme.

If there are no clear themes or the reasons are too diverse or few to categorize, you may indicate that or group them into a "Miscellaneous" category.

List of "Other" reasons:
{{#each otherReasons}}
- {{{this}}}
{{/each}}`,
});

const adminOtherReasonAnalysisFlow = ai.defineFlow(
  {
    name: 'adminOtherReasonAnalysisFlow',
    inputSchema: AdminOtherReasonAnalysisInputSchema,
    outputSchema: AdminOtherReasonAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await adminOtherReasonAnalysisPrompt(input);
    return output!;
  }
);

export async function adminOtherReasonAnalysis(
  input: AdminOtherReasonAnalysisInput
): Promise<AdminOtherReasonAnalysisOutput> {
  return adminOtherReasonAnalysisFlow(input);
}
