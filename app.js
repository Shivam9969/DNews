const express = require('express');
const app = express();

const { Client } = require('pg')

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'dnews',
  password: 'root',
  port: 5432,
})

var tdate = new Date().toJSON().slice(0, 10).replace(/-/g, '/');

client.connect();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("view options", { layout: false });

var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser());

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

// a variable to save a session
var sessions;

app.use(express.static(__dirname+'/public'));

app.get('/', function (req, res) {
    res.render('index', { name: 'Jaydeep' });
});

app.post('/render', function (req, res) {
    //registrtaion logic 
    let type=req.body.rtype
    let a=req.body.uname;
    let b=req.body.email;
    let c=req.body.pwd;
    let d=req.body.phno;
    let e=req.body.area;
    let f=req.body.add;
    if(type=='user')
    {   
        try{
            var sql="INSERT INTO genuser(emailid,name,password,phno,area,address) values('" + b + "','" + a + "','" + c + "','" + d + "','" + e + "','" + f + "')";
            client.query(sql, function (err, data) {
                if(err){
                    var ett = "User Already Registered";
                    res.render('signup', { err: ett });
                }
                else{
                    res.render('index', { name: 'Jaydeep' });
                }
            });
        }
        catch
        {
            //
        }
        
    }else
    {
        try{
            var sql1="INSERT INTO venuser(emailid,name,password,phno,area,address) values('" + b + "','" + a + "','" + c + "','" + d + "','" + e + "','" + f + "')";
            client.query(sql1, function (err, data) {
                if (err) {
                    var ett = "Vendor Already Registered";
                    res.render('signup', { err: ett });
                }
                else {
                    res.render('index', { name: 'Jaydeep' });
                }
            });
        }
        catch{
           //
        }
        
    }
    
});

app.post('/uhome', function (req, res) {
    if(req.method=="POST"){
        let username=req.body.email;
        let password=req.body.pwd;
    
        var sql = "SELECT name,emailid,password from genuser where emailid='"+username+"' and password='"+password+"'"; //
        client.query(sql, function (err, data) {
            if(data.rowCount>0){
                req.session.userId = data.rows[0].emailid;
                var sql = "SELECT * FROM user_request where email='"+req.session.userId+"'"; //
                client.query(sql, function (err, data, fields) {
                if (err) throw err;
                    res.render('uhome', { userData: data["rows"],name: req.session.userId });
                });
             }
             else{
                var a="Invalid User Name or Password Please Enter Correct Credentials" 
                res.render('ulogin.ejs',{err:a});
             }
                     
          });
    }
    else{
        res.render('uhome',{userData: data["rows"],name:req.session.userId});

    }   
});

app.get('/uhome', function (req, res) {
    //here to see user request
    var sql = "SELECT * FROM user_request where email='"+req.session.userId+"'"; //
    client.query(sql, function (err, data, fields) {
        if (err) throw err;
        res.render('uhome', { userData: data["rows"],name: req.session.userId });
    });
});

app.post('/ahome', function (req, res) {
    if(req.body.email=='admin' && req.body.pwd=='admin'){
        var sql = " select note,count(note) from user_request group by note;"
        client.query(sql, function (err, data, fields) {
            if (err) throw err;
            res.render('ahome', { userData:data["rows"],udata: data.rows[0], name: 'Admin'});
        });
    }
    else{
        res.render('alogin');
    }
});

app.get('/ahome', function (req, res) {
    //plot Graph
    var sql = " select note,count(note) from user_request where status='Completed' group by note order by note DESC;"
    client.query(sql, function (err, data, fields) {
        if (err) throw err;
        console.log(data.rows)
        res.render('ahome', { userData: data["rows"], udata: data, name: 'Admin' });
    });
});

app.post('/vhome', function (req, res) {

    let username=req.body.email;
    let password=req.body.pwd;

    var vname = req.session.userId;
    var varea;

    if(req.body.hstatus=== 'Completed' || req.body.hstatus=== 'Declined'){
        //if status found from page
        let status=req.body.hstatus;
        let rid = req.body.rid;
        //after getting status like completed or pending to do something
        client.query("UPDATE user_request SET status = '"+status+"' WHERE req_id = '"+rid+"'");
        client.query("UPDATE chk_request SET status = '" + status + "' WHERE r_id = '" + rid + "'");
        var sql1 = "SELECT * FROM venuser where emailid='" + vname + "'";
        client.query(sql1, function (err, data4, fields) {
            if (err) throw err;
            varea = data4.rows[0].area;
            var sql = "SELECT * FROM chk_request where area='" + varea + "'"; //
            client.query(sql, function (err, data, fields) {
            if (err) throw err;
            res.render('vhome', { userData: data["rows"], name: req.session.userId });
            });
        });        
    }
    else{
        var sql = "SELECT name,emailid,password from venuser where emailid='" + username + "' and password='" + password + "'"; //
        client.query(sql, function (err, data) {
            if (data.rowCount > 0) {
                req.session.userId = data.rows[0].emailid;

                var sql1 = "SELECT * FROM venuser where emailid='" + req.session.userId  + "'";
                client.query(sql1, function (err, data1, fields) {
                    if (err) throw err;
                    varea = data1.rows[0].area;
                    var sql = "SELECT * FROM chk_request where area='" + varea + "'"; //
                    client.query(sql, function (err, data3, fields) {
                        if (err) throw err;
                    res.render('vhome', { userData: data3["rows"], name: req.session.userId });
                    });
                });
            }
            else {
                var err1="Invalid Credentials Password Enter Proper Credentials";
                res.render('vlogin.ejs',{err:err1});
            }
        });
    }
});

