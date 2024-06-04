//const { create } = require("domain");

// ------------vars-------------------
let currentpage;
let overlay;
let serialPort;
let receivedBuffer = '';
let pasnummer = '';
let pincode = '';
let saldo = 0;
let logsid = 0;
let firstname;
let lastname;
let pinbedrag = 0;
let target = '';
let afktime = 20000;
let timer = setTimeout(afk, afktime);
let timer2;
let timer3;
let isAfk = false;
let noobtoken = '269e5d56-5974-4434-8fa3-b3fefdeafa51';
//let noobtoken = '8a87b139-5068-4382-bd7d-4f12899389fc';
let wisbtoken = 'HIDDEWASHERE';

const cijferVak = document.querySelector('.cijfervak');

// ------------pages-------------------

const page0 = document.getElementById('page0');
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');
const page4 = document.getElementById('page4');
const page5 = document.getElementById('page5');
const page6 = document.getElementById('page6');
const page7 = document.getElementById('page7');
const page8 = document.getElementById('page8');
const page9 = document.getElementById('page9');
const page10 = document.getElementById('page10');
const page11 = document.getElementById('page11');
const pages = [page0, page1, page2, page3, page4, page5, page6, page7, page8, page9, page10, page11];

function showPage(page) {
    message = '';
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove('show')
    }

    pages[5].classList.add('show')

    setTimeout(() => {
        pages[5].classList.remove('show')
        pages[page].classList.add('show')
    }, 300);

    currentpage = page;
}

showPage(8);




// ------------Webserial-------------------

async function connectSerial() {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    console.log('Serial port is open!');
    document.getElementById('status').textContent = 'Verbonden met Arduino';

    startReading(); // Start met het continu lezen van inkomende seriële data
  } catch (error) {
    console.error('Failed to open serial port:', error);
    document.getElementById('status').textContent = 'Verbinding mislukt';
  }
}

