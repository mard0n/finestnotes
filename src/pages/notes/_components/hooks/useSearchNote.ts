import type { NoteType } from "@server/utils/normalizers";

export const useNoteSearch = (
  notes: NoteType[] | undefined,
  searchValue: string
) => {
  if (!notes || !searchValue.trim()) return notes;

  const query = searchValue.trim().toLowerCase();
  return notes.filter((note) => {
    const titleMatch = note.title.toLowerCase().includes(query);
    const contentMatch =
      note.type === "note"
        ? note.content?.toLowerCase().includes(query)
        : note.description?.toLowerCase().includes(query);
    return titleMatch || contentMatch;
  });
};
