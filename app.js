const express = require('express');
const cors = require("cors");
const app = express();
const mysql = require('mysql');

app.use(cors());

//Create database connections details
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'hidde',
    password: 'hidde',
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

//Get pincode -> pasnummer
app.get('/getpincode', (req, res) => {
    const { pasnummer } = req.query;

    if (!pasnummer) {
        return res.status(400).json({ error: 'Pasnummer ontbreekt in de query parameters' });
    }

    const query = `SELECT Pincode FROM Passen WHERE Pasnummer = ?`;

    connection.query(query, [pasnummer], (err, results) => {
        if (err) {
            console.error('Fout bij het uitvoeren van de query:', err);
            return res.status(500).json({ error: 'Interne serverfout' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Pasnummer niet gevonden' });
        }

        const pincode = results[0].Pincode;
        res.json({ pincode });
    });
});

//Get user info -> pasnummer
app.get('/userinfo', (req, res) => {
    const pasnummer = req.query.pasnummer;

    // Query om gebruikersinformatie op te halen op basis van pasnummer
    const query = `
        SELECT Gebruikers.Voornaam, Gebruikers.Achternaam, Rekeningen.BalansCents, Rekeningen.Rekeningnummer
        FROM Passen
        JOIN Rekeningen ON Passen.Rekening_ID = Rekeningen.Rekening_ID
        JOIN Gebruikers ON Rekeningen.Gebruikers_ID = Gebruikers.Gebruiker_ID
        WHERE Passen.Pasnummer = '${pasnummer}'
    `;

    // Voer de query uit
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Fout bij uitvoeren van databasequery:', err);
            res.status(500).send('Interne serverfout');
            return;
        }

        // Controleer of er resultaten zijn     
        if (results.length === 0) {
            res.status(404).send('Gebruiker niet gevonden voor dit pasnummer');
            return;
        }

        // Haal de gebruikersinformatie op uit de resultaten
        const voornaam = results[0].Voornaam;
        const achternaam = results[0].Achternaam;
        const balans = results[0].BalansCents;
        const rekeningnummer = results[0].Rekeningnummer;

        // Stuur de gebruikersinformatie terug als JSON
        res.status(200).json({
            voornaam: voornaam,
            achternaam: achternaam,
            balans: balans,
            rekeningnummer: rekeningnummer
        });
    });
});


//Change balance -> pasnummer&bedrag
app.get('/adjustbalance', (req, res) => {
    const pasnummer = req.query.pasnummer;
    const bedrag = parseInt(req.query.bedrag);

    // Zoek het rekeningnummer op basis van het pasnummer
    const query = `SELECT Rekeningen.Rekeningnummer, Rekeningen.BalansCents
                   FROM Passen
                   JOIN Rekeningen ON Passen.Rekening_ID = Rekeningen.Rekening_ID
                   WHERE Passen.Pasnummer = '${pasnummer}'`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Fout bij uitvoeren van databasequery:', err);
            res.status(500).send('Interne serverfout');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Rekening niet gevonden');
            return;
        }

        const rekeningnummer = results[0].Rekeningnummer;
        const huidigeBalans = results[0].BalansCents;
        const nieuweBalans = huidigeBalans - bedrag;

        // Update de balans van de rekening
        const updateQuery = `UPDATE Rekeningen SET BalansCents = ${nieuweBalans} WHERE Rekeningnummer = '${rekeningnummer}'`;

        connection.query(updateQuery, err => {
            if (err) {
                console.error('Fout bij bijwerken van balans:', err);
                res.status(500).send('Interne serverfout');
                return;
            }

            console.log(`${bedrag} opgenomen van rekening ${rekeningnummer}. Nieuwe balans: ${nieuweBalans}`);
            res.status(200).send(`${bedrag} opgenomen van rekening ${rekeningnummer}. Nieuwe balans: ${nieuweBalans}`);
        });
    });
});


//Manually set balance-> pasnummer
app.get('/setbalance', (req, res) => {
    const pasnummer = req.query.pasnummer;
    const bedrag = parseInt(req.query.bedrag);

    // Zoek het rekeningnummer op basis van het pasnummer
    const query = `SELECT Rekeningen.Rekeningnummer, Rekeningen.BalansCents
                   FROM Passen
                   JOIN Rekeningen ON Passen.Rekening_ID = Rekeningen.Rekening_ID
                   WHERE Passen.Pasnummer = '${pasnummer}'`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Fout bij uitvoeren van databasequery:', err);
            res.status(500).send('Interne serverfout');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Rekening niet gevonden');
            return;
        }

        const rekeningnummer = results[0].Rekeningnummer;

        // Update de balans van de rekening
        const updateQuery = `UPDATE Rekeningen SET BalansCents = ${bedrag} WHERE Rekeningnummer = '${rekeningnummer}'`;

        connection.query(updateQuery, err => {
            if (err) {
                console.error('Fout bij bijwerken van balans:', err);
                res.status(500).send('Interne serverfout');
                return;
            }

            console.log(`Balans van rekening ${rekeningnummer} handmatig aangepast naar ${bedrag}`);
            res.status(200).send(`Balans van rekening ${rekeningnummer} handmatig aangepast naar ${bedrag}`);
        });
    });
});


//Noob API
app.get("/api/noob/health", (req, res) => {
    res.json({"status": "OK"});
})


//Test bericht
app.get("/test", (req, res) => {
    res.send('Groetjes van Hidde');
})


//stay online
app.listen(8080, () => {
    console.log("Server is gestart op poort 8080");
})

