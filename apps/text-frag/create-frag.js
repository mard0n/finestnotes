import { generateFragment, GenerateFragmentStatus } from './fragment-generation-utils.js';

function createTextFragment(selection) {
  console.log("selection", selection);
  const result = generateFragment(selection)
  console.log('Text fragment generation result:', result);

  let url = `${location.origin}${location.pathname}${location.search}${location.hash ? location.hash : '#'
    }`;
  if (result.status === GenerateFragmentStatus.SUCCESS && result.fragment) {
    const fragment = result.fragment;
    console.log("fragment", fragment);
    const prefix = fragment.prefix
    ? `${encodeURIComponent(fragment.prefix)}-,`
    : '';
    console.log("prefix", prefix);
    const suffix = fragment.suffix
      ? `,-${encodeURIComponent(fragment.suffix)}`
      : '';
    console.log("suffix", suffix);
    const textStart = encodeURIComponent(fragment.textStart);
    console.log("textStart", textStart);
    const textEnd = fragment.textEnd
      ? `,${encodeURIComponent(fragment.textEnd)}`
      : '';
    console.log("textEnd", textEnd);
    url = `${url}:~:text=${prefix}${textStart}${textEnd}${suffix}`;
    return url;
  } else {
    throw new Error("Failed to create text fragment");
  }
};

export { createTextFragment };