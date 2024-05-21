import {z} from 'zod'
import {openai} from './openai'

async function validatePrTitle(prTitle: string) {
  const prompt = `Act as PR title analyzer.

# GUIDELINES
- Follow pattern: <TICKET_ID> <IMPERATIVE_VERB> <REST OF DESCRIPTION>
- Start with JIRA ticket ID
- Follow with verb in imperative form
- Ensure the title gives a short description of the change
- Capitalize the Start: Except for the ticket ID, capitalize the first letter of the title
- PR Title should NOT use the following punctuation marks: '!', '?', ':', ';', ','
- WIP: If you're still working on a task, add “WIP” prefix, e.g. “WIP NEX-12345 <rest>”


{INSTRUCTIONS}
IF the PR title follows the guidelines, respond with the following JSON and nothing else {"is_valid": true} 
Otherwise respond with {"is_valid": false, "reason": "<reason>", "updated_title": "<updated_title>"} where <reason> is a string explaining why the title is invalid and <updated_title> is the corrected title.
{/INSTRUCTIONS}

{EXAMPLES}
User: NEX-67890 Bugfix:// login issue
AI: {"is_valid": false, "reason": "Title should not contain 'Bugfix://' syntax.", "updated_title": "NEX-67890 Fix login issue causing session timeouts"}

User: NEX-67890 Fix login issue causing session timeouts
AI: {"is_valid": true}

User: Feature/NEX-54321-Updating-packages
AI: {"is_valid": false, "reason": "Title should not contain 'Feature/' prefix.", "updated_title": "NEX-54321 Update dependency versions for security patches"}

User: NEX-54321 Update dependency versions for security patches
AI: {"is_valid": true}

User: NEX-12333 modeling save changes
AI: {"is_valid": false, "reason": "Title should start with imperative verb and give short description of the change.", "updated_title": "NEX-12333 Fix saving in Modeling by clearing cache"}

User: NEX-12333 Fix saving in Modeling by clearing cache
AI: {"is_valid": true}

User: NEX-12453 Add login screen.
AI: {"is_valid": false, "reason": "Title should not end with a period.", "updated_title": "NEX-12453 Add login screen"}

User: NEX-12453 Add login screen
AI: {"is_valid": true}

User: NEX-12333 Fix saving in Modeling by clearing cache.
AI: {"is_valid": false, "reason": "Title should not end with a period.", "updated_title": "NEX-12333 Fix saving in Modeling by clearing cache"}
{/EXAMPLES}

---

USER INPUT:`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-05-13',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: prTitle,
        },
      ],
    })

    const answer = parseAiResponse(response.choices[0].message.content)

    console.log({prTitle, answer})

    return answer
  } catch (e) {
    console.error(e)
  }
}

validatePrTitle('NEX-12333 Fix saving in Modeling by clearing cache.')

const aiResponseSchema = z.object({
  is_valid: z.boolean(),
  reason: z.string().optional(),
  updated_title: z.string().optional(),
})

function parseAiResponse(response?: string | null) {
  try {
    const parsed = JSON.parse(response ?? '')
    return aiResponseSchema.parse(parsed)
  } catch (e) {
    console.error(e)
    throw new Error('Invalid response format')
  }
}