async function startReading() {
    const reader = serialPort.readable.getReader();
  
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.log('Reader is klaar');
                break;
            }
            
            const receivedText = new TextDecoder().decode(value);
            receivedBuffer += receivedText;
            const newlineIndex = receivedBuffer.indexOf('\n');
            if (newlineIndex !== -1) {
                message = receivedBuffer.substring(0, newlineIndex);
                document.getElementById('sensorValue').textContent = message.trim()
                clearTimeout(timer);
                clearTimeout(timer2);
                clearTimeout(timer3);
                removeOverlay();
                timer = setTimeout(afk, afktime);
                
                //------------------------------------------------------------------------------------------------------------------
                //-------------hier heb je het hele bericht in {message}-------------
                
                console.log(message);

                if(isAfk == false){

                    //pagina 0 (pinpas) -----------------------------------------------
                    if(currentpage == 0 && message.length > 6){
                        messageArray = message.split("/");
                        pasnummer = messageArray[0];
                        iban1 = messageArray[1];
                        iban2 = messageArray[2];
                        target = iban1 + iban2;

                        //RAMBO bank creds
                        //pasnummer = "027D32C9"; target = "IM00RAMB1234567890"; pincode = "1234"; 

                        if(target.length < 4){
                            showError(44);
                            createlog("N.V.T.", pasnummer);
                        } else {
                            showPage(1);
                            cijferVak.textContent = '';
                            createlog(target, pasnummer);
                            console.log('pasnummer: ' + pasnummer);
                            console.log('Iban: ' + target);
                        } 
                    }

                    //pagina 1 (pincode) -----------------------------------------------
                    if(currentpage == 1 && message.length == 2){
                        
                        if(pincode.length != 4 && message.trim() <= 9){
                            pincode += message.trim();
                            console.log('pincode: ' + pincode);
                        }

                        if(message.trim() == 'L'){
                            console.log('pincode gereset');
                            pincode = '';
                        }

                        if(message.trim() == 'C'){
                            home();
                        }

                        if(message.trim() == 'E'){
                            if(pincode.length != 4){
                                showError(55);
                                console.log('pincode is nog niet 4 cijfers');
                            } else {

                                data = {
                                    uid: pasnummer,
                                    pincode: pincode
                                };
                                if (target.includes("WISB")){
                                    console.log("Eigen klant");
                                    url = `http://145.24.223.238:8080/api/accountinfo?target=${target}`;
                                    requestOptions = {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'NOOB-TOKEN': noobtoken,
                                            'WISB-TOKEN': wisbtoken
                                        },
                                        body: JSON.stringify(data)
                                    };
                                } else {
                                    console.log("Geen eigen klant");
                                    url = `https://noob.datalabrotterdam.nl/api/noob/accountinfo?target=${target}`;
                                    requestOptions = {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'NOOB-TOKEN': noobtoken
                                        },
                                        body: JSON.stringify(data)
                                    };
                                }

                                //http://145.24.223.238:8080/api/accountinfo?target=IM45WISB0123456789
                                
                                fetch(url, requestOptions)
                                .then(response => {
                                    if (response.ok) {
                                        console.log("Login OK")
                                        showPage(2);
                                        return response.json().then(data => {
                                            saldo = data.balance;
                                            if(saldo < 0) saldo = 0;
                                            firstname = data.firstname;
                                            lastname = data.lastname;
                                            editlog(logsid, 200, saldo);
                                            document.querySelector('#page2 h2').textContent = `Welkom ${firstname} ${lastname}`;
                                            document.querySelector('#page3 h3').textContent = `£${formatSaldoCents(saldo)}`;
                                            document.querySelector('#page6 h2').textContent = `Bedankt voor uw bezoek ${firstname}!`;
                                        });
                                    }
                                    if (response.status === 400) {
                                        console.log('Bad request');
                                        setTimeout(() => {
                                            home();
                                        }, 2000);
                                        return response.json()
                                            .then(data => {
                                                showError(response.status, data.attempts_remaining);
                                            });
                                    } else if (response.status === 401) {
                                        console.log('Pincode incorrect');
                                        cijferVak.textContent = '';
                                        pincode = '';
                                        editlog(logsid, 401);
                                        return response.json()
                                            .then(data => {
                                                showError(response.status, data.attempts_remaining);
                                            });
                                    } else if (response.status === 403) {
                                        console.log('Pas geblokkeerd');
                                        cijferVak.textContent = '';
                                        pincode = '';
                                        editlog(logsid, 403);
                                        showError(response.status);
                                        setTimeout(() => {
                                            home();
                                        }, 5000);
                                        return;
                                    } else if (response.status === 404) {
                                        console.log('Iban/pas niet gevonden');
                                        cijferVak.textContent = '';
                                        pincode = '';
                                        editlog(logsid, 404);
                                        showError(response.status);
                                        setTimeout(() => {
                                            home();
                                        }, 5000);
                                        return;
                                    } else {
                                        throw new Error('Unexpected HTTP status: ' + response.status);
                                    }
                                })
                                .catch(error => {
                                    console.error('Fetch error:', error);
                                    showError(69);
                                    setTimeout(() => {
                                        home();
                                    }, 2000);
                                });
                            }
                        }

                        switch (pincode.length) {
                            case 1:
                                cijferVak.textContent = '*';
                                break;
                            case 2:
                                cijferVak.textContent = '* *';
                                break;
                            case 3:
                                cijferVak.textContent = '* * *';
                                break;
                            case 4:
                                cijferVak.textContent = '* * * *';
                                break;
                            default:
                                cijferVak.textContent = '';
                        }
                    }

                    //pagina 2 (home) -----------------------------------------------

                    if(currentpage == 2){
                        switch (message.trim()) {
                            case 'B1': // saldo checken
                                showPage(3);
                                break;
                            case 'B2': // annuleren
                                home();
                                break;
                            case 'B3': // geld opnemen
                                showPage(4);
                                break;
                            case 'B4': // 50 opnemen
                                showPage(10);
                                pinbedrag = 50;
                                document.querySelector('#page10 .controlebedrag').textContent = `£${formatSaldo(pinbedrag)}`
                                break;
                            case 'C':
                                home();
                                break;
                        }
                    }

                    //pagina 3 (saldo) -----------------------------------------------

                    if(currentpage == 3){
                        switch (message.trim()) {
                            case 'B2': // terug
                                showPage(2);
                                break;
                            case 'C': // terug
                                showPage(2);
                                break;
                        }
                    }

                    //pagina 4 (opnemen) -----------------------------------------------
                    if(currentpage == 4){
                        switch (message.trim()) {
                            case 'B1': // eigen bedrag
                                showPage(9);
                                document.querySelector('#page9 .bedrag').textContent = `£0`;
                                break;
                            case 'B2': // terug
                                showPage(2);
                                break;
                            case 'B3': // 100 opnemen
                                pinbedrag = 100;
                                document.querySelector('#page10 .controlebedrag').textContent = `£${formatSaldo(pinbedrag)}`
                                showPage(10);
                                break;
                            case 'B4': // 30 opnemen
                                pinbedrag = 30;
                                document.querySelector('#page10 .controlebedrag').textContent = `£${formatSaldo(pinbedrag)}`
                                showPage(10);
                                break;
                            case 'C':
                                showPage(2);
                                break;
                            
                        }
                    }

                    //pagina 9 (anders) -----------------------------------------------
                    if(currentpage == 9){
                        if(pinbedrag.length != 3 && message.trim() <= 9){
                            if(!(pinbedrag == 0 && message.trim() == 0)){
                                pinbedrag += message.trim();
                                document.querySelector('#page9 .bedrag').textContent = `£${formatSaldo(pinbedrag)}`;
                                pinbedrag = parseInt(pinbedrag, 10).toString();
                                console.log('pinbedrag: ' + pinbedrag);
                            }
                        }

                        if(message.trim() == 'L'){
                            pinbedrag = 0;
                            document.querySelector('#page9 .bedrag').textContent = `£${formatSaldo(pinbedrag)}`;
                        }

                        if(message.trim() == 'B2'){
                            showPage(4);
                        }

                        if(message.trim() == 'C'){
                            showPage(4);
                            pinbedrag = 0;
                        }

                        if(message.trim() == 'E' || message.trim() == 'B4'){
                            if(pinbedrag > 0){
                                pinbedrag = Math.ceil(pinbedrag / 10) * 10;
                                document.querySelector('#page10 .controlebedrag').textContent = `£${formatSaldo(pinbedrag)}`
                                showPage(10);
                            } else {
                                showError(60);
                            }
                        }
                    }

                    //pagina 7 (bon) -----------------------------------------------
                    if(currentpage == 7){
                        if(message.trim() == 'B4' || message.trim() == 'E'){
                            sendData(`${target}/${pinbedrag}/${moment().tz('Europe/Amsterdam').format('DD-MM-YYYY')}/${moment().tz('Europe/Amsterdam').format('HH:mm:ss')}/${logsid}`);
                            showPage(11);
                        }

                        if(message.trim() == 'B2' || message.trim() == 'C'){
                            sendData(pinbedrag);
                            showPage(11);
                        }

                    }

                    //pagina 10 (controle) -----------------------------------------------
                    if(currentpage == 10){
                        if(message.trim() == 'B2' || message.trim() == 'C'){
                            showPage(4);
                            pinbedrag = 0;
                        }

                        if(message.trim() == 'B4' || message.trim() == 'E'){
                            data = {
                                uid: pasnummer,
                                pincode: pincode,
                                amount: pinbedrag*100
                            };
                            if (target.includes("WISB")){
                                url = `http://145.24.223.238:8080/api/withdraw?target=${target}`;
                                requestOptions = {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'NOOB-TOKEN': noobtoken,
                                        'WISB-TOKEN': wisbtoken
                                    },
                                    body: JSON.stringify(data)
                                };
                            } else {
                                url = `https://noob.datalabrotterdam.nl/api/noob/withdraw?target=${target}`;
                                requestOptions = {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'NOOB-TOKEN': noobtoken
                                    },
                                    body: JSON.stringify(data)
                                };
                            }

                            //http://145.24.223.238:8080/api/accountinfo?target=IM45WISB0123456789
                            
                            fetch(url, requestOptions)
                            .then(response => {
                                if (response.ok) {
                                    console.log("Pintransactie OK");
                                    editlog(logsid, 200, saldo, pinbedrag);
                                    showPage(7);
                                    return response;
                                }
                                if (response.status === 400) {
                                    console.log('Bad request');
                                    cijferVak.textContent = '';
                                    pincode = '';
                                    return response.json()
                                        .then(data => {
                                            showError(response.status, data.attempts_remaining);
                                        });
                                } else if (response.status === 401) {
                                    console.log('Pincode incorrect');
                                    return response.json()
                                        .then(data => {
                                            showError(response.status, data.attempts_remaining);
                                        });
                                } else if (response.status === 403) {
                                    console.log('Geblokkeerd');
                                    showError(response.status);
                                    setTimeout(() => {
                                        home();
                                    }, 5000);
                                    return;
                                } else if (response.status === 404) {
                                    console.log('Iban/pas niet gevonden');
                                    showError(response.status);
                                    setTimeout(() => {
                                        home();
                                    }, 5000);
                                    return;
                                } else if (response.status === 412) {
                                    console.log('Geen saldo');
                                    editlog(logsid, 412, saldo, pinbedrag);
                                    showError(response.status);
                                    setTimeout(() => {
                                        showPage(4);
                                        pinbedrag = 0;
                                    }, 5000);
                                    return;
                                } else {
                                    throw new Error('Unexpected HTTP status: ' + response.status);
                                }
                            })
                            .catch(error => {
                                console.error('Fetch error:', error);
                                showError(69);
                                setTimeout(() => {
                                    home();
                                }, 2000);
                            });

                        }
                    }

                    //pagina 11 (wachten) -----------------------------------------------
                    if(currentpage == 11){
                        if(message.trim() == 'G'){
                            home();
                        }
                    }
                    
                } else {
                    isAfk = false;
                }
                    
                //------------------------------------------------------------------------------------------------------------------    
                // Verwijder het verwerkte bericht uit de buffer 
                receivedBuffer = receivedBuffer.substring(newlineIndex + 1);
            }
        }
    } catch (error) {
      console.error('Error reading from serial port:', error);
    } finally {
      reader.releaseLock();
    }
}

