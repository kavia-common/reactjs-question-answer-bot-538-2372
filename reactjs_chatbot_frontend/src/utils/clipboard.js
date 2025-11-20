 // PUBLIC_INTERFACE
 export async function safeCopyToClipboard(text) {
   /**
    * Attempt to copy text to the clipboard using:
    * 1) navigator.clipboard.writeText (async, may be blocked by permissions policy)
    * 2) Fallback: execCommand('copy') on a temporary textarea
    *
    * Returns:
    * - true on success
    * - false on failure (never throws)
    *
    * Notes:
    * - Always wraps calls in try/catch to avoid unhandled promise rejections.
    * - Gracefully degrades in sandboxed/preview environments.
    */
   const str = text == null ? "" : String(text);

   // Try modern async clipboard API
   try {
     if (
       typeof navigator !== "undefined" &&
       navigator.clipboard &&
       typeof navigator.clipboard.writeText === "function"
     ) {
       await navigator.clipboard.writeText(str);
       return true;
     }
   } catch {
     // Swallow errors; will try fallback below
   }

   // Fallback to a temporary textarea + execCommand('copy')
   try {
     if (typeof document !== "undefined") {
       const ta = document.createElement("textarea");
       ta.value = str;
       // Ensure not visible and not disrupting layout
       ta.setAttribute("readonly", "");
       ta.style.position = "fixed";
       ta.style.top = "-9999px";
       ta.style.left = "-9999px";
       document.body.appendChild(ta);
       ta.select();
       ta.setSelectionRange(0, ta.value.length);
       let copied = false;
       try {
         copied = document.execCommand("copy");
       } catch {
         copied = false;
       }
       document.body.removeChild(ta);
       if (copied) return true;
     }
   } catch {
     // ignore
   }

   return false;
 }

 // PUBLIC_INTERFACE
 export function showInlineToast(message, durationMs = 2000) {
   /**
    * Shows a small, non-intrusive inline toast message near the bottom of the viewport.
    * Automatically disappears after durationMs.
    * This function is safe in preview/sandbox; failures are swallowed.
    */
   try {
     if (typeof document === "undefined") return;

     const id = "inline-toast";
     let el = document.getElementById(id);
     if (!el) {
       el = document.createElement("div");
       el.id = id;
       el.className = "inline-toast";
       document.body.appendChild(el);
     }
     el.textContent = message || "Notice";
     el.style.opacity = "1";
     // Force reflow then add visible class for transition
     // eslint-disable-next-line no-unused-expressions
     el.offsetHeight; 
     el.classList.add("visible");

     window.clearTimeout(el._hideTimer);
     el._hideTimer = window.setTimeout(() => {
       try {
         el.classList.remove("visible");
         // small delay to allow fade-out
         window.setTimeout(() => {
           if (el && el.parentNode) el.parentNode.removeChild(el);
         }, 300);
       } catch {
         // ignore
       }
     }, Math.max(800, durationMs || 0));
   } catch {
     // ignore any DOM issues silently
   }
 }
