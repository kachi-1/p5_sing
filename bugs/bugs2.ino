/*Youtube = https://youtu.be/7BHq3wdXYNg
* Final Project
*/
#include <Arduino_JSON.h>

// constants won't change. They're used here to set pin numbers:
const int yPin = 2;  // the number of the pushbutton pin
const int xPin = 3;  // the number of the pushbutton pin
const int bluePin = 12;    // the number of the LED pin
const int redPin = 13;    // the number of the LED pin
const int ledPin = 10;    // the number of the LED pin

// variables will change:
int buttonState = 0;  // variable for reading the pushbutton status
int buttonState2 = 0;  // variable for reading the pushbutton status

JSONVar serialOutput;

void setup() {
  // initialize the LED pin as an output:
  Serial.begin(9600);
  pinMode(bluePin, OUTPUT);
  pinMode(redPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  // initialize the pushbutton pin as an input:
  pinMode(yPin, INPUT);
  pinMode(xPin, INPUT);
}

void loop() {
  // read the state of the pushbutton value:
  buttonState = digitalRead(yPin);
  buttonState2 = digitalRead(xPin);

  serialOutput["xButton"] = buttonState2;
  serialOutput["yButton"] = buttonState;
  Serial.println(serialOutput);
  //digitalWrite(bluePin, HIGH);

  if (Serial.available()) {
    // read the most recent byte (which will be from 0 to 255):
    int blink = Serial.read();
    // set the brightness of the LED:
    if (blink == 1) {
      digitalWrite(ledPin, HIGH);
      delay(2);
      digitalWrite(ledPin, LOW);
      delay(2);
      digitalWrite(ledPin, HIGH);
      delay(2);
      digitalWrite(ledPin, LOW);
    }
    if (blink == 2) {
      digitalWrite(bluePin, HIGH);
    }else if (blink == 12) {
      digitalWrite(bluePin, LOW);
    }
    if (blink ==3) {
      digitalWrite(redPin, HIGH);
    }else if (blink == 13) {
      digitalWrite(redPin, LOW);
    }
    if (blink ==4) {
      digitalWrite(ledPin, HIGH);
    }
    if (blink ==5) {
      digitalWrite(redPin, HIGH);
      digitalWrite(bluePin, HIGH);
    }else if (blink == 15) {
      digitalWrite(redPin, LOW);
      digitalWrite(bluePin, LOW);
    }
  }
}
