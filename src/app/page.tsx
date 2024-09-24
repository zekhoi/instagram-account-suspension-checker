"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Result = {
  username: string;
  suspended: boolean | null;
  error?: string;
  status?: number;
};

type FilterStatus = "all" | "active" | "suspended" | "error";

export default function UsernameChecker() {
  const [usernames, setUsernames] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const checkUsername = async (username: string): Promise<Result> => {
    try {
      const response = await fetch("/api/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error("Failed to check username");
      }

      return await response.json();
    } catch (error) {
      console.error(`Error checking username ${username}:`, error);
      return { username, suspended: null, error: "Network error" };
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    setError(null);
    setProgress(0);
    setResults([]);
    const usernameList = usernames.split("\n").filter((u) => u.trim());

    if (usernameList.length === 0) {
      setError("Please enter at least one username.");
      setIsChecking(false);
      return;
    }

    const totalUsernames = usernameList.length;
    let checkedUsernames = 0;

    await Promise.all(
      usernameList.map(async (username) => {
        const result = await checkUsername(username.trim());
        setResults((prev) => [...prev, result]);
        checkedUsernames++;
        setProgress((checkedUsernames / totalUsernames) * 100);
      })
    );

    setIsChecking(false);
  };

  const filteredResults = results.filter((result) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return result.suspended === false;
    if (filterStatus === "suspended") return result.suspended === true;
    if (filterStatus === "error") return result.suspended === null;
    return true;
  });

  const suspendedCount = results.filter((r) => r.suspended === true).length;
  const activeCount = results.filter((r) => r.suspended === false).length;
  const errorCount = results.filter((r) => r.suspended === null).length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Instagram Username Checker</CardTitle>
        <CardDescription>
          Enter usernames (one per line) to check for suspension
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter usernames here..."
          value={usernames}
          onChange={(e) => setUsernames(e.target.value)}
          className="min-h-[200px]"
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button onClick={handleCheck} disabled={isChecking}>
          {isChecking ? "Checking..." : "Check Usernames"}
        </Button>
        {isChecking && (
          <div className="w-full">
            <Progress value={progress} className="w-full" />
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {results.length > 0 && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Results:</h3>
                <p className="text-sm text-muted-foreground">
                  Total: {results.length} | Active: {activeCount} | Suspended:{" "}
                  {suspendedCount} | Error: {errorCount}
                </p>
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value: FilterStatus) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-md">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky top-0 bg-background">
                        Status
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background">
                        Username
                      </TableHead>
                      <TableHead className="text-right sticky top-0 bg-background">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {result.suspended === true && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.suspended === false && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {result.suspended === null && (
                            <HelpCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {result.username}
                          {result.error && (
                            <span className="text-sm text-muted-foreground ml-2">
                              Error: {result.error}
                              {result.status && ` (Status: ${result.status})`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`https://www.instagram.com/${result.username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-end gap-1 hover:underline"
                          >
                            View Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
