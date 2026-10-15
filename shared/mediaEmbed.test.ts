import assert from "node:assert/strict";
import test from "node:test";
import { getMediaEmbed, isDirectMediaFileUrl } from "./mediaEmbed";

test("getMediaEmbed recognizes common YouTube URL shapes", () => {
  const cases = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/live/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  ];
  for (const url of cases) {
    const embed = getMediaEmbed(url);
    assert.ok(embed, `expected embed for ${url}`);
    assert.match(embed!.src, /dQw4w9WgXcQ/);
  }
});

test("getMediaEmbed recognizes Vimeo and SoundCloud", () => {
  assert.match(
    getMediaEmbed("https://vimeo.com/123456789")!.src,
    /player\.vimeo\.com\/video\/123456789/,
  );
  assert.match(
    getMediaEmbed("https://player.vimeo.com/video/987654321")!.src,
    /987654321/,
  );
  const sc = getMediaEmbed("https://soundcloud.com/artist/track-name");
  assert.ok(sc?.src.includes("w.soundcloud.com"));
});

test("getMediaEmbed returns null for non-embeddable page links", () => {
  assert.equal(getMediaEmbed("https://drive.google.com/file/d/abc/view"), null);
  assert.equal(getMediaEmbed("/media-files/abc.mp4"), null);
});

test("isDirectMediaFileUrl detects file extensions", () => {
  assert.equal(isDirectMediaFileUrl("https://cdn.example.com/clip.mp4"), true);
  assert.equal(isDirectMediaFileUrl("/media-files/uuid.mov"), true);
  assert.equal(isDirectMediaFileUrl("https://youtube.com/watch?v=abc"), false);
});
