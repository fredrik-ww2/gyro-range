# Flygprov

## Flygprov 07

Utgångsläget är Flygprov 06, med samma styrning, nivellering, skada av, omstart och fria sikte.

- **Cockpit.** Knappen Cockpit, uppe till höger, byter till förstaperson. Där syns ramen, instrumentbrädan och siktet. Bakifrån går tillbaka till vyn bakom planet. Gyrot styr likadant i båda.
- **Skottljud.** Kanonen tystnar i samma ögonblick som avtryckaren släpps. Efterljudet på 1,4 sekunder spelas inte klart, ljudet loopar inte, och noderna staplas inte. Motorn som hör till flygningen ligger kvar som en enda nod och startas inte på nytt för varje skott.

## Flygprov 06

Utgångsläget är taggen `flyg-v05-bas` (samma commit som main hade innan den här rättningen).

- **Styrning.** När telefonen ligger ner följer nos upp och bank med skärmen, inte med telefonens egna kanter. Ett litet ryck där sensorn byter sätt att ange vinkeln (nära ±90 eller 180 grader) ger inte längre fullt roder. Centrera tar nästa färska prov som nolläge. Om sensorn tystnar går spaken tillbaka mot mitten.
- **Inställningar.** Automatisk nivellering kan slås av och på igen. Med Skada av blir spelaren inte nedskjuten. Mjukt markskydd hindrar störten vid markkontakt.
- **Paus och Flyg igen.** Ny omgång nollar träffar, pedaler, bomber i luften, ballonger och skada. Lyssnarna läggs inte på en gång till. Ljud som stängts när sidan lämnas skapas på nytt i stället för att försöka väcka ett dött ljud.
- **Siktet.** Ringen, instrumenten, farttexten och felsökningsraden ska inte ligga på varandra i liggande 844×390, 932×430 och 667×375, och inte heller i stående.
- **Bombuppdrag.** Markmål, bombsikte och fyra bomber från paketet `flyg-v05d.zip` ingår nu i spelet som länken laddar. Skuggor och tonmappning från samma paket lämnades ute så att telefonen inte ska bli varmare. Båda zip-filerna ligger kvar.

Det som fortfarande behöver en riktig iPhone: gyrots känsla, tillståndsfrågan, ljud efter hemknappen, och att bilden orkar hålla takten.
