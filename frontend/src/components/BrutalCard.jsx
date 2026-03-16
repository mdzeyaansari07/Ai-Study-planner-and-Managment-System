import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const BrutalCard = ({ title, subtitle, className = "", cardTestId, children }) => {
  return (
    <Card className={`brutal-card bg-white ${className}`} data-testid={cardTestId}>
      {(title || subtitle) && (
        <CardHeader className="space-y-2 p-6">
          {title ? (
            <CardTitle className="text-xl text-[#18181b]" data-testid={`${cardTestId}-title`}>
              {title}
            </CardTitle>
          ) : null}
          {subtitle ? (
            <p className="text-sm text-zinc-700" data-testid={`${cardTestId}-subtitle`}>
              {subtitle}
            </p>
          ) : null}
        </CardHeader>
      )}
      <CardContent className="p-6 pt-0">{children}</CardContent>
    </Card>
  );
};
