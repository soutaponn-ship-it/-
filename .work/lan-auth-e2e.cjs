require('dotenv').config();
(async()=>{
const email='lan-auth-check-'+Date.now()+'@example.com';
const base='http://192.168.68.59:3000';
const login=await fetch(base+'/api/trpc/auth.localLogin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({json:{email,name:'LAN確認'}})});
const cookies=login.headers.getSetCookie ? login.headers.getSetCookie() : [login.headers.get('set-cookie')].filter(Boolean);
console.log('login_status='+login.status+' cookie='+Boolean(cookies[0]));
console.log('set_cookie='+String(cookies[0]).slice(0,180));
const cookie=cookies.map(v=>v.split(';')[0]).join('; ');
const me=await fetch(base+'/api/trpc/auth.me',{headers:{cookie}});
console.log('me_status='+me.status+' body='+(await me.text()).slice(0,220));
})();
