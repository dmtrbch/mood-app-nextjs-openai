import { prisma } from '@/utils/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

//This page servers like a webhook that is called from clerk after the user is signed in (or replacement for it)

const createNewUser = async () => {
  const user = await currentUser()
  const match = await prisma.user.findUnique({
    where: {
      clerkId: user.id as string,
    },
  })

  // Means this is a brand new user
  if (!match) {
    await prisma.user.create({
      data: {
        clerkId: user.id,
        email: user?.emailAddresses[0].emailAddress
      }
    })
  }

  redirect('/journal')
}

const NewUser = async () => {
  await createNewUser()
  return <div>...loading</div>
}

export default NewUser