//-------------------------functies--------------------------------------------------


async function sendData(dataString) {
    const encoder = new TextEncoder();
    const dataArrayBuffer = encoder.encode(dataString); // Converteer de data naar een ArrayBuffer
  
    const writer = serialPort.writable.getWriter();
    try {
        await writer.write(dataArrayBuffer); // Stuur de data naar de Arduino
        //console.log('Data verzonden:', dataString);
    } catch (error) {
        console.error('Fout bij het verzenden van data:', error);
    } finally {
        writer.releaseLock();
    }
}

function home(){
    pincode = '';
    target = '';
    pasnummer = '';
    saldo = '0';
    logsid;
    pinbedrag = 0;
    cijferVak.textContent = '';
    showPage(6);
    setTimeout(() => {
        showPage(0);
        document.querySelector('#page6 h2').textContent = `Bedankt voor uw bezoek!`;
    }, 2000);
    console.log("Annuleren");
}

function showError(error, pogingen){
    let timing;
    // Stap 1: Maak een nieuw element aan voor het rode vak
    overlay1 = document.createElement('div');
    overlay1.classList.add('overlay'); // Voeg een klasse toe voor stijling
    if(error == 401){
        timing = 3000;
        overlay1.textContent = `Incorrecte pincode, u heeft nog ${pogingen} poging(en)`;
    } else if(error == 403){
        timing = 5000;
        overlay1.textContent = `Uw pinpas is geblokkeerd, neem contact op met uw eigen bank`;
    } else if(error == 404){
        timing = 5000;
        overlay1.textContent = `De combinatie van uw rekeningnummer en uw pasnummer komt niet voor in ons systeem, voer een andere pas in`;
    } else if(error == 55){
        timing = 2000;
        overlay1.textContent = `Uw pincode bestaat nog niet uit 4 tekens.`;
    } else if(error == 60){
        timing = 2000;
        overlay1.textContent = `Het bedrag om te pinnen mag niet 0 zijn.`;
    } else if(error == 412){
        timing = 5000;
        overlay1.textContent = `Uw saldo is te laag, kies een ander bedrag.`;
    } else if(error == 400){
        timing = 2000;
        overlay1.textContent = `API van de gezochte bank lijkt kuren te hebben`;
    } else if(error == 69){
        timing = 2000;
        overlay1.textContent = `Er is een onverwachte error, bekijk de console voor meer info.`;
    } else if(error == 44){
        timing = 4000;
        overlay1.textContent = `Geen geldige pas gelezen, probeer een andere`;
    }

    // Stap 2: Voeg het overlay-element toe aan de DOM bovenop de gewenste section
    const targetSection = document.getElementById('page0');
    targetSection.parentNode.insertBefore(overlay1, targetSection);

    // Stap 3: Stel de stijl van het overlay-element in
    overlay1.style.position = 'absolute';
    overlay1.style.top = '0';
    overlay1.style.left = '0';
    overlay1.style.width = '100%';
    overlay1.style.height = '100%';
    overlay1.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; // Rode achtergrond met 50% transparantie
    overlay1.style.color = 'white'; // Witte tekst voor contrast
    overlay1.style.display = 'flex';
    overlay1.style.justifyContent = 'center';
    overlay1.style.alignItems = 'center';
    overlay1.style.fontSize = '35px';
    overlay1.style.fontWeight = 'bold';
    overlay1.style.zIndex = '999'; // Zorg ervoor dat het bovenop andere elementen wordt weergegeven


    setTimeout(() => {
        const overlay1 = document.querySelector('.overlay'); 
        if (overlay1) { 
            overlay1.parentNode.removeChild(overlay1); 
        }
    }, timing);
}

