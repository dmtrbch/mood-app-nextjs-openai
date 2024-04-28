import EntryCard from '@/components/EntryCard'
import NewEntryCard from '@/components/NewEntryCard'
import Question from '@/components/Question'
import { getUserByClerkId } from '@/utils/auth'
import { prisma } from '@/utils/db'
import Link from 'next/link'

const getEntries = async () => {
 const user = await getUserByClerkId()
 const entries = await prisma.journalEntry.findMany({
  where: {
    userId: user.id,
  },
  include: {
    analysis: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
 })

/**WITHOUT THE HELP OF LANGCHAIN */
//  await analyze(`I'm going to give you a journal entry, I want you to analyze
//  it for a few things. I need the mood, a summary, what the subject is, and a
//  color representing the mood. You need to respond back with formatted JSON
//  like so: {"mood": "", "subject": "", "color": "", "negative": ""}.

//  entry:
//  Today was a really great day. I finally was able to grab that pair of shoes I
//  have been dying to get.
//  `)

/**WITH THE HELP OF LANGCHAIN */
// console.log(await analyze(
//   'Today was a eh, ok day I guess.I found a new coffee shop that was cool but then I got a flat tire. :)'
// ))

 return entries
}

const JournalPage = async () => {
  const entries = await getEntries()

  return (
    <div className="p-10 bg-zinc-400/10 h-full">
      <h2 className="text-4xl mb-12">Journal</h2>
      <div className="my-8">
        <Question />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <NewEntryCard />
        {entries.map((entry) => (
          <Link href={`/journal/${entry.id}`} key={entry.id}>
            <EntryCard key={entry.id} entry={entry} />
          </Link>
        ))}
      </div>
    </div>
  ) 
}

export default JournalPage