import { OpenAI } from '@langchain/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import z from 'zod'
import { PromptTemplate } from 'langchain/prompts'
import { Document } from 'langchain/document'
import { loadQARefineChain } from 'langchain/chains'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    sentimentScore: z.number().describe(
      'sentiment of the text and rated on a scale from -10 to 10, where -10 is extremely negative, 0 is neutral, and 10 is extremely positive.'
    ),
    mood: z.string().describe('the mood of the person who wrote the journal entry.'),
    subject: z.string().describe('the subject of the journal entry.'),
    summary: z.string().describe('quick summary of the entire entry.'),
    negative: z.boolean().describe('is the journal entry negative? (i.e. does it contain negative emotions?).'),
    color: z.string().describe('a hexadecimal color code that represents the mood of the entry. Example #0101fe for blue representing happiness.'),
  })
)

const getPrompt = async (content) => {
  // creating the prompt for us, in much better format that we can
  const format_instructions = parser.getFormatInstructions()

  const prompt = new PromptTemplate({
    template:
      'Analyze the following journal entry. Follow the instructions and format your response to match the format instructions, no matter what! \n{format_instructions}\n{entry}',
    inputVariables: ['entry'],
    partialVariables: { format_instructions },
  })

  const input = await prompt.format({
    entry: content,
  })

  console.log(input)
  return input
}

export const analyze = async (content) => {
  const input = await getPrompt(content)
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })
  const result = await model.invoke(input)

  console.log(result)

  try {
    return parser.parse(result)
  } catch (e) {
    console.log(e)
  }
}

export const qa = async (question, entries) => {
  // get the entries turn them into documents
  const docs = entries.map((entry) => {
    return new Document({
      pageContent: entry.content,
      metadata: {id: entry.id, createdAt: entry.createdAt}
    })
  })

  // load up the model
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })
  // create the chain - it allows to chain multiple llm calls together
  // the otuput of one to be the input of another one
  const chain = loadQARefineChain(model)
  // create embeddings (collection of vectors)
  // this is going to make an api call to OpenAI to create an emebedding
  // you send text it sends out vectors
  const embeddings = new OpenAIEmbeddings()
  // create vector store in which we can store everything
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings)
  const relevantDocs = await store.similaritySearch(question) // now we have the entires we need to answer the question
  // we have the relevant docs and we are ready to make the call to the ai
  const res = await chain.invoke({
    input_documents: relevantDocs,
    question,
  })
  return res.output_text
}