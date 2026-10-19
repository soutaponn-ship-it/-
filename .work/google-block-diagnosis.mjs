const first=await fetch('https://nucbox-m3plus.tail354684.ts.net/api/auth/google',{redirect:'manual'});
const location=first.headers.get('location');
console.log('app_status='+first.status);
console.log('oauth_url='+location);
const google=await fetch(location);
const text=await google.text();
console.log('google_status='+google.status);
console.log(text.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/\s+/g,' ').trim()||'no-title');
console.log(text.match(/アクセス[^<]{0,160}/)?.[0]||text.match(/blocked[^<]{0,160}/i)?.[0]||'no-message');
