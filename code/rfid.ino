#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9


String tagID = "";

// Create instances
MFRC522 mfrc522(SS_PIN, RST_PIN);


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