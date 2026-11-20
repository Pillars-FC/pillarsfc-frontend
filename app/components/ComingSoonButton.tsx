"use client";

import { useId, useRef, type MouseEvent, type ReactNode } from "react";

export default function ComingSoonButton({
  children,
  className,
  onClose,
}: {
  children: ReactNode;
  className: string;
  onClose?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      dialogRef.current?.close();
    }
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className={className}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={closeOnBackdrop}
        onClose={onClose}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border-0 bg-white p-8 text-[#071b33] shadow-2xl backdrop:bg-[#071b33]/75 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-extrabold tracking-[.16em] text-[#075aa6]">
              PILLARS FC SHOP
            </p>
            <h2
              id={titleId}
              className="mt-2 font-condensed text-4xl font-black uppercase"
            >
              Coming soon
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close shop notice"
            onClick={() => dialogRef.current?.close()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
          >
            &times;
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          We&apos;re getting the official club shop ready. Check back soon for
          Pillars FC kits, training wear, and merchandise.
        </p>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="mt-6 bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238]"
        >
          GOT IT
        </button>
      </dialog>
    </>
  );
}
