import path from 'path'
import {z} from 'zod'
import {openai} from './openai'

const promptPath = path.join(__dirname, './analyze-pr-title.prompt.txt')
const prompt = await Bun.file(promptPath).text()

async function analyzePrTitle(prTitle: string) {
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

analyzePrTitle('NEX-12333 Fix saving in Modeling by clearing cache.')

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
