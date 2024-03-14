#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>

#define SS_PIN 10
#define RST_PIN A0

String tagID = "";

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

//setup
void setup(){
  Serial.begin(9600);
  SPI.begin();

  mfrc522.PCD_Init();
  delay(4);
  
  Serial.println("--------------------------");
  Serial.println("RFID reader gestart");
  Serial.println("Scan uw RFID tag...");
  Serial.println("");
  
}


//loop
void loop(){

  //voert uit wanneer nieuwe tag wordt gelezen
  while (getUID()) {
    Serial.println("----Tag gedetecteerd-----");
    Serial.println("UID: " + tagID);
    Serial.println("--------------------------");
    Serial.println("Scan nieuwe RFID tag...");
    Serial.println("");
  }

    char customKey = customKeypad.getKey();
  
  if (customKey){
    Serial.println(customKey);
  }
}


// getUID
// is true bij nieuwe tag
// anders false

boolean getUID(){
  // Getting ready for Reading PICCs
  //If a new PICC placed to RFID reader continue
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return false;
  }

  //Since a PICC placed get Serial and continue
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return false;
  }

  tagID = "";

  for ( uint8_t i = 0; i < 4; i++) {
    tagID.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  
  tagID.toUpperCase();
  mfrc522.PICC_HaltA(); // Stop reading
  return true;
}