import { useEffect } from "react";

const REPLACEABLE_INPUT_TYPES = new Set([
  "",
  "email",
  "number",
  "search",
  "tel",
  "text",
  "url"
]);

function isReplaceableInput(
  target: EventTarget | null
): target is HTMLInputElement | HTMLTextAreaElement {
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (target.readOnly || target.disabled) {
    return false;
  }

  if (target.dataset.replaceOnFocus === "false") {
    return false;
  }

  if (target instanceof HTMLTextAreaElement) {
    return target.value.length > 0;
  }

  if (!REPLACEABLE_INPUT_TYPES.has(target.type)) {
    return false;
  }

  return target.value.length > 0;
}

export function useReplaceInputTextOnFocus() {
  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      if (!isReplaceableInput(event.target)) {
        return;
      }

      window.setTimeout(() => {
        const target = event.target;

        if (!isReplaceableInput(target) || document.activeElement !== target) {
          return;
        }

        target.select();
      }, 0);
    }

    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);
}
