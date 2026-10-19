const r=await fetch('https://nucbox-m3plus.tail354684.ts.net/api/auth/google',{redirect:'manual'});
const u=new URL(r.headers.get('location'));
console.log('status='+r.status+' redirect_uri='+u.searchParams.get('redirect_uri'));
