#!/bin/sh
go build

if [[ "$OSTYPE" == "msys" ]] ||  [[ "$OSTYPE" == "win32" ]];
then
  "C:\Program Files\7-Zip\7z.exe" a -tzip release-windows.zip static/\* squirelo-voice-recognition.exe
else
  zip -r release-linux.zip static squirelo-voice-recognition
fi
