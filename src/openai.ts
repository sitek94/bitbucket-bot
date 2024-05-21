import OpenAI from 'openai'
import {wrapOpenAI} from 'langsmith/wrappers'

export const openai = wrapOpenAI(
  new OpenAI({
    apiKey: Bun.env.OPENAI_API_KEY,
  }),
)
