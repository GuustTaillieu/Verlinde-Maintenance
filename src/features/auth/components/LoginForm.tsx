import { cn } from "cn"
import { Button } from "#/features/shared/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/features/shared/components/ui/card.tsx"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "#/features/shared/components/ui/field.tsx"
import { Input } from "#/features/shared/components/ui/input.tsx"
import { Link } from "@tanstack/react-router"
import type { SubmitEventHandler } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { useLogin } from "../hooks/useLogin"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { email, setEmail, password, setPassword, error, isLoading, login } = useLogin()

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault()
    void login()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Inloggen</CardTitle>
          <CardDescription>
            Vul uw e-mailadres en wachtwoord in om toegang te krijgen tot het platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/15 text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">E-mailadres</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@verlinde-beveiliging.be"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Wachtwoord</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Wachtwoord vergeten?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inloggen...
                    </>
                  ) : (
                    'Inloggen'
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

