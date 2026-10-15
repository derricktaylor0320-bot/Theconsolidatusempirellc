export type MediaEmbed = { kind: "iframe"; src: string };

/** YouTube watch, Shorts, Live, embed, and youtu.be links. */
function matchYouTube(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }

    const isYoutube =
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com";

    if (!isYoutube) return null;

    const path = parsed.pathname;
    const segments = path.split("/").filter(Boolean);

    if (segments[0] === "watch") {
      const id = parsed.searchParams.get("v");
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
      const id = segments[1];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

function matchVimeo(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const videoIdx = segments[0] === "video" ? 1 : 0;
    const id = segments[videoIdx];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Map a public media URL to an embeddable iframe src when we recognize the host. */
export function getMediaEmbed(url: string): MediaEmbed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytId = matchYouTube(trimmed);
  if (ytId) {
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`,
    };
  }

  const vimeoId = matchVimeo(trimmed);
  if (vimeoId) {
    return {
      kind: "iframe",
      src: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (/soundcloud\.com\//i.test(trimmed)) {
    return {
      kind: "iframe",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        trimmed,
      )}&color=%23d4af37&auto_play=false&hide_related=true&show_comments=false`,
    };
  }

  return null;
}

const DIRECT_MEDIA_EXT =
  /\.(mp4|webm|mov|mkv|mpeg|mpg|3gp|m4v|mp3|m4a|wav|ogg|weba|aac|flac)(\?|$)/i;

/** True when the URL likely points at a direct media file (not a web page). */
export function isDirectMediaFileUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  let pathPart = trimmed.split("?")[0]!;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathPart = new URL(trimmed).pathname;
    } catch {
      return false;
    }
  }

  return DIRECT_MEDIA_EXT.test(pathPart.toLowerCase());
}