document.getElementById('connectBtn').addEventListener('click', () => {
    connectSerial();
    showPage(0);
});

function afk(){
    if(currentpage == 0 || currentpage == 8 || currentpage == 11){
        timer = setTimeout(afk, afktime);
        return;
    }

    isAfk = true;

    // Stap 1: Maak een nieuw element aan voor het rode vak
    overlay = document.createElement('div');
    overlay.textContent = `Uit veiligheidsredenen wordt u binnen 10 seconden terug gestuurd naar de homepagina. Om alsnog verder te gaan klikt u op een willekeurige knop`;

    // Stap 2: Voeg het overlay-element toe aan de DOM bovenop de gewenste section
    const targetSection = document.getElementById('page0');
    targetSection.parentNode.insertBefore(overlay, targetSection);

    // Stap 3: Stel de stijl van het overlay-element in
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; // Rode achtergrond met 50% transparantie
    overlay.style.color = 'white'; // Witte tekst voor contrast
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontSize = '35px';
    overlay.style.fontWeight = 'bold';
    overlay.style.zIndex = '999'; // Zorg ervoor dat het bovenop andere elementen wordt weergegeven


    timer2 = setTimeout(() => {
        if (overlay && overlay.parentNode) { // Controleer of het overlay-element bestaat en aan een ouderknooppunt is gekoppeld
            overlay.parentNode.removeChild(overlay); // Verwijder het overlay-element uit de DOM
        }
        isAfk = false;
    }, 10000);
    timer3 = setTimeout(() => {
        home();
    }, 10000);
}

