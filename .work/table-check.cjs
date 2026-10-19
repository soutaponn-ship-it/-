require('dotenv').config();
const {Client}=require('pg');
const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
c.connect().then(()=>c.query("select table_name from information_schema.tables where table_schema='public' order by table_name")).then(r=>{console.log(r.rows.map(x=>x.table_name).join('\n'));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})
