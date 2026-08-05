// Google Drive এবং Imgur-এর সাধারণ "শেয়ার লিংক" গুলো সরাসরি <img> এ দেখানো যায় না।
// এই ফাংশনটা সেই লিংকগুলো স্বয়ংক্রিয়ভাবে সরাসরি-দেখানো-যায় এমন ফরম্যাটে রূপান্তর করে।
export function toDirectImageUrl(url) {
  if (!url) return url;
  const trimmed = url.trim();

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view?...  বা  ...open?id=FILE_ID
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/);
  const driveId = driveFileMatch?.[1] || driveOpenMatch?.[1];
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // Imgur পেজ লিংক (imgur.com/xxxx) -কে সরাসরি ইমেজ লিংকে (i.imgur.com/xxxx.jpg) বদলানো
  const imgurPageMatch = trimmed.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/);
  if (imgurPageMatch) {
    return `https://i.imgur.com/${imgurPageMatch[1]}.jpg`;
  }

  return trimmed;
}
