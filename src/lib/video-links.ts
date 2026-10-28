/** FR-20: chỉ nhận YouTube và Vimeo, chuyển thành liên kết nhúng. */
export function parseVideoLink(input: string): { source: "youtube" | "vimeo"; embedUrl: string } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const id11 = /^[\w-]{11}$/;

  if (host === "youtube.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = /^\/(?:shorts|embed|live)\/([\w-]+)/.exec(url.pathname);
      id = m?.[1] ?? null;
    }
    return id && id11.test(id) ? { source: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /\/(?:video\/)?(\d{6,12})(?:$|\/)/.exec(url.pathname);
    return m ? { source: "vimeo", embedUrl: `https://player.vimeo.com/video/${m[1]}` } : null;
  }
  return null;
}
