import { redirect } from "next/navigation"

export default function PeopleIdRedirect({ params }: { params: { id: string } }) {
  redirect(`/communities/${params.id}`)
}
