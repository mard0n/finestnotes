import { generateFragment, GenerateFragmentStatus } from "./fragment-generation-utils.js";

type StatusType = (typeof GenerateFragmentStatus)[keyof typeof GenerateFragmentStatus];

const StatusMessages: Record<StatusType, string> = {
  [GenerateFragmentStatus.SUCCESS]: '🎉 A text fragment link was successfully created.',
  [GenerateFragmentStatus.INVALID_SELECTION]: '❌ The selected text is too short or does not contain enough valid words. Please choose a longer or more specific phrase.',
  [GenerateFragmentStatus.AMBIGUOUS]: '❌ The selected text appears multiple times on this page and no unique link could be created. Try selecting a different text segment.',
  [GenerateFragmentStatus.TIMEOUT]: '⏳ The process took too long. This may be due to a large page size or slow browser performance. Try selecting a different text segment.',
  [GenerateFragmentStatus.EXECUTION_FAILED]: '⚠️ An unexpected error occurred while generating the link.',
} as const;

function createTextFragment(selection: Selection): string {
  console.log("selection", selection);
  const result = generateFragment(selection) as unknown as { status: StatusType; fragment?: any };
  console.log('Text fragment generation result:', result);

  let url = `${location.origin}${location.pathname}${location.search}${location.hash ? location.hash : '#'
    }`;
  if (result.status === GenerateFragmentStatus.SUCCESS && result.fragment) {
    const fragment = result.fragment;
    const prefix = fragment.prefix
      ? `${encodeURIComponent(fragment.prefix)}-,`
      : '';
    const suffix = fragment.suffix
      ? `,-${encodeURIComponent(fragment.suffix)}`
      : '';
    const textStart = encodeURIComponent(fragment.textStart);
    const textEnd = fragment.textEnd
      ? `,${encodeURIComponent(fragment.textEnd)}`
      : '';
    url = `${url}:~:text=${prefix}${textStart}${textEnd}${suffix}`;
    return url;
  } else {
    let error = StatusMessages[result.status]
    throw new Error(error);
  }
};

export { createTextFragment };