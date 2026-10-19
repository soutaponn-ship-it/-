require('dotenv').config();
const {Client}=require('pg');
const u=new URL(process.env.DATABASE_URL);
const regions=['ap-northeast-1','ap-southeast-1','us-west-1','us-east-1','eu-central-1','eu-west-1'];
(async()=>{for(const region of regions){const c=new Client({host:`aws-0-${region}.pooler.supabase.com`,port:5432,user:`postgres.vivhtqgsqlfxebwrfdqr`,password:decodeURIComponent(u.password),database:'postgres',ssl:{rejectUnauthorized:false},connectionTimeoutMillis:7000});try{await c.connect();const r=await c.query('select current_database() as db');console.log('SUCCESS '+region+' '+JSON.stringify(r.rows));await c.end();process.exit(0)}catch(e){console.log('FAIL '+region+' '+(e.code||'')+' '+e.message.replace(/password authentication failed.*/i,'password authentication failed'));try{await c.end()}catch{}}}process.exit(1)})()
