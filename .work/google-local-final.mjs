const r=await fetch('http://127.0.0.1:3000/api/auth/google',{redirect:'manual'});
const u=new URL(r.headers.get('location'));
console.log('status='+r.status+' redirect_uri='+u.searchParams.get('redirect_uri'));
