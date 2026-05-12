import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to onepdf</CardTitle>
          <CardDescription>
            shadcn/ui is wired up. Try the form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="flex-1">Sign in</Button>
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
