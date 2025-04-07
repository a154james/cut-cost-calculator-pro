
import { Card, CardContent } from "@/components/ui/card";

interface ResultCardProps {
  label: string;
  value: string;
}

const ResultCard = ({ label, value }: ResultCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-muted px-4 py-2 text-center">
          <p className="text-sm font-medium">{label}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
