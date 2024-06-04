//----------------------------setup----------------------------------------

const express = require('express');
const cors = require("cors");
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');

// Middleware om JSON en URL-encoded bodies te parsen
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//Create database connections details
const connection = mysql.createConnection({
    host: 'localhost',
    user: '*****',
    password: '*****',
    database: 'wwbdatabase'
});

//Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Fout bij het verbinden met de database:', err);
    } else {
        console.log('Verbonden met de database');
    }
});


function checkSender(ip, token){
    if(ip.includes("145.24.223.160") || token == "HIDDEWASHERE"){
        return true;
    } else return false;
}


//----------------------------Bank----------------------------------------


//withdraw
app.post('/api/withdraw', (req, res) => {

    if(!(checkSender(req.ip, req.headers['wisb-token']))){
        res.status(401);
        res.send("Request niet vanaf een bekende Bank gedaan, helaas");
        return;
    }

    const rekeningnummer = req.query.target;
    const pincode = req.body.pincode;
    const pasnummer = req.body.uid;
    const amount = req.body.amount;
    

    //check of url query correct is meegegeven
    if (!rekeningnummer || !pincode || !pasnummer) {
        return res.status(400).send("Query klopt niet, zorg ervoor dat je deze 3 in ieder geval hebt: 'target' 'uid' 'pincode'. Groetjes WisWatBank");
    }

    //query
    const sql = `SELECT 
                    p.Pasnummer,
                    p.Pincode,
                    p.Foute_pogingen,
                    r.Rekeningnummer,
                    r.BalansCents,
                    g.Voornaam,
                    g.Achternaam
                FROM 
                    Passen p
                JOIN 
                    Rekeningen r ON p.Rekening_ID = r.Rekening_ID
                JOIN 
                    Gebruikers g ON r.Gebruikers_ID = g.Gebruiker_ID
                WHERE 
                    p.Pasnummer = '${pasnummer}';
    `;

    // Voer de query uit
    connection.query(sql, [pasnummer], (err, results) => {
        if (err) {
            console.error('Fout bij uitvoeren van de query:', err);
            return res.status(500).send('Er is helaas iets mis gegaan bij ons. excuses van WisWatBank');
        }

        // Resultaten verwerken
        if (results.length < 1) {
            return res.status(404).send('Combinatie rekeningnummer en pasnummer niet gevonden in onze database. Groetjes WisWatBank');
        }

        const voornaam = results[0].Voornaam;
        const achternaam = results[0].Achternaam;
        balans = results[0].BalansCents;
        remainingAttempts = 3-results[0].Foute_pogingen;
        results[0].Pincode;
        results[0].Rekeningnummer;

        if(rekeningnummer != results[0].Rekeningnummer){
            return res.status(404).send('Combinatie rekeningnummer en pasnummer niet gevonden in onze database. Groetjes WisWatBank');
        }

        if(results[0].Foute_pogingen >= 3){
            return res.status(403).send('Deze pas is geblokkeerd door te veel foute pincodes. Groetjes WisWatBank');
        }

        if(pincode != results[0].Pincode){
            const query = `
                UPDATE Passen
                SET Foute_pogingen = Foute_pogingen + 1
                WHERE Pasnummer = ?;
            `;
            connection.query(query, [pasnummer]);
            remainingAttempts -= 1;

            if(remainingAttempts == 0){
                return res.status(403).send('Deze pas is geblokkeerd door te veel foute pincodes. Groetjes WisWatBank');
            }

            return res.status(401).json({
                attempts_remaining: remainingAttempts,
            });

        } else {
            const query = `
                UPDATE Passen
                SET Foute_pogingen = 0
                WHERE Pasnummer = ?;
            `
            connection.query(query, [pasnummer]);
        }

        if((balans - amount) < 0){
            return res.status(412).send("Saldo te laag. Groetjes WisWatBank");
        }

        balans -= amount;

        const query = `
            UPDATE Rekeningen
            SET BalansCents = ${balans}
            WHERE Rekeningnummer = ?;
        `;
        connection.query(query, [results[0].Rekeningnummer]);

        return res.status(200).send("Het bedrag is van de rekening afgeschreven. Groetjes WisWatBank");
    });
});


