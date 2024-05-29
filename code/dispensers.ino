/* 
Dit gedeelte van de code is specifiek voor de dispensers, met een stukje rekenwerk om het opgegeven getal om te zetten naar een selectie voor de dispensers
*/

// Includes the Arduino Stepper Library
#include <Stepper.h>

// Defines the number of steps per rotation
const int stepsPerRevolution = 2038;

// Creates instances of the Stepper class for three dispensers
// Pins entered in sequence IN1-IN3-IN2-IN4 for proper step sequence
Stepper dispenser1 = Stepper(stepsPerRevolution, 38, 39, 40, 41);
Stepper dispenser2 = Stepper(stepsPerRevolution, 37, 36, 35, 34);
Stepper dispenser3 = Stepper(stepsPerRevolution, 33, 32, 31, 30);

int x;

void setup() {
    // Nothing to do (Stepper Library sets pins as outputs)
}

//Stepper dispenser1 = Stepper(stepsPerRevolution, 41, 40, 39, 38);

void loop() {
// lees de string uit en parse deze naar een integer x
  x = receivedData.toInt();
  // Calculate the number of full rotations for each dispenser
    int dispenseMotor3 = x / 50;
    x %= 50;

    int dispenseMotor2 = x / 20;
    x %= 20;

    int dispenseMotor1 = x / 10;
    x %= 10;

    // Rotate dispenser1 (£10)
    for (int i = 0; i < dispenseMotor1; i++) {
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

    // Rotate dispenser2 (£20)
    for (int i = 0; i < dispenseMotor2; i++) {
        // Rotate CCW quickly at 15 RPM for one revolution
        dispenser2.setSpeed(15);
        int totalSteps1 = stepsPerRevolution * 1;
        dispenser2.step(-totalSteps1);

        // Rotate CW quickly at 15 RPM for half a revolution
        dispenser2.setSpeed(15);
        int totalSteps2 = stepsPerRevolution * 0.5;
        dispenser2.step(totalSteps2);
        delay(10);
    }

    // Rotate dispenser3 (£50)
    for (int i = 0; i < dispenseMotor3; i++) {
        // Rotate CCW quickly at 15 RPM for one revolution
        dispenser3.setSpeed(15);
        int totalSteps1 = stepsPerRevolution * 1;
        dispenser3.step(-totalSteps1);

        // Rotate CW quickly at 15 RPM for half a revolution
        dispenser3.setSpeed(15);
        int totalSteps2 = stepsPerRevolution * 0.5;
        dispenser3.step(totalSteps2);
        delay(10);
    }

    // Optional: Stop the loop after the specified rotations
    while (true) {
        // Do nothing, effectively stopping the loop
    }
}
