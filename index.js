let express = require('express')
const cookieParser = require('cookie-parser');
let app  = express()
let sqlite = require('sqlite3')
let db = new sqlite.Database('db.db')
let month = 24*3600*30*1000
app.use(express.static('public',{index: false}))
app.use('/axios', express.static('./node_modules/axios/dist'));
app.use(express.json({extended:false}))
app.use(cookieParser());
app.post('/shortUrl',async (req,res)=>{
    let host = req.protocol +'://'+ req.get('host')+'/'
  
    if(req.body.login){ //if user is logged in 
        
        var temp =await insertUrl_login(req.body.original_url, req.body.desired_url, req.body.login)
    }else{
        var temp =await insertUrl(req.body.original_url)
    }
   
   if(temp.success){
    temp.success=host+temp.success
    res.send(temp)
    

   }else{
    res.send(temp)
    
   }


    
})
app.get('/',(req,res)=>{
    if(req.cookies.auth_token){
    res.redirect('/profile')
    return
    }
    res.sendFile(__dirname+'/public/index.html')
})
app.get('/profile',(req,res)=>{
        if(!req.cookies.auth_token){
            return  res.redirect('/')
            
        }
    res.sendFile(__dirname+'/public/profile.html')
})


app.get('/:url',(req,res)=>{
db.get(`select * from urls where shortUrl=?`,[req.params.url],(err,data)=>{
    if(data == undefined) return res.sendStatus(404) // if shorturl does not exist
    if(data.user == null) return  res.redirect(data.originalUrl) // if link does not belongs to registered user no need to keep track of visitors (noone will be able to see anyway)
    if(!req.cookies.visitor_token){ //unique visitor for all existing urls, this user comes first time to whole API
        let visitor_token
        let gen_visitor_token = function(){ // generate visitor token, if it exists in database generate new one;
          visitor_token = genUrl(15)
          db.get('SELECT EXISTS(select * from tokens where visitor_token=?) as response',[visitor_token],(err,data)=>{
              if (err) return
              if(data.response==0){
                db.run('INSERT INTO tokens VALUES(?,?)',[data.ID,visitor_token])
                res.cookie('visitor_token',visitor_token, { maxAge: month });
              } else{
                  gen_visitor_token()
              }
          })
        }
        gen_visitor_token()
        
        db.run('UPDATE urls set total_visitors=total_visitors + 1,unique_visitors=unique_visitors + 1 where shortUrl=?',[req.params.url]) //increment total and unique visitor count
    }else{ // not unique visitor for at least one url and we should find out if visited url is this particular one (request)
        db.get('SELECT urls.originalUrl,tokens.visitor_token from urls,tokens where shortUrl = ? AND tokens.visitor_token=? AND urls.ID=tokens.urlID;',[req.params.url,req.cookies.visitor_token],(err,data2)=>{
            if(data2){ //if we find anything means this user has visited this url so not unique for this url we should increase only total visits
                db.run('UPDATE urls set total_visitors=total_visitors + 1 where shortUrl=?',[req.params.url])
            }else{ //if nothing is in response from db means this visitor is unique for this particular url, we should increase both total and unique visitor count
                db.run('INSERT INTO tokens VALUES(?,?)',[data.ID,req.cookies.visitor_token])
                db.run('UPDATE urls set total_visitors=total_visitors + 1,unique_visitors=unique_visitors + 1 where shortUrl=?',[req.params.url]) // increment both total and unique visitor count
            }
        })
        
    }
    return res.redirect(data.originalUrl)

})

})

app.post('/login',(req,res)=>{
    let auth_token = genUrl(15)
    db.run('UPDATE users set auth_token=? WHERE username=? AND password=?',[auth_token,req.body.userName,req.body.password],function(){
        if(this.changes>0){ //if we updated something means entry exists! and no need for first checking and then inserting
            
            res.cookie('auth_token',auth_token, { maxAge: month });
            res.cookie('username',req.body.userName, { maxAge: month });
            res.send(true) // send 
        }else{
            res.send(false)
        }
    })
 


})

app.post('/register',(req,res)=>{
    db.get('SELECT EXISTS(select username from users where username==?) as response',[req.body.userName],(err,status)=>{
        if(status.response){

            return res.send({error:'username already exists'})
            
        }
        db.run('INSERT INTO users VALUES(?,?,?,?)',[null,req.body.userName,req.body.password,null],(err,data)=>{
            if(err) return
            return res.send('Registered')
            
        })


    })
    


})




app.post('/getMyUrls',(req,res)=>{
    db.all('SELECT originalUrl,shortUrl,unique_visitors,total_visitors,urls.ID FROM urls,users where users.auth_token=? AND users.username=urls.user',[req.cookies.auth_token],(err,data)=>{
        res.send(data)
    })
})

app.post('/deleteUrl',(req,res)=>{
    db.run('DELETE from urls WHERE ID=?',[req.body.ID],(err,data)=>{
        if (err) return res.sendStatus(500)
        res.send('Deleted')
    })


})



app.listen(5000)

function genUrl(length){
    let codeset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let res  =''
    for (let i = 0; i < length; i++) {
        res += codeset[Math.floor(Math.random()*61 )]  
        
    }
    return res

}

async function  insertUrl (original_url) {
    if(original_url == '') return
    let shortUrl = genUrl(7)

    return await new Promise((resolve,reject)=>{
        db.get(`select originalUrl,shortUrl,user from urls where (shortUrl=? or originalUrl=?) AND user is NULL`,[shortUrl,original_url],(err,data)=>{ // if original url already exists but belongs to registered user create new one
            
            if(data==undefined){   //if none of urls are in database nor short or original and user is NULL means even if original url exists in database but belongs to registered user we need to create new one to preserve their private url statistics.

                
                db.run('insert into urls values(?,?,?,?,?,?)',[null,original_url,shortUrl,0,0,null])
                return resolve({success:shortUrl})
    
            }else{
                  // if  original url exists in database, but does not belong to registered user return already shortened url
                if(original_url == data.originalUrl){ 
                    return resolve({success:data.shortUrl})
                }
                 // if short url is in database, call function again and generate new one;
                insertUrl(original_url)
                return 
            }
        } )
    })
    
    
}

async function  insertUrl_login(original_url,desired_url,username) {
    if(original_url == '' || desired_url=='') return

  return await new Promise((resolve,reject)=>{
    db.get('SELECT * FROM urls WHERE shortUrl=?',[desired_url], (err,data)=>{
        
        if(data){ //if short url already exists in DB
           
            return resolve({error:'url already exists'})

        }else{
            db.run('INSERT INTO urls VALUES(?,?,?,?,?,?)',[null,original_url,desired_url,0,0,username],()=>{
                return resolve({success:desired_url})
            })
        }

    } )




  })
    
}