import type { client } from '@utils/api';
import type { User } from 'better-auth';
import type { InferResponseType } from 'hono/client';
import React from 'react';

type Collections = InferResponseType<typeof client.api.collections.$get>;

const Notes: React.FC<{ collections: Collections, user: User }> = ({ collections, user }) => {
  const [filterCategory, setFilterCategory] = React.useState<'private' | 'public' | 'all'>('all');
  const [selectedNote, setSelectedNote] = React.useState<number | null>(null);

  const calculateTitle = () => {
    switch (filterCategory) {
      case 'all':
        return 'All notes';
      case 'private':
        return 'Private notes';
      case 'public':
        return 'Public notes';
      default:
        return 'Notes';
    }
  };

  const handleNoteSelection = (noteId: number) => {
    console.log('Selected note ID:', noteId);
    if (selectedNote === noteId) {
      setSelectedNote(null);
      return;
    }
    setSelectedNote(noteId);
  }

  return (
    <>
      <nav
        className="flex items-stretch border-b border-neutral-200"
      >
        <div className="w-xs border-r border-neutral-200 pl-8 pr-6 py-4 flex items-center">
          <a href="/" className="">Finest</a>
        </div>
        <div className='w-sm border-r border-neutral-200 px-6 py-4 flex gap-3 items-center justify-between'>
          <label className="input input-ghost !outline-offset-0 w-full rounded-full bg-white">
            <svg
              className="h-[1.2em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="#4A4846"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input type="search" name="search" className="grow" placeholder="Search" />
          </label>
          <button title="Create a new note">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#4A4846" className="size-6 cursor-pointer">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        <div className="flex grow gap-10 items-center justify-end px-8 py-4">
          {
            !!user ? (
              <>
                <a href="/notes">my notes</a>
                <div className="dropdown dropdown-hover dropdown-end">
                  <span tabIndex={0} role="link" className="m-1">
                    {user.name}
                  </span>
                  <div className="dropdown-content menu  z-1 w-52 p-2">
                    <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                      <li>
                        <a href="/notes">My notes</a>
                      </li>
                      <li>
                        <a href="https://chromewebstore.google.com/">
                          Browser Extension
                        </a>
                      </li>
                      <li>
                        <a href="/settings">Settings</a>
                      </li>
                      <li>
                        <a id="signout">
                          Sign out
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <>
                <a href="/login">Login</a>
              </>
            )
          }
        </div>
      </nav>
      <main className='grow flex items-stretch'>
        <div className='w-xs pl-8 pr-6 py-6 border-r border-neutral-200'>
          <ul>
            <li>
              <button
                onClick={() => setFilterCategory('all')}
                className={`text-md cursor-pointer hover:text-black w-full text-left ${filterCategory === 'all' ? 'font-medium text-black' : 'font-normal'}`}
              >All notes</button>
              <ul className="flex flex-col gap-2 ml-5 mt-3">
                <li>
                  <button
                    onClick={() => setFilterCategory('public')}
                    className={`text-sm cursor-pointer hover:text-black w-full text-left ${filterCategory === 'public' ? 'font-medium text-black' : 'font-normal'}`}
                  >
                    Public notes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setFilterCategory('private')}
                    className={`text-sm cursor-pointer hover:text-black w-full text-left ${filterCategory === 'private' ? 'font-medium text-black' : 'font-normal'}`}
                  >
                    Private notes
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div className='w-sm py-6 border-r border-neutral-200'>
          <h1 className='font-medium text-xl mb-6 px-6'>{calculateTitle()}</h1>
          <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200"/>
          <ul className='space-y-4 list'>
            {
              collections.length === 0 ? (
                <p className='text-sm text-gray-content px-6'>No notes found.</p>
              ) : (
                collections.map((collection) => (
                  <li 
                    key={collection.id} 
                    className={`list-row mb-0 after:inset-x-0 after:border-neutral-200 rounded-none px-6 py-3 hover:bg-white/50 cursor-pointer ${selectedNote === collection.id ? 'bg-white' : ''}`} 
                    onClick={() => handleNoteSelection(collection.id)}
                  >
                    <div className="block">
                      <h2 className='font-medium text-black line-clamp-1'>{collection.title || 'Untitled'}</h2>
                      <p className='text-sm text-gray-content mt-1 line-clamp-1'>Y Combinator encourages founders to focus on growth rate rather than absolute numbers. </p>
                      <p className='text-xs text-gray-content mt-1.5'><span>{collection.createdAt}</span> · <span>{collection.user.name}</span> </p>
                    </div>
                  </li>
                ))
              )
            }
          </ul>
          <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200"/>
        </div>
        <div className='grow px-8 py-6'></div>
      </main>
    </>
  );
};

export default Notes;