//accountinfo
app.post('/api/accountinfo', (req, res) => {

    if(!(checkSender(req.ip, req.headers['wisb-token']))){
        res.status(401);
        res.send("Request niet vanaf een bekende Bank gedaan, helaas");
        return;
    }

    const rekeningnummer = req.query.target;
    const pincode = req.body.pincode;
    const pasnummer = req.body.uid;

    //check query
    if (!rekeningnummer || !pincode || !pasnummer) {
        return res.status(400).send("Sorry, het request lijkt niet te kloppen. Groetjes WisWatBank");
    }

    //query
    const sql = `SELECT 
                    p.Pasnummer,
                    p.Pincode,
                    p.Foute_pogingen,
                    r.Rekeningnummer,
                    r.BalansCents,
                    g.Voornaam,
                    g.Achternaam
                FROM 
                    Passen p
                JOIN 
                    Rekeningen r ON p.Rekening_ID = r.Rekening_ID
                JOIN 
                    Gebruikers g ON r.Gebruikers_ID = g.Gebruiker_ID
                WHERE 
                    p.Pasnummer = '${pasnummer}';
    `;

    //Run query
    connection.query(sql, [pasnummer], (err, results) => {
        if (err) {
            console.error('Fout bij uitvoeren van de query:', err);
            return res.status(500).send('Er is helaas iets mis gegaan bij ons. excuses van WisWatBank');
        }

        //Check results
        if (results.length < 1) {
            return res.status(404).send('Combinatie rekeningnummer en pasnummer niet gevonden in onze database. Groetjes WisWatBank');
        }

        const voornaam = results[0].Voornaam;
        const achternaam = results[0].Achternaam;
        const balans = results[0].BalansCents;
        remainingAttempts = 3-results[0].Foute_pogingen;
        results[0].Pincode;
        results[0].Rekeningnummer;

        if(rekeningnummer != results[0].Rekeningnummer){
            return res.status(404).send('Combinatie rekeningnummer en pasnummer niet gevonden in onze database. Groetjes WisWatBank');
        }

        if(results[0].Foute_pogingen >= 3){
            return res.status(403).send('Deze pas is geblokkeerd. Neem contact met ons op. Groetjes WisWatBank');
        }

        if(pincode != results[0].Pincode){
            const query = `
                UPDATE Passen
                SET Foute_pogingen = Foute_pogingen + 1
                WHERE Pasnummer = ?;
            `;
            connection.query(query, [pasnummer]);
            remainingAttempts -= 1;

            if(remainingAttempts == 0){
                return res.status(403).send('Deze pas is geblokkeerd. Neem contact met ons op. Groetjes WisWatBank');
            }

            return res.status(401).json({
                attempts_remaining: remainingAttempts,
            });
        }

        const query = `
            UPDATE Passen
            SET Foute_pogingen = 0
            WHERE Pasnummer = ?;
        `
        connection.query(query, [pasnummer]);

        return res.status(200).json({
            firstname: voornaam,
            lastname: achternaam,
            balance: balans,
        });
    });
});


//----------------------------Logs----------------------------------------

