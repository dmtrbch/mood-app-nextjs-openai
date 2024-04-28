import Editor from '@/components/Editor'
import { getUserByClerkId } from '@/utils/auth'
import { prisma } from '@/utils/db'

const getEntry = async (id: string) => {
  const user = await getUserByClerkId()
  const entry = await prisma.journalEntry.findUnique({
    where: {
      // if we don't check for the user id we can introduce security vulnerability in our app
      // since everyone can check the entry for a particular id
      userId_id: {
        userId: user.id,
        id,
      },
    },
    // join table in sql, population in mongo
    include: {
      analysis: true,
    },
  })

  return entry
}

// we can pass props from server components to client components
// they just have to be serializable Journal Details Page ==> Editor entry prop
const EntryPage = async ({ params }) => {
  const entry = await getEntry(params.id)
  return <div className="h-full w-full">
    <Editor entry={entry} />
  </div>
}

export default EntryPage