function removeOverlay(){
    if (overlay && overlay.parentNode) { // Controleer of het overlay-element bestaat en aan een ouderknooppunt is gekoppeld
        overlay.parentNode.removeChild(overlay); // Verwijder het overlay-element uit de DOM
    }
}

function formatSaldoCents(number) {
    let numString = number.toString();
    while (numString.length < 3) {
        numString = '0' + numString;
    }
    let integerPart = numString.slice(0, -2);
    let decimalPart = numString.slice(-2);

    integerPart = integerPart.replace(/^0+/, '');
    
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    if (integerPart === '') {
        integerPart = '0';
    }

    return integerPart + ',' + decimalPart;
}

function formatSaldo(number) {
    if (isNaN(number)) {
        throw new Error("Ongeldig getal");
    }
    let numString = number.toString();
    numString = numString.replace(/^0+/, '');

    numString = numString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    if (numString === '') {
        numString = '0';
    }
    return numString;
}

function createlog(target, pasnummer){
    data = {
        uid: pasnummer,
        target: encodeURIComponent((target.trim()).replace(/[\r\n]+/g, ""))
    };
    requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'WISB-TOKEN': wisbtoken
        },
        body: JSON.stringify(data)
    };
    url = `http://145.24.223.238:8080/api/createlog`;
    
    fetch(url, requestOptions)
    .then(response => {
        if (response.ok) {
            return response.json().then(data => {
                logsid = data.logsid;
            });
        }
    });
}

function editlog(logsid, state, balancebefore, withdrawn){
    data = {
        state: state,
        logsid: logsid,
        balancebefore: balancebefore,
        withdrawn: withdrawn
    };
    requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'WISB-TOKEN': wisbtoken
        },
        body: JSON.stringify(data)
    };
    url = `http://145.24.223.238:8080/api/editlog`;
    
    fetch(url, requestOptions)
    .then(response => {
        if (response.ok) {
            return;
        } else {
            console.log(`er is totale paniek bij het aanpassen van log ${logsid}`)
        }
    });
}


