export const pluralize = (count: number, singular: string) => 
  `${count} ${count === 1 ? singular : singular + 's'}`;