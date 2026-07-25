import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon } from "lucide-react";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Showing results for: <span className="text-foreground font-bold">"{q || ""}"</span>
        </p>
      </div>

      <Card className="min-h-[400px] flex flex-col items-center justify-center border-dashed border-border/50 bg-background/50">
        <CardContent className="flex flex-col items-center justify-center text-center p-6 pt-10">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <SearchIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">No exact matches found</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            We couldn't find any agent traces or specific metrics matching "{q}". 
            Try adjusting your search terms or using an exact trace ID.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