app.get('/vhome', function (req, res) {
    var vname=req.session.userId;
    var area;
    var sql1 = "SELECT area FROM venuser where emailid='"+vname+"'"; 

    client.query(sql1, function (err, data, fields) {
        if (err) throw err;
        area=data.rows[0].area;
        var sql = "SELECT * FROM chk_request where area='" + area + "'"; //
        client.query(sql, function (err, data, fields) {
            if (err) throw err;
            res.render('vhome', { userData: data["rows"], name: req.session.userId });
        });
    });
    
});

app.get('/ulogin', function (req, res) {

    res.render('ulogin', { name: 'Jaydeep' });
});

app.get('/alogin', function (req, res) {
    
    res.render('alogin', { name: 'Admin' });
});

app.get('/vlogin', function (req, res) {
    res.render('vlogin', { name: 'Jaydeep' });
});

app.get('/signup', function (req, res) {
    res.render('signup', { name: 'Jaydeep' });
});

app.get('/ainbox', function (req, res) {
    var sql = 'SELECT * FROM user_request'; //
    client.query(sql, function (err, data, fields) {
        if (err) throw err;
        res.render('ainbox', { userData: data["rows"],name: 'Admin' });
    });
});

app.post('/ainbox', function (req, res) {
    let rid = req.body.rid;
    let a = req.body.hname;
    let b = req.body.hnote;
    let c = req.body.hphno;
    let d = req.body.harea;
    let e = req.body.hadd;
    let f = req.body.hstatus;
    let g = req.body.hemail;
    let lon=req.body.hlon;
    let lat=req.body.hlat;

    client.query("INSERT INTO chk_request(r_id,name,note,phno,area,addr,status,email,date,long,lati) values('"+rid+"','" + a + "','" + b + "','" + c + "','" + d + "','" + e + "','"+f+"','"+g+"','"+tdate+"','"+lon+"','"+lat+"')");
    client.query("UPDATE user_request SET status = '"+f+"' WHERE req_id = '"+rid+"'");
    var sql = 'SELECT * FROM user_request'; 

    client.query(sql, function (err, data, fields) {
        if (err) throw err;
        res.render('ainbox', { userData: data["rows"],name: 'Admin' });
    });
});

app.get('/astock', function (req, res) {
    sql = "select papertype,area,sum(count) as Total from p_stock group by papertype,area order by papertype DESC;"
    client.query(sql, function (err, data, fields) {
        if (err) throw err;
        console.log(data);
        res.render('astock', { userData: data["rows"], name: 'Admin' });
    });
});

app.get('/ausrdetail', function (req, res) {
    var sql = 'SELECT * FROM genuser'; //
    client.query(sql, function (err, data, fields) {
        if (err) throw err;
        res.render('ausrdetail', { userData: data["rows"],name: 'Admin' });
    });
});

app.post('/urequest', function (req, res) {
    let a=req.body.uname;
    let b=req.body.note;
    let c=req.body.phno;
    let d=req.body.area;
    let e=req.body.add;
    let lat=req.body.lat;
    let lon=req.body.lon;

        client.query("INSERT INTO user_request(name,note,phno,area,addr,email,date,lati,long) values('"+a+"','"+b+"','"+c+"','"+d+"','"+e+"','"+req.session.userId+"','"+tdate+"','"+lat+"','"+lon+"')")
        res.render('urequest', { name: req.session.userId });
});

app.get('/urequest', function (req, res) {    
        res.render('urequest', { name: req.session.userId});
    });

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.render('index', { name: 'Jaydeep' });
});

app.get('/ustock', function (req, res) {
    var sql1 = "SELECT * FROM genuser where emailid='" + req.session.userId + "'";

    client.query(sql1, function (err, data, fields) {
        if (err) throw err;
        area = data.rows[0].area;
        var sql2 = "SELECT papertype,count from p_stock where INITCAP(area)='" + area + "' order by papertype DESC"; //
        client.query(sql2, function (err, data1, fields) {
            if (err) throw err;
            res.render('ustock', { userData: data1["rows"], name: req.session.userId });
        }); 
    });
});

app.get('/vstock', function (req, res) {
    var vname = req.session.userId;
    var area;
    var sqla = "SELECT * FROM venuser where emailid='" + vname + "'";
    console.log(req.session.userId);
    client.query(sqla, function (err, data2, fields) {
        console.log(data2);
        var parea
        if (err) throw err;
        parea = data2.rows[0].area;
        var sql2 = "SELECT papertype,count from p_stock where INITCAP(area)='" + parea + "' order by papertype DESC"; //
        client.query(sql2, function (err, data1, fields) {
            if (err) throw err;
            res.render('vstock', { userData: data1["rows"], name: req.session.userId });
        });
    });
});

app.post('/vstock', function (req, res) {
    //check according to area fetch from session
    let pname=req.body.ptype;
    let pcount=req.body.newcount;
    var vname = req.session.userId;

    var sqla = "SELECT * FROM venuser where emailid='" + vname + "'";
    console.log(req.session.userId);
    client.query(sqla, function (err, data2, fields) {
        if (err) throw err;
        parea = data2.rows[0].area;
        client.query("UPDATE p_stock SET count = '" + pcount + "' WHERE papertype = '" + pname + "' and INITCAP(area)='"+parea+"'");
        var sql2 = "SELECT papertype,count from p_stock where INITCAP(area)='" + parea + "' order by papertype DESC"; //
        client.query(sql2, function (err, data1, fields) {
            if (err) throw err;
            res.render('vstock', { userData: data1["rows"], name: req.session.userId });
        });
    });
});

app.listen(3000);
console.log('listening on port 3000...');