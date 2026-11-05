import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Not Implemented to make the app limited in scope</div>
}
