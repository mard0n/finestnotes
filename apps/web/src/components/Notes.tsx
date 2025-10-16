import { client } from "@utils/api";
import {
  parseResponse,
  type InferRequestType,
  type InferResponseType,
} from "hono/client";
import { createEffect, createResource, For, createSignal, createMemo, Show } from "solid-js";
import NoteEditor from "./NoteEditor";

type Collections = InferResponseType<typeof client.api.collections.$get>;

function Notes({ collections }: { collections: Collections }) {
  const [activeFilter, setActiveFilter] = createSignal<'all' | 'public'>('all');
  const [selectedNoteId, setSelectedNoteId] = createSignal<number | null>(null);

  if (!collections) {
    return <div>No collections</div>;
  }

  // Filter collections based on active filter
  const filteredCollections = createMemo(() => {
    setSelectedNoteId(null)
    if (activeFilter() === 'public') {
      // Filter collections that have public property set to true
      return collections.filter((item: any) => item.public === true);
    }
    return collections;
  });

  const selectedNote = createMemo(() => collections.find(collection => collection.id === selectedNoteId()))

  const handlePublicFilter = () => {
    setActiveFilter('public');
  };

  const handleAllNotesFilter = () => {
    setActiveFilter('all');
  };

  const handleNoteSelection = (id: number) => {
    setSelectedNoteId(id)
  }

  return (
    <main class="flex gap-4">
      <aside class="w-1/12">
        <ul>
          <li
            onClick={handleAllNotesFilter}
            class={`cursor-pointer ${activeFilter() === 'all' ? 'font-bold text-blue-600' : 'hover:text-gray-600'}`}
          >
            Notes
          </li>
          <li>
            <ul>
              <li
                onClick={handlePublicFilter}
                class={`cursor-pointer ${activeFilter() === 'public' ? 'font-bold text-blue-600' : 'hover:text-gray-600'}`}
              >
                Public
              </li>
            </ul>
          </li>
        </ul>
      </aside>
      <aside class="w-2/12">
        <For each={filteredCollections()} fallback={
          <>No notes with {activeFilter} property </>
        }>{(item, index) => <div class="cursor-pointer" onClick={[handleNoteSelection, item.id]}>{item.title}</div>}</For>
      </aside>
      <article>
        <Show when={selectedNote()} fallback={
          <>Select a note</>
        }>
          <h1>
            {selectedNote()!.title}
          </h1>
        </Show>
      </article>
    </main>
  );
}

export default Notes;
