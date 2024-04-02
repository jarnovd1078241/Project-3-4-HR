#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
#include <Wire.h>

#define SS_PIN 10
#define RST_PIN A0

String tagID = "";
String inputString = "";
bool sendData = false;

// Create instances
MFRC522 mfrc522(SS_PIN, RST_PIN);

const byte ROWS = 4; 
const byte COLS = 4; 

char hexaKeys[ROWS][COLS] = {
  {'1', '2', '3', 'C'}, // C staat voor Cancel
  {'4', '5', '6', 'L'}, // L staat voor Clear
  {'7', '8', '9', 'E'}, // E staat voor Enter
  {' ', '0', ' ', ' '}
};

byte rowPins[ROWS] = {9, 8, 7, 6}; 
byte colPins[COLS] = {5, 4, 3, 2}; 

Keypad customKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS);

void setup() {
  Serial.begin(9600);
  SPI.begin();

  mfrc522.PCD_Init();
  delay(4);
  
  Serial.println("--------------------------");
  Serial.println("RFID reader gestart");
  Serial.println("Scan uw RFID tag...");
  Serial.println("");

  Wire.begin(9); 
  Wire.onRequest(sendDataEvent); 
}

void loop() {
  while (getUID()) {
    Serial.println("----Tag gedetecteerd-----");
    Serial.println("UID: " + tagID);
    Serial.println("--------------------------");
    Serial.println("Scan nieuwe RFID tag...");
    Serial.println("");
  }

  char customKey = customKeypad.getKey();
  
  if (customKey){
    Serial.println("Key pressed: " + String(customKey)); 

    if (customKey == 'C'){
      inputString = "";
    }
    else if (customKey == 'L') {
      inputString = "";
    }
    else if (customKey == 'E'){
      Serial.println("Ingevoerde cijfers: " + inputString);
      sendData = true; // Stel sendData in op true voordat de gegevens worden verzonden
      Serial.println("Data verzenden naar master: " + inputString);
      Wire.beginTransmission(8); 
      Serial.println("Data verzenden naar master: " + inputString);
      Wire.write(inputString.c_str()); 
      Serial.println("Data verzenden naar master: " + inputString);
      Wire.endTransmission(); 
      inputString = ""; // Reset de inputString
    }
    else {
      inputString += customKey; 
    }
  }

  if (sendData) {
    Wire.beginTransmission(8); 
    Serial.println("Data verzenden naar master: " + inputString);
    Wire.write(inputString.c_str()); 
    Wire.endTransmission(); 
    sendData = false; 
  }
}

void sendDataEvent() {
  if (sendData) {
    Wire.write(inputString.c_str()); 
    sendData = false; 
  }
}

boolean getUID() {
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return false;
  }

  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return false;
  }

  tagID = "";

  for ( uint8_t i = 0; i < 4; i++) {
    tagID.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  
  tagID.toUpperCase();
  mfrc522.PICC_HaltA(); 
  return true;
}
