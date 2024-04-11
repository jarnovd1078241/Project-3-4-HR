#include <Wire.h>

#define SLAVE_ADDRESS 9

void setup() {
  Serial.begin(9600); // Begin serial communication
  Wire.begin(); // Start I2C-communicatie
}

void loop() {
  Wire.requestFrom(SLAVE_ADDRESS, 31); // Verzoek 32 bytes van de slave

  // Buffer om de ontvangen gegevens op te slaan
  char receivedData[32]; // Extra byte voor de null-terminator
  
  // Variabele om het aantal ontvangen bytes bij te houden
  int bytesRead = 0;

  // Lees de ontvangen bytes en sla ze op in de buffer
  while (Wire.available() && bytesRead < 31) {
    receivedData[bytesRead] = Wire.read(); // Lees de ontvangen byte
    bytesRead++;
  }
/*
  // Voeg een null-terminator toe aan het einde van de ontvangen gegevens
  receivedData[bytesRead] = '\0';
*/
  // Print de ontvangen gegevens naar de seriële monitor
  Serial.print("Ontvangen gegevens: ");
  Serial.write(receivedData, bytesRead);
  Serial.println(); // Nieuwe regel toevoegen
  delay(3000); // Wacht 3 seconden voordat je opnieuw verstuurt
}
