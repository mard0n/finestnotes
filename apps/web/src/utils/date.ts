export function formatDate(createdAt: Date | string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 7 days: show relative time
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 14) return "1w";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;

  // Older: show formatted date
  const year = date.getFullYear();
  const currentYear = now.getFullYear();

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(year !== currentYear && { year: "numeric" }),
  };

  return date.toLocaleDateString("en-GB", options);
}
