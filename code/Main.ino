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

#include "Adafruit_Thermal.h"
#include "SoftwareSerial.h"
#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
#include <Stepper.h>

#define SS_PIN 53
#define RST_PIN A0

#define TX_PIN 19 
#define RX_PIN 18 

#define button1pin 22
#define button2pin 24
#define button3pin 26
#define button4pin 28

MFRC522 mfrc522(SS_PIN, RST_PIN);

SoftwareSerial mySerial(RX_PIN, TX_PIN); // Declare SoftwareSerial obj first
Adafruit_Thermal printer(&mySerial);     // Pass addr to printer constructor

const int stepsPerRevolution = 2038;
const byte ROWS = 4; 
const byte COLS = 4; 

char hexaKeys[ROWS][COLS] = {
  {'1', '2', '3', 'C'}, // C staat voor Cancel
  {'4', '5', '6', 'L'}, // L staat voor Clear
  {'7', '8', '9', 'E'}, // E staat voor Enter
  {' ', '0', ' ', ' '}
};

char buffer[3];

byte rowPins[ROWS] = {42, 43, 44, 45}; 
byte colPins[COLS] = {46, 47, 48, 49}; 

Stepper dispenser1 = Stepper(stepsPerRevolution, 41, 40, 39, 38);

Keypad bankKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS);
int button1value = 1;
int button2value = 1;
int button3value = 1;
int button4value = 1;

int x;

String pasID = "";
String iban1 = "";
String iban2 = "";

String ingevoerdecode = "";

void setup() {
  pinMode(button1pin, INPUT_PULLUP);
  pinMode(button2pin, INPUT_PULLUP);
  pinMode(button3pin, INPUT_PULLUP);
  pinMode(button4pin, INPUT_PULLUP);
  Serial.begin(9600);
  mySerial.begin(19200); 
  printer.begin(); 
  SPI.begin();

  mfrc522.PCD_Init();
  //Serial.println("Klaar om te scanne");
  delay(4);
}

void loop() {
  while (readRFID()) {
    Serial.println(pasID + "/" + iban1 + "/" + iban2);
  }

  char invoercode = bankKeypad.getKey();
  if (invoercode){
    Serial.println(String(invoercode)); 
  }

  knoppen();

  if (Serial.available() > 0) {
    String receivedData = Serial.readStringUntil('\n');

    // Doe iets met de ontvangen data
    Serial.print("Arduino ontvangen: ");
    Serial.println(receivedData);

    if(receivedData.length() > 10){
      String parts[5];
      splitString(receivedData, "/", parts);
      x = parts[1].toInt()/10;
      for(int i = 0; i < x; i++) {
        // Rotate CCW quickly at 15 RPM for one revolution
        dispenser1.setSpeed(15);
        int totalSteps1 = stepsPerRevolution * 1;
        dispenser1.step(-totalSteps1);

        // Rotate CW quickly at 15 RPM for half a revolution
        dispenser1.setSpeed(15);
        int totalSteps2 = stepsPerRevolution * 0.5;
        dispenser1.step(totalSteps2);
        delay(10);
      }
      Serial.println("G");

      printer.setSize('M'); 
      printer.justify('C');
      printer.println("--------------------------------");

      printer.boldOn();
      printer.setFont('A');
      printer.justify('C');
      printer.setSize('L'); 
      printer.println("WisWatBank");
      printer.println("");

      printer.boldOff();
      printer.setSize('S'); 
      printer.justify('L');
      printer.println("IBAN: " + parts[0]);
      printer.println("Datum: " + parts[2]);
      printer.println("Tijd: " + parts[3]);
      printer.println("Transactie ID: " + parts[4]);

      printer.setSize('M'); 
      printer.justify('R');
      printer.println("");
      printer.println("TOTAAL BEDRAG: " + parts[1]);
      printer.justify('C');
      printer.println("--------------------------------");

      printer.feed(2);
      printer.sleep();      
      delay(30L);        
      printer.wake();       
      printer.setDefault(); 
      Serial.println("B");

    } else {
      x = receivedData.toInt()/10;
      for(int i = 0; i < x; i++) {
        // Rotate CCW quickly at 15 RPM for one revolution
        dispenser1.setSpeed(15);
        int totalSteps1 = stepsPerRevolution * 1;
        dispenser1.step(-totalSteps1);

        // Rotate CW quickly at 15 RPM for half a revolution
        dispenser1.setSpeed(15);
        int totalSteps2 = stepsPerRevolution * 0.5;
        dispenser1.step(totalSteps2);
        delay(10);
      }
      Serial.println("G");
    }
  }
}


boolean readRFID(){
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  MFRC522::StatusCode status;
  byte buffer1[18];
   byte buffer2[18];
  byte block = 4;
  byte len = 18;
  iban1 = "";
  iban2 = "";
  pasID = "";

  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return false;
  }

  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return false;
  }

  //get UID
  for (uint8_t i = 0; i < 4; i++) {
    sprintf(buffer, "%02X", mfrc522.uid.uidByte[i]);
    pasID.concat(buffer);                          
  }

  //deel 1
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    return false;
  }

  status = mfrc522.MIFARE_Read(block, buffer1, &len);
  if (status != MFRC522::STATUS_OK) {
    return false;
  }

  for (uint8_t i = 0; i < 8; i++) {
    if (buffer1[i] != 0x00) {
      iban1 += char(buffer1[i]);
    }
  }

  //deel 2
  block = 5;
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid)); //line 834
  if (status != MFRC522::STATUS_OK) {
    return false;
  }

  status = mfrc522.MIFARE_Read(block, buffer2, &len);
  if (status != MFRC522::STATUS_OK) {
    return false;
  }

  for (uint8_t i = 0; i < 10; i++) {
    if (buffer2[i] != 0x00) {
      iban2 += char(buffer2[i]);
    }
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(100);
  return true;
}


void knoppen(){
  if(digitalRead(button1pin) == 0 && button1value == 1){
    Serial.println("B1");
  }

  if(digitalRead(button2pin) == 0 && button2value == 1){
    Serial.println("B2");
  }

  if(digitalRead(button3pin) == 0 && button3value == 1){
    Serial.println("B3");
  }

  if(digitalRead(button4pin) == 0 && button4value == 1){
    Serial.println("B4");
  }

  button1value = digitalRead(button1pin);
  button2value = digitalRead(button2pin);
  button3value = digitalRead(button3pin);
  button4value = digitalRead(button4pin);
}


int splitString(String str, String delimiter, String *result) {
  int partCount = 0;
  int startIndex = 0;
  int delimiterIndex = 0;
  int maxParts = 5;

  while ((delimiterIndex = str.indexOf(delimiter, startIndex)) != -1 && partCount < maxParts - 1) {
    result[partCount++] = str.substring(startIndex, delimiterIndex);
    startIndex = delimiterIndex + delimiter.length();
  }

  if (startIndex < str.length()) {
    result[partCount++] = str.substring(startIndex);
  }

  return partCount;
}
