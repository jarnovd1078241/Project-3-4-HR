/* 
 * Typical pin layout used:
 * -----------------------------------------------------------------------------------------
 *             MFRC522      Arduino      Arduino   Arduino    Arduino          Arduino
 *             Reader/PCD   Uno/101      Mega      Nano v3    Leonardo/Micro   Pro Micro
 * Signal      Pin          Pin          Pin       Pin        Pin              Pin
 * -----------------------------------------------------------------------------------------
 * RST/Reset   RST         9             5         D9         RESET/ICSP-5     RST
 * SPI SS      SDA(SS)     10            53        D10        10               10
 * SPI MOSI    MOSI        11 / ICSP-4   51        D11        ICSP-4           16
 * SPI MISO    MISO        12 / ICSP-1   50        D12        ICSP-1           14
 * SPI SCK     SCK         13 / ICSP-3   52        D13        ICSP-3           15
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
#include <Stepper.h>

#define SS_PIN 53
#define RST_PIN A0

String pasID = "";
String persooncode = "";
String ingevoerdecode = "";

// Create instances
MFRC522 mfrc522(SS_PIN, RST_PIN);

const int stepsPerRevolution = 2038;
const byte ROWS = 4; 
const byte COLS = 4; 

char hexaKeys[ROWS][COLS] = {
  {'1', '2', '3', 'C'}, // C staat voor Cancel
  {'4', '5', '6', 'L'}, // L staat voor Clear
  {'7', '8', '9', 'E'}, // E staat voor Enter
  {' ', '0', ' ', ' '}
};

byte rowPins[ROWS] = {42, 43, 44, 45}; 
byte colPins[COLS] = {46, 47, 48, 49}; 

Keypad bankKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS);

Stepper dispenser1 = Stepper(stepsPerRevolution, 41, 40, 39, 38);
Stepper dispenser2 = Stepper(stepsPerRevolution, 37, 36, 35, 34);
Stepper dispenser3 = Stepper(stepsPerRevolution, 33, 32, 31, 30);

void setup() {
  Serial.begin(9600);
  SPI.begin();

  mfrc522.PCD_Init();
  delay(4);
}

void loop() {
  while (verkrijgUID()) {
    Serial.println("----Tag gedetecteerd-----");
    Serial.println("UID: " + pasID);
  }

  char invoercode = bankKeypad.getKey();
  
  if (invoercode){
    Serial.println("Ingedrukte toets: " + String(invoercode)); 

    if (invoercode == 'C'){
      ingevoerdecode = "";
    }
    else if (invoercode == 'L') {
      ingevoerdecode = "";
    }
    else if (invoercode == 'E'){
      if (ingevoerdecode == "0000") {
        Serial.println("Ongeldige invoer");
        ingevoerdecode = ""; // Reset de ingevoerde code (4-cijferige pincode)
      }
      else if (ingevoerdecode.length() != 4) {
        Serial.println("Ongeldige invoer: de code moet precies 4 cijfers bevatten");
        ingevoerdecode = ""; // Reset de ingevoerde code (4-cijferige pincode)
      }
      else {
        Serial.println("UID: " + pasID);
        Serial.println("Ingevoerde cijfers: " + ingevoerdecode);
        ingevoerdecode = ""; // Reset de ingevoerde code (4-cijferige pincode)
      }
      // code om de UID weg te sturen om te lezen (als deze voorkomt in de database dan weg gooien)
      pasID = ""; // Reset de UID (welke naar de tag verwijst)
    }
    else {
      if (ingevoerdecode.length() < 4) {
        ingevoerdecode += invoercode;
      }
    }
  }
  
  // code voor de motor (per dispenser)
/* 
  // dispenser 1
  // draai tegen de klok in, met 15 RPM
	dispenser1.setSpeed(15);
  int totalSteps1 = stepsPerRevolution * 2.5; // zet het totaal op 2,5 omwentelingen
	dispenser1.step(-totalSteps1); // maakt totaal 2,5 omwentelingen
	delay(1000);
*/

/*
  // dispenser 2
  // draai tegen de klok in, met 15 RPM
	dispenser2.setSpeed(15);
  int totalSteps2 = stepsPerRevolution * 2.5; // zet het totaal op 2,5 omwentelingen
	dispenser2.step(-totalSteps2); // maakt totaal 2,5 omwentelingen
	delay(1000);

  // dispenser 3
  // draai tegen de klok in, met 15 RPM
	dispenser3.setSpeed(15);
  int totalSteps3 = stepsPerRevolution * 2.5; // zet het totaal op 2,5 omwentelingen
	dispenser3.step(-totalSteps3); // maakt totaal 2,5 omwentelingen
	delay(1000);
*/
}

boolean verkrijgUID() {
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return false;
  }

  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return false;
  }

  pasID = "";

  for ( uint8_t i = 0; i < 4; i++) {
    pasID.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  
  pasID.toUpperCase();
  mfrc522.PICC_HaltA(); 
  return true;
}
