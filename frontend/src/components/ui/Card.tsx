import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
