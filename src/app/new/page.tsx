import { redirect } from 'next/navigation'

export default function NewPage() {
  redirect('/discover?sort=newest')
}