//createlog
app.post('/api/createlog', (req, res) => {

    if(!(checkSender(req.ip, req.headers['wisb-token']))){
        res.status(401);
        res.send("Request niet vanaf een bekende Bank gedaan, helaas");
        return;
    }

    rekeningnummer = req.body.target;
    pasnummer = req.body.uid;


    //check query
    if (!rekeningnummer || !pasnummer) {
        return res.status(400).send("Sorry, het request lijkt niet te kloppen. Groetjes WisWatBank");
    }

    //query
    const sql = `
    INSERT INTO Logs (Rekeningnummer, Pasnummer, LoginDate)
    VALUES ('${rekeningnummer}', '${pasnummer}', '${moment().tz('Europe/Amsterdam').format('DD-MM-YYYY HH:mm:ss')}');
    `;

    connection.query(sql, (error, results, fields) => { 
        if (error) {
            console.error('Fout bij uitvoeren van de query:', error);
            return res.status(500).send('Er is helaas iets mis gegaan bij ons. excuses van WisWatBank');
        }
    
        // Haal het laatst ingevoegde ID op
        connection.query('SELECT LAST_INSERT_ID()', (error, results, fields) => {
            if (error) {
                console.error('Error executing SELECT LAST_INSERT_ID() query:', error);
                return;
            }
    
            return res.status(200).json({
                logsid: results[0]['LAST_INSERT_ID()']
            }); 
        });
    });
});


//editlog
app.post('/api/editlog', (req, res) => {

    if(!(checkSender(req.ip, req.headers['wisb-token']))){
        res.status(401);
        res.send("Request niet vanaf een bekende Bank gedaan, helaas");
        return;
    }

    logsid = req.body.logsid;
    balancebefore = req.body.balancebefore;
    withdrawn = req.body.withdrawn;
    state = req.body.state;

    if (!logsid || !state) {
        return res.status(400).send("Sorry, het request lijkt niet te kloppen. Groetjes WisWatBank");
    }
    
    if(state == 401){
        sql = `
        UPDATE Logs
        SET WrongAttempts = WrongAttempts + 1
        WHERE idLogs = ${logsid};
        `;

        connection.query(sql);
    }

    if(state == 403){
        sql = `
        UPDATE Logs
        SET Status = 'Geblokkeerd'
        WHERE idLogs = ${logsid};
        `;

        connection.query(sql);
    }

    if(state == 404){
        sql = `
        UPDATE Logs
        SET Status = 'Niet bestaand'
        WHERE idLogs = ${logsid};
        `;

        connection.query(sql);
    }

    if (state == 200 && withdrawn){
        sql = `
        UPDATE Logs
        SET BalanceBefore = ${balancebefore}, Status = 'OK', Withdrawn = ${withdrawn*100}, WithdrawDate = '${moment().tz('Europe/Amsterdam').format('DD-MM-YYYY HH:mm:ss')}'
        WHERE idLogs = ${logsid};
        `;

        connection.query(sql);
    }

    if(state == 200){
        sql = `
        UPDATE Logs
        SET BalanceBefore = ${balancebefore}, Status = 'OK'
        WHERE idLogs = ${logsid};
        `;

        connection.query(sql);
    } 

    return res.status(200).send("Log is aangepast");
});


//----------------------------overig----------------------------------------


//reset foute pogingen
app.get('/api/reset', (req, res) => {
    const pasnummer = req.query.uid;

    const query = `
                    UPDATE Passen
                    SET Foute_pogingen = 0
                    WHERE Pasnummer = ?;
                `
    connection.query(query, [pasnummer]);
    return res.status(200).send('Foute pogingen gereset');
});


//Noob API
app.get("/api/noob/health", (req, res) => {
    if(!(checkSender(req.ip, req.headers['wisb-token']))){
        res.status(401);
        res.send("Request niet vanaf een bekende Bank gedaan, helaas");
        return;
    }
    res.status(200);
    res.json({"status": "OK"});
})


//Test message
app.get("/test", (req, res) => {
    console.log('Test ontvangen');
    console.log('IP: ' + req.ip);
    console.log('WISB token: ' + req.headers['wisb-token'])
    console.log(checkSender(req.ip, req.headers['wisb-token']));
    res.status(200);
    res.send('Groetjes van Hidde');
})


//stay online
app.listen(8080, () => {
    console.log("Server is gestart op poort 8080");
})


