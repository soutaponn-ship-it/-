require('dotenv').config();
const {Client}=require('pg');
(async()=>{
const email='auth-check-'+Date.now()+'@example.com';
const login=await fetch('http://127.0.0.1:3000/api/trpc/auth.localLogin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({json:{email,name:'認証確認'}})});
const cookies=login.headers.getSetCookie ? login.headers.getSetCookie() : [login.headers.get('set-cookie')].filter(Boolean);
console.log('login_status='+login.status+' cookie='+Boolean(cookies[0]));
console.log((await login.text()).slice(0,180));
const cookie=cookies.map(v=>v.split(';')[0]).join('; ');
const me=await fetch('http://127.0.0.1:3000/api/trpc/auth.me',{headers:{cookie}});
console.log('me_status='+me.status);
console.log((await me.text()).slice(0,260));
const c=new Client({connectionString:process.env.DATABASE_URL});
await c.connect(); await c.query('delete from users where email=$1',[email]); await c.end();
